package ai

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	openaiService *services.OpenAIService
}

func NewHandler(openaiService *services.OpenAIService) *Handler {
	return &Handler{openaiService: openaiService}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	ai := r.Group("/ai")
	{
		ai.POST("/chat", h.Chat)
		ai.POST("/chat/stream", h.ChatStream)
	}
}

type chatRequest struct {
	Messages []struct {
		Role    string `json:"role" binding:"required"`
		Content string `json:"content" binding:"required"`
	} `json:"messages" binding:"required"`
}

func (h *Handler) Chat(c *gin.Context) {
	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	if err := h.openaiService.CheckRateLimit(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": err.Error()})
		return
	}

	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var messages []services.OpenAIMessage
	for _, m := range req.Messages {
		messages = append(messages, services.OpenAIMessage{Role: m.Role, Content: m.Content})
	}

	resp, err := h.openaiService.ChatCompletion(c.Request.Context(), messages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *Handler) ChatStream(c *gin.Context) {
	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	if err := h.openaiService.CheckRateLimit(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": err.Error()})
		return
	}

	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var messages []services.OpenAIMessage
	for _, m := range req.Messages {
		messages = append(messages, services.OpenAIMessage{Role: m.Role, Content: m.Content})
	}

	chunkCh, cancel, err := h.openaiService.ChatCompletionStream(c.Request.Context(), messages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cancel()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	c.Stream(func(w io.Writer) bool {
		select {
		case chunk, ok := <-chunkCh:
			if !ok {
				return false
			}
			data, err := json.Marshal(chunk)
			if err != nil {
				return false
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}
