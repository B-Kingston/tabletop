package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

// Handler handles authentication-related HTTP requests
type Handler struct {
	userRepo *repositories.UserRepository
}

// NewHandler creates a new auth handler
func NewHandler(userRepo *repositories.UserRepository) *Handler {
	return &Handler{userRepo: userRepo}
}

// RegisterRoutes registers auth routes
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	{
		auth.POST("/clerk-sync", h.ClerkSync)
		auth.GET("/me", h.Me)
	}
}

// ClerkSyncRequest represents the request body for syncing a Clerk user
type ClerkSyncRequest struct {
	ClerkID   string `json:"clerkId" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatarUrl"`
}

// ClerkSync creates or updates a user from Clerk webhook or frontend sync
func (h *Handler) ClerkSync(c *gin.Context) {
	var req ClerkSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify the request is authenticated (Clerk middleware sets this)
	userCtx, ok := middleware.GetUserContext(c)
	if !ok || userCtx.ClerkID != req.ClerkID {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	existing, err := h.userRepo.GetByClerkID(c.Request.Context(), req.ClerkID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existing == nil {
		user := &models.User{
			ClerkID:   req.ClerkID,
			Email:     req.Email,
			Name:      req.Name,
			AvatarURL: req.AvatarURL,
		}
		if err := h.userRepo.Create(c.Request.Context(), user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"data": user})
		return
	}

	// Update existing user
	existing.Email = req.Email
	existing.Name = req.Name
	existing.AvatarURL = req.AvatarURL
	if err := h.userRepo.Update(c.Request.Context(), existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": existing})
}

// Me returns the current authenticated user's profile
func (h *Handler) Me(c *gin.Context) {
	userCtx, ok := middleware.GetUserContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userRepo.GetByClerkID(c.Request.Context(), userCtx.ClerkID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}
