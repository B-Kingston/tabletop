package services

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// ErrRateLimiterUnavailable is returned when the rate limiter is unavailable
// and the service is running in production (fail-closed).
var ErrRateLimiterUnavailable = errors.New("rate limiter unavailable")

// ErrDailyLimitExceeded is returned when a user has exceeded their daily
// OpenAI request limit.
var ErrDailyLimitExceeded = errors.New("daily rate limit exceeded")

// ErrOpenAIUpstream is returned when the OpenAI API returns a non-OK status,
// times out, or produces an unreadable response.
var ErrOpenAIUpstream = errors.New("openai upstream error")

// ErrGeneratedRecipeInvalid is returned when OpenAI returns content that
// cannot be parsed or validated against the expected recipe schema.
var ErrGeneratedRecipeInvalid = errors.New("generated recipe invalid")

type RateLimiter interface {
	Incr(ctx context.Context, key string) *redis.IntCmd
	Expire(ctx context.Context, key string, expiration time.Duration) *redis.BoolCmd
	Get(ctx context.Context, key string) *redis.StringCmd
}

type OpenAIService struct {
	apiKey      string
	baseURL     string
	httpClient  *http.Client
	model       string
	rateLimiter RateLimiter
	dailyLimit  int
	production  bool
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model          string          `json:"model"`
	Messages       []OpenAIMessage `json:"messages"`
	Temperature    float64         `json:"temperature"`
	Stream         bool            `json:"stream"`
	ResponseFormat any             `json:"response_format,omitempty"`
}

type OpenAIResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

type OpenAIStreamChunk struct {
	ID      string `json:"id"`
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		FinishReason *string `json:"finish_reason"`
	} `json:"choices"`
}

// GeneratedRecipe is a structured recipe produced by the AI.
type GeneratedRecipe struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	PrepTime    int    `json:"prepTime"`
	CookTime    int    `json:"cookTime"`
	Servings    int    `json:"servings"`
	Ingredients []struct {
		Name     string `json:"name"`
		Quantity string `json:"quantity"`
		Unit     string `json:"unit"`
		Optional bool   `json:"optional"`
	} `json:"ingredients"`
	Steps []struct {
		OrderIndex  int    `json:"orderIndex"`
		Title       string `json:"title"`
		Content     string `json:"content"`
		DurationMin *int   `json:"durationMin"`
	} `json:"steps"`
	Tags []string `json:"tags"`
}

const RecipeSystemPrompt = `You are a helpful recipe assistant. When asked to create or suggest a recipe, respond with ONLY valid JSON and nothing else. No markdown formatting, no code fences, no explanation outside the JSON object.

Output a single JSON object matching this schema exactly:
{
  "title": "string",
  "description": "string",
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number,
  "ingredients": [{"name": "string", "quantity": "string", "unit": "string", "optional": false}],
  "steps": [{"orderIndex": number, "title": "string (optional)", "content": "string (markdown)", "durationMin": number or null}],
  "tags": ["string"]
}

Always include prepTime, cookTime, at least 2 steps, and 1-4 tags. Use clear, concise markdown for step content.`

func NewOpenAIService(apiKey string, rateLimiter RateLimiter, dailyLimit int, production bool) *OpenAIService {
	return &OpenAIService{
		apiKey:      apiKey,
		baseURL:     "https://api.openai.com/v1",
		httpClient:  &http.Client{Timeout: 60 * time.Second},
		model:       "gpt-5.4-mini-2026-03-17",
		rateLimiter: rateLimiter,
		dailyLimit:  dailyLimit,
		production:  production,
	}
}

func (s *OpenAIService) SetBaseURL(url string) {
	s.baseURL = url
}

func (s *OpenAIService) CheckRateLimit(ctx context.Context, userID uuid.UUID) error {
	if s.rateLimiter == nil {
		if s.production {
			return ErrRateLimiterUnavailable
		}
		return nil
	}
	key := fmt.Sprintf("openai_rate:%s:%s", userID.String(), time.Now().Format("2006-01-02"))
	count, err := s.rateLimiter.Incr(ctx, key).Result()
	if err != nil {
		if s.production {
			return ErrRateLimiterUnavailable
		}
		return nil
	}
	if count == 1 {
		s.rateLimiter.Expire(ctx, key, 24*time.Hour)
	}
	if count > int64(s.dailyLimit) {
		return fmt.Errorf("%w (%d requests)", ErrDailyLimitExceeded, s.dailyLimit)
	}
	return nil
}

func (s *OpenAIService) ChatCompletion(ctx context.Context, messages []OpenAIMessage) (*OpenAIResponse, error) {
	reqBody := OpenAIRequest{
		Model:       s.model,
		Messages:    messages,
		Temperature: 0.7,
		Stream:      false,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL+"/chat/completions", strings.NewReader(string(body)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

func (s *OpenAIService) GenerateRecipe(ctx context.Context, prompt string) (*GeneratedRecipe, error) {
	messages := []OpenAIMessage{
		{Role: "system", Content: RecipeSystemPrompt},
		{Role: "user", Content: prompt},
	}

	reqBody := OpenAIRequest{
		Model:          s.model,
		Messages:       messages,
		Temperature:    0.7,
		Stream:         false,
		ResponseFormat: map[string]string{"type": "json_object"},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to marshal request: %w", ErrOpenAIUpstream, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL+"/chat/completions", strings.NewReader(string(body)))
	if err != nil {
		return nil, fmt.Errorf("%w: failed to create request: %w", ErrOpenAIUpstream, err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to call OpenAI: %w", ErrOpenAIUpstream, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("%w: OpenAI returned %d: %s", ErrOpenAIUpstream, resp.StatusCode, string(respBody))
	}

	var result OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("%w: failed to decode response: %w", ErrOpenAIUpstream, err)
	}

	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("%w: openai returned no choices", ErrOpenAIUpstream)
	}

	raw := strings.TrimSpace(result.Choices[0].Message.Content)
	if raw == "" {
		return nil, fmt.Errorf("%w: openai returned empty content", ErrOpenAIUpstream)
	}

	// Strip markdown code fences if present (e.g. ```json ... ```)
	raw = stripMarkdownFences(raw)

	var recipe GeneratedRecipe
	if err := json.Unmarshal([]byte(raw), &recipe); err != nil {
		return nil, fmt.Errorf("%w: failed to parse generated recipe: %w", ErrGeneratedRecipeInvalid, err)
	}

	// Validate required fields
	if recipe.Title == "" {
		return nil, fmt.Errorf("%w: generated recipe is missing title", ErrGeneratedRecipeInvalid)
	}
	if len(recipe.Steps) < 2 {
		return nil, fmt.Errorf("%w: generated recipe must have at least 2 steps, got %d", ErrGeneratedRecipeInvalid, len(recipe.Steps))
	}
	if recipe.PrepTime < 0 {
		return nil, fmt.Errorf("%w: generated recipe prepTime must be non-negative, got %d", ErrGeneratedRecipeInvalid, recipe.PrepTime)
	}
	if recipe.CookTime < 0 {
		return nil, fmt.Errorf("%w: generated recipe cookTime must be non-negative, got %d", ErrGeneratedRecipeInvalid, recipe.CookTime)
	}

	return &recipe, nil
}

// stripMarkdownFences removes leading and trailing triple-backtick fences
// that some models wrap JSON in despite instructions not to.
func stripMarkdownFences(s string) string {
	s = strings.TrimSpace(s)
	// Strip ```json or ``` prefix
	if strings.HasPrefix(s, "```") {
		s = s[3:]
		// Remove optional language identifier (e.g. "json")
		if idx := strings.Index(s, "\n"); idx != -1 {
			s = s[idx+1:]
		}
	}
	// Strip trailing ```
	if strings.HasSuffix(s, "```") {
		s = s[:len(s)-3]
	}
	return strings.TrimSpace(s)
}

func (s *OpenAIService) ChatCompletionStream(ctx context.Context, messages []OpenAIMessage) (<-chan OpenAIStreamChunk, context.CancelFunc, error) {
	ctx, cancel := context.WithCancel(ctx)

	reqBody := OpenAIRequest{
		Model:       s.model,
		Messages:    messages,
		Temperature: 0.7,
		Stream:      true,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		cancel()
		return nil, nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL+"/chat/completions", strings.NewReader(string(body)))
	if err != nil {
		cancel()
		return nil, nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		cancel()
		return nil, nil, fmt.Errorf("failed to call OpenAI: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		cancel()
		return nil, nil, fmt.Errorf("OpenAI returned %d", resp.StatusCode)
	}

	chunkCh := make(chan OpenAIStreamChunk, 100)

	go func() {
		defer close(chunkCh)
		defer resp.Body.Close()

		scanner := bufio.NewScanner(resp.Body)
		scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

		for scanner.Scan() {
			line := scanner.Text()
			if !strings.HasPrefix(line, "data: ") {
				continue
			}
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				return
			}

			var chunk OpenAIStreamChunk
			if err := json.Unmarshal([]byte(data), &chunk); err != nil {
				continue
			}
			select {
			case chunkCh <- chunk:
			case <-ctx.Done():
				return
			}
		}
	}()

	return chunkCh, cancel, nil
}
