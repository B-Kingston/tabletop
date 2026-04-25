package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

type Handler struct {
	userRepo      repositories.UserRepository
	webhookSecret string
}

func NewHandler(userRepo repositories.UserRepository, webhookSecret string) *Handler {
	return &Handler{userRepo: userRepo, webhookSecret: webhookSecret}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	webhooks := r.Group("/webhooks")
	{
		webhooks.POST("/clerk", h.HandleClerkWebhook)
	}
}

type ClerkWebhookEvent struct {
	Type string `json:"type"`
	Data struct {
		ID             string `json:"id"`
		EmailAddresses []struct {
			EmailAddress string `json:"email_address"`
		} `json:"email_addresses"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		ImageURL  string `json:"image_url"`
	} `json:"data"`
}

func (h *Handler) verifySignature(body []byte, sig string) bool {
	mac := hmac.New(sha256.New, []byte(h.webhookSecret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(sig), []byte(expected))
}

func (h *Handler) HandleClerkWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	sig := c.GetHeader("svix-signature")
	if sig == "" {
		sig = c.GetHeader("X-Signature")
	}

	if h.webhookSecret != "" && !h.verifySignature(body, sig) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	var event ClerkWebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	ctx := c.Request.Context()

	switch event.Type {
	case "user.created":
		email := ""
		if len(event.Data.EmailAddresses) > 0 {
			email = event.Data.EmailAddresses[0].EmailAddress
		}
		name := event.Data.FirstName
		if event.Data.LastName != "" {
			if name != "" {
				name += " "
			}
			name += event.Data.LastName
		}
		user := &models.User{
			ClerkID:   event.Data.ID,
			Email:     email,
			Name:      name,
			AvatarURL: event.Data.ImageURL,
		}
		if err := h.userRepo.Create(ctx, user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": user})

	case "user.updated":
		existing, err := h.userRepo.GetByClerkID(ctx, event.Data.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if existing == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		if len(event.Data.EmailAddresses) > 0 {
			existing.Email = event.Data.EmailAddresses[0].EmailAddress
		}
		name := event.Data.FirstName
		if event.Data.LastName != "" {
			if name != "" {
				name += " "
			}
			name += event.Data.LastName
		}
		if name != "" {
			existing.Name = name
		}
		if event.Data.ImageURL != "" {
			existing.AvatarURL = event.Data.ImageURL
		}
		if err := h.userRepo.Update(ctx, existing); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": existing})

	case "user.deleted":
		existing, err := h.userRepo.GetByClerkID(ctx, event.Data.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if existing == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		if err := h.userRepo.Delete(ctx, existing.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": nil})

	default:
		c.JSON(http.StatusOK, gin.H{"message": "unhandled event type"})
	}
}
