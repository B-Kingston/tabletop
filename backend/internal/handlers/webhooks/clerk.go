package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

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

// verifySvixSignature verifies a Svix webhook signature.
// Clerk uses Svix for webhooks. The signing secret starts with "whsec_" and is
// base64-encoded after the prefix. The signed payload is:
//   ${svix-id}.${svix-timestamp}.${body}
func (h *Handler) verifySvixSignature(body []byte, id, timestamp, signature string) bool {
	if !strings.HasPrefix(h.webhookSecret, "whsec_") {
		slog.Warn("webhook secret missing whsec_ prefix, treating as raw bytes")
		return false
	}

	decoded, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(h.webhookSecret, "whsec_"))
	if err != nil {
		slog.Warn("failed to decode webhook secret", "error", err)
		return false
	}

	signedContent := fmt.Sprintf("%s.%s.%s", id, timestamp, string(body))
	mac := hmac.New(sha256.New, decoded)
	mac.Write([]byte(signedContent))
	expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	parts := strings.Split(signature, ",")
	for _, part := range parts {
		if strings.TrimPrefix(part, "v1=") == expected || strings.TrimPrefix(part, "v1") == expected {
			return true
		}
	}
	return false
}

func (h *Handler) HandleClerkWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	if h.webhookSecret != "" {
		svixID := c.GetHeader("svix-id")
		svixTimestamp := c.GetHeader("svix-timestamp")
		svixSignature := c.GetHeader("svix-signature")

		if svixID == "" || svixTimestamp == "" || svixSignature == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing svix headers"})
			return
		}

		// Reject webhooks older than 5 minutes to prevent replay attacks
		ts, err := strconv.ParseInt(svixTimestamp, 10, 64)
		if err != nil || time.Since(time.Unix(ts, 0)) > 5*time.Minute {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "stale webhook"})
			return
		}

		if !h.verifySvixSignature(body, svixID, svixTimestamp, svixSignature) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
			return
		}
	} else {
		slog.Warn("CLERK_WEBHOOK_SECRET not set, skipping webhook signature verification")
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
