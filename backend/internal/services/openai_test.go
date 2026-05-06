package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOpenAIService_ChatCompletion(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "Bearer test-key", r.Header.Get("Authorization"))

		var req OpenAIRequest
		require.NoError(t, json.NewDecoder(r.Body).Decode(&req))
		assert.Equal(t, "gpt-4o-mini", req.Model)
		assert.False(t, req.Stream)

		resp := OpenAIResponse{
			ID: "chatcmpl-123",
			Choices: []struct {
				Message struct {
					Role    string `json:"role"`
					Content string `json:"content"`
				} `json:"message"`
				FinishReason string `json:"finish_reason"`
			}{
				{Message: struct {
					Role    string `json:"role"`
					Content string `json:"content"`
				}{Role: "assistant", Content: "Hello! How can I help?"}, FinishReason: "stop"},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	svc := NewOpenAIService("test-key", nil, 20, false)
	svc.baseURL = server.URL

	resp, err := svc.ChatCompletion(context.Background(), []OpenAIMessage{
		{Role: "user", Content: "Hello"},
	})
	require.NoError(t, err)
	assert.Equal(t, "chatcmpl-123", resp.ID)
	assert.Len(t, resp.Choices, 1)
	assert.Equal(t, "Hello! How can I help?", resp.Choices[0].Message.Content)
}

func TestOpenAIService_ChatCompletion_ErrorResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		w.Write([]byte(`{"error":{"message":"Rate limit exceeded"}}`))
	}))
	defer server.Close()

	svc := NewOpenAIService("test-key", nil, 20, false)
	svc.baseURL = server.URL

	_, err := svc.ChatCompletion(context.Background(), []OpenAIMessage{
		{Role: "user", Content: "Hello"},
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "429")
}

func TestOpenAIService_ChatCompletionStream(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req OpenAIRequest
		require.NoError(t, json.NewDecoder(r.Body).Decode(&req))
		assert.True(t, req.Stream)

		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)

		chunks := []string{
			`{"id":"1","choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}`,
			`{"id":"1","choices":[{"delta":{"content":" world"},"finish_reason":null}]}`,
			`[DONE]`,
		}
		for _, chunk := range chunks {
			w.Write([]byte("data: " + chunk + "\n\n"))
		}
	}))
	defer server.Close()

	svc := NewOpenAIService("test-key", nil, 20, false)
	svc.baseURL = server.URL

	ch, cancel, err := svc.ChatCompletionStream(context.Background(), []OpenAIMessage{
		{Role: "user", Content: "Hi"},
	})
	require.NoError(t, err)
	defer cancel()

	var contents []string
	for chunk := range ch {
		if len(chunk.Choices) > 0 {
			contents = append(contents, chunk.Choices[0].Delta.Content)
		}
	}
	assert.Equal(t, []string{"Hello", " world"}, contents)
}

func TestOpenAIService_ChatCompletionStream_ErrorResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	svc := NewOpenAIService("test-key", nil, 20, false)
	svc.baseURL = server.URL

	_, _, err := svc.ChatCompletionStream(context.Background(), []OpenAIMessage{
		{Role: "user", Content: "Hi"},
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "500")
}

func TestOpenAIService_CheckRateLimit_NilLimiter(t *testing.T) {
	svc := NewOpenAIService("test-key", nil, 20, false)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.NoError(t, err)
}

func TestOpenAIService_CheckRateLimit_NilLimiter_Production(t *testing.T) {
	svc := NewOpenAIService("test-key", nil, 20, true)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrRateLimiterUnavailable)
}

func TestOpenAIService_CheckRateLimit_WithinLimit(t *testing.T) {
	svc := NewOpenAIService("test-key", &mockRateLimiter{incrVal: 1, expireVal: true}, 5, false)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.NoError(t, err)
}

func TestOpenAIService_CheckRateLimit_ExceedsLimit(t *testing.T) {
	svc := NewOpenAIService("test-key", &mockRateLimiter{incrVal: 21, expireVal: true}, 20, false)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "rate limit exceeded")
}

func TestOpenAIService_CheckRateLimit_SetsExpiryOnFirst(t *testing.T) {
	mock := &mockRateLimiter{incrVal: 1, expireVal: true}
	svc := NewOpenAIService("test-key", mock, 20, false)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.NoError(t, err)
	assert.True(t, mock.expireCalled)
}

func TestOpenAIService_CheckRateLimit_NoExpiryOnSubsequent(t *testing.T) {
	mock := &mockRateLimiter{incrVal: 5, expireVal: true}
	svc := NewOpenAIService("test-key", mock, 20, false)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.NoError(t, err)
	assert.False(t, mock.expireCalled)
}

func TestOpenAIService_CheckRateLimit_RedisError_NotProduction(t *testing.T) {
	svc := NewOpenAIService("test-key", &mockRateLimiter{incrErr: assert.AnError}, 20, false)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.NoError(t, err)
}

func TestOpenAIService_CheckRateLimit_RedisError_Production(t *testing.T) {
	svc := NewOpenAIService("test-key", &mockRateLimiter{incrErr: assert.AnError}, 20, true)
	err := svc.CheckRateLimit(context.Background(), uuid.New())
	assert.ErrorIs(t, err, ErrRateLimiterUnavailable)
}

type mockRateLimiter struct {
	incrVal     int64
	incrErr     error
	expireVal   bool
	expireErr   error
	expireCalled bool
}

func (m *mockRateLimiter) Incr(ctx context.Context, key string) *redis.IntCmd {
	cmd := redis.NewIntCmd(ctx)
	if m.incrErr != nil {
		cmd.SetErr(m.incrErr)
	} else {
		cmd.SetVal(m.incrVal)
	}
	return cmd
}

func (m *mockRateLimiter) Expire(ctx context.Context, key string, expiration time.Duration) *redis.BoolCmd {
	m.expireCalled = true
	cmd := redis.NewBoolCmd(ctx)
	if m.expireErr != nil {
		cmd.SetErr(m.expireErr)
	} else {
		cmd.SetVal(m.expireVal)
	}
	return cmd
}

func (m *mockRateLimiter) Get(ctx context.Context, key string) *redis.StringCmd {
	cmd := redis.NewStringCmd(ctx)
	cmd.SetVal("")
	return cmd
}
