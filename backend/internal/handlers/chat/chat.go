package chat

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	service *services.ChatService
}

func NewHandler(service *services.ChatService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	chat := r.Group("/chat")
	{
		chat.POST("/sessions", h.CreateSession)
		chat.GET("/sessions", h.ListSessions)
		chat.GET("/sessions/:session_id", h.GetSession)
		chat.POST("/sessions/:session_id/messages", h.SendMessage)
		chat.DELETE("/sessions/:session_id", h.DeleteSession)
		chat.POST("/generate-recipe", h.GenerateRecipe)
	}
}

type createSessionRequest struct {
	Title string `json:"title"`
}

func (h *Handler) CreateSession(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	var req createSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Title = "New Chat"
	}

	session, err := h.service.CreateSession(c.Request.Context(), instanceID, userID, req.Title)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": session})
}

func (h *Handler) ListSessions(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	sessions, err := h.service.ListSessions(c.Request.Context(), instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sessions})
}

func (h *Handler) GetSession(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("session_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	session, err := h.service.GetSession(c.Request.Context(), instanceID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": session})
}

type sendMessageRequest struct {
	Content string `json:"content" binding:"required"`
}

func (h *Handler) SendMessage(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("session_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var req sendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.service.SendMessage(c.Request.Context(), instanceID, sessionID, userID, "user", req.Content)
	if err != nil {
		if errors.Is(err, services.ErrSessionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
			return
		}
		if errors.Is(err, services.ErrRateLimiterUnavailable) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "OpenAI rate limiter unavailable"})
			return
		}
		if errors.Is(err, services.ErrDailyLimitExceeded) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "daily rate limit exceeded"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": msg})
}

func (h *Handler) DeleteSession(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	sessionID, err := uuid.Parse(c.Param("session_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	if err := h.service.DeleteSession(c.Request.Context(), instanceID, sessionID); err != nil {
		if errors.Is(err, services.ErrSessionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": nil})
}

type generateRecipeRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

func (h *Handler) GenerateRecipe(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	var req generateRecipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.service.GenerateRecipe(c.Request.Context(), instanceID, userID, req.Prompt)
	if err != nil {
		if errors.Is(err, services.ErrRateLimiterUnavailable) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "OpenAI rate limiter unavailable"})
			return
		}
		if errors.Is(err, services.ErrDailyLimitExceeded) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "daily rate limit exceeded"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}
