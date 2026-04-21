package services

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// OpenAIService handles interactions with the OpenAI API
type OpenAIService struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	model      string
}

// OpenAIMessage is a single message in a chat completion
type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIRequest is the request body for chat completions
type OpenAIRequest struct {
	Model       string           `json:"model"`
	Messages    []OpenAIMessage  `json:"messages"`
	Temperature float64          `json:"temperature"`
	Stream      bool             `json:"stream"`
}

// OpenAIResponse is the response from chat completions
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

// OpenAIStreamChunk is a single chunk in a streaming response
type OpenAIStreamChunk struct {
	ID      string `json:"id"`
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		FinishReason *string `json:"finish_reason"`
	} `json:"choices"`
}

// RecipeSystemPrompt is the system prompt for recipe generation
const RecipeSystemPrompt = `You are a helpful recipe assistant. When asked to create or suggest a recipe, 
respond with valid JSON matching this schema:
{
  "title": "string",
  "description": "string",
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number,
  "ingredients": [{"name": "string", "quantity": "string", "unit": "string", "optional": false}],
  "steps": [{"orderIndex": number, "title": "string (optional)", "content": "string (markdown)", "durationMin": number or null}]
}

Always include prepTime, cookTime, and at least 2 steps. Use clear, concise markdown for step content.`

// NewOpenAIService creates a new OpenAI service
func NewOpenAIService(apiKey string) *OpenAIService {
	return &OpenAIService{
		apiKey:  apiKey,
		baseURL: "https://api.openai.com/v1",
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		model: "gpt-4o-mini",
	}
}

// ChatCompletion sends a chat completion request
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

// ChatCompletionStream sends a streaming chat completion request
// Returns a channel of chunks and a cancel function
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

// CheckRateLimit checks if a user has exceeded their daily OpenAI request limit
func (s *OpenAIService) CheckRateLimit(ctx context.Context, userID uuid.UUID, dailyLimit int) error {
	// TODO: Implement Redis-based rate limiting
	// Key: openai_rate:{userID}:{date}
	// Increment on each request, reject if >= dailyLimit
	return nil
}
