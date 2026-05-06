package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/redis/go-redis/v9"
	"tabletop/backend/internal/services"
)

func setupAIHandlerTest(t *testing.T) (*gin.Engine, *Handler, uuid.UUID) {
	gin.SetMode(gin.TestMode)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/chat/completions" {
			var req services.OpenAIRequest
			require.NoError(t, json.NewDecoder(r.Body).Decode(&req))

			if req.Stream {
				w.Header().Set("Content-Type", "text/event-stream")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte("data: {\"id\":\"1\",\"choices\":[{\"delta\":{\"content\":\"Hi\"},\"finish_reason\":null}]}\n\n"))
				w.Write([]byte("data: [DONE]\n\n"))
				return
			}

			resp := services.OpenAIResponse{
				ID: "chatcmpl-test",
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
					}{Role: "assistant", Content: "Here is a recipe"}, FinishReason: "stop"},
				},
			}
			json.NewEncoder(w).Encode(resp)
		}
	}))

	mockLimiter := &testRateLimiter{incrVal: 1, expireVal: true}
	openaiSvc := services.NewOpenAIService("test-key", mockLimiter, 20, false)
	openaiSvc.SetBaseURL(server.URL)

	handler := NewHandler(openaiSvc)
	userID := uuid.New()

	t.Cleanup(func() { server.Close() })

	return gin.New(), handler, userID
}

type testRateLimiter struct {
	incrVal     int64
	expireVal   bool
	expireCalled bool
}

func (m *testRateLimiter) Incr(ctx context.Context, key string) *redis.IntCmd {
	cmd := redis.NewIntCmd(ctx)
	cmd.SetVal(m.incrVal)
	return cmd
}

func (m *testRateLimiter) Expire(ctx context.Context, key string, expiration time.Duration) *redis.BoolCmd {
	m.expireCalled = true
	cmd := redis.NewBoolCmd(ctx)
	cmd.SetVal(m.expireVal)
	return cmd
}

func (m *testRateLimiter) Get(ctx context.Context, key string) *redis.StringCmd {
	cmd := redis.NewStringCmd(ctx)
	return cmd
}

func TestHandler_Chat(t *testing.T) {
	r, handler, userID := setupAIHandlerTest(t)

	r.POST("/ai/chat", func(c *gin.Context) {
		c.Set("internal_user_id", userID)
		handler.Chat(c)
	})

	body := chatRequest{
		Messages: []struct {
			Role    string `json:"role" binding:"required"`
			Content string `json:"content" binding:"required"`
		}{
			{Role: "user", Content: "Hello"},
		},
	}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/ai/chat", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "chatcmpl-test", data["id"])
}

func TestHandler_Chat_MissingUser(t *testing.T) {
	r, handler, _ := setupAIHandlerTest(t)

	r.POST("/ai/chat", handler.Chat)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/ai/chat", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestHandler_Chat_InvalidBody(t *testing.T) {
	r, handler, userID := setupAIHandlerTest(t)

	r.POST("/ai/chat", func(c *gin.Context) {
		c.Set("internal_user_id", userID)
		handler.Chat(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/ai/chat", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_Chat_RateLimitExceeded(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	defer server.Close()

	mockLimiter := &testRateLimiter{incrVal: 999, expireVal: true}
	openaiSvc := services.NewOpenAIService("test-key", mockLimiter, 20, false)
	openaiSvc.SetBaseURL(server.URL)

	handler := NewHandler(openaiSvc)
	userID := uuid.New()

	r := gin.New()
	r.POST("/ai/chat", func(c *gin.Context) {
		c.Set("internal_user_id", userID)
		handler.Chat(c)
	})

	body := chatRequest{
		Messages: []struct {
			Role    string `json:"role" binding:"required"`
			Content string `json:"content" binding:"required"`
		}{
			{Role: "user", Content: "Hello"},
		},
	}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/ai/chat", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

func TestHandler_ChatStream(t *testing.T) {
	t.Skip("SSE streaming requires http.CloseNotifier which httptest.ResponseRecorder does not implement")
}
