package messages

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Broadcaster interface {
	Broadcast(instanceID uuid.UUID, message []byte)
}

type Handler struct {
	service     *services.MemberMessageService
	broadcaster Broadcaster
}

func NewHandler(service *services.MemberMessageService, broadcaster Broadcaster) *Handler {
	return &Handler{service: service, broadcaster: broadcaster}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	messages := r.Group("/messages")
	{
		messages.GET("", h.ListMessages)
		messages.POST("", h.SendMessage)
	}
}

func (h *Handler) ListMessages(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	messages, err := h.service.ListMessages(c.Request.Context(), instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": messages})
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

	var req sendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message, err := h.service.SendMessage(c.Request.Context(), instanceID, userID, req.Content)
	if err != nil {
		if errors.Is(err, services.ErrMemberMessageContentRequired) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if h.broadcaster != nil {
		event, err := json.Marshal(gin.H{"type": "member_message.created", "data": message})
		if err == nil {
			h.broadcaster.Broadcast(instanceID, event)
		}
	}

	c.JSON(http.StatusCreated, gin.H{"data": message})
}
