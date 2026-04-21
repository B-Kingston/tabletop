package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
)

// DBDependency interface for database access in middleware
type DBDependency interface {
	Model(value interface{}) *gorm.DB
}

// RequireInstanceMembership verifies the authenticated user belongs to the instance
func RequireInstanceMembership(db DBDependency) gin.HandlerFunc {
	return func(c *gin.Context) {
		instanceIDStr := c.Param("instance_id")
		if instanceIDStr == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "instance_id is required"})
			return
		}

		instanceID, err := uuid.Parse(instanceIDStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid instance_id"})
			return
		}

		userCtx, exists := GetUserContext(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}

		// Look up internal user ID by ClerkID
		var user models.User
		if err := db.Model(&models.User{}).Where("clerk_id = ?", userCtx.ClerkID).First(&user).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		// Check membership
		var count int64
		if err := db.Model(&models.InstanceMembership{}).
			Where("instance_id = ? AND user_id = ?", instanceID, user.ID).
			Count(&count).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to verify membership"})
			return
		}

		if count == 0 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "not a member of this instance"})
			return
		}

		// Set internal user ID and instance ID in context for downstream handlers
		c.Set("internal_user_id", user.ID)
		c.Set("instance_id", instanceID)
		c.Next()
	}
}

// GetInstanceID retrieves the validated instance ID from context
func GetInstanceID(c *gin.Context) (uuid.UUID, bool) {
	id, exists := c.Get("instance_id")
	if !exists {
		return uuid.UUID{}, false
	}
	instanceID, ok := id.(uuid.UUID)
	return instanceID, ok
}

// GetInternalUserID retrieves the internal database user ID from context
func GetInternalUserID(c *gin.Context) (uuid.UUID, bool) {
	id, exists := c.Get("internal_user_id")
	if !exists {
		return uuid.UUID{}, false
	}
	userID, ok := id.(uuid.UUID)
	return userID, ok
}
