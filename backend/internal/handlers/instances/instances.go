package instances

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

// Handler handles instance-related HTTP requests
type Handler struct {
	service *services.InstanceService
	db      *gorm.DB
}

// NewHandler creates a new instance handler
func NewHandler(service *services.InstanceService, db *gorm.DB) *Handler {
	return &Handler{service: service, db: db}
}

// RegisterRoutes registers instance routes
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	// Routes that require auth but not instance membership
	instances := r.Group("/instances")
	{
		instances.POST("", h.Create)
		instances.GET("", h.List)
		instances.POST("/:instance_id/join", h.Join)
	}

	// Routes that require instance membership
	instance := r.Group("/instances/:instance_id")
	instance.Use(middleware.RequireAuth(&middleware.AuthConfig{}))
	instance.Use(middleware.RequireInstanceMembership(h.db))
	{
		instance.GET("", h.Get)
		instance.PATCH("", h.Update)
		instance.DELETE("", h.Delete)
		instance.POST("/leave", h.Leave)
		instance.GET("/members", h.ListMembers)
	}
}

// CreateRequest represents the request body for creating an instance
type CreateRequest struct {
	Name     string `json:"name" binding:"required,min=1,max=100"`
	Password string `json:"password" binding:"required,min=4,max=100"`
}

// Create handles instance creation
func (h *Handler) Create(c *gin.Context) {
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := middleware.ResolveUserID(c, h.db)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	instance, err := h.service.CreateInstance(c.Request.Context(), userID, req.Name, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": instance})
}

// List returns all instances the current user belongs to
func (h *Handler) List(c *gin.Context) {
	userID, ok := middleware.ResolveUserID(c, h.db)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	instances, err := h.service.ListUserInstances(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": instances})
}

// Get returns a single instance
func (h *Handler) Get(c *gin.Context) {
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

	instance, err := h.service.GetInstance(c.Request.Context(), instanceID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": instance})
}

// JoinRequest represents the request body for joining an instance
type JoinRequest struct {
	Password string `json:"password" binding:"required"`
}

// Join handles joining an instance with a password
func (h *Handler) Join(c *gin.Context) {
	instanceIDStr := c.Param("instance_id")
	instanceID, err := uuid.Parse(instanceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance id"})
		return
	}

	var req JoinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, ok := middleware.ResolveUserID(c, h.db)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	if err := h.service.JoinInstance(c.Request.Context(), instanceID, userID, req.Password); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "joined successfully"})
}

// UpdateRequest represents the request body for updating an instance
type UpdateRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

// Update handles instance updates
func (h *Handler) Update(c *gin.Context) {
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

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instance, err := h.service.UpdateInstance(c.Request.Context(), instanceID, userID, req.Name)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": instance})
}

// Delete handles instance deletion
func (h *Handler) Delete(c *gin.Context) {
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

	if err := h.service.DeleteInstance(c.Request.Context(), instanceID, userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "instance deleted"})
}

// Leave allows a member to leave an instance
func (h *Handler) Leave(c *gin.Context) {
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

	if err := h.service.LeaveInstance(c.Request.Context(), instanceID, userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "left instance"})
}

// ListMembers returns the members of an instance
func (h *Handler) ListMembers(c *gin.Context) {
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

	instance, err := h.service.GetInstance(c.Request.Context(), instanceID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": instance.Members})
}
