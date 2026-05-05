package nights

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	service *services.NightService
	db      *gorm.DB
}

func NewHandler(service *services.NightService, db *gorm.DB) *Handler {
	return &Handler{service: service, db: db}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	nights := r.Group("/nights")
	nights.Use(middleware.RequireInstanceMembership(h.db))
	{
		nights.POST("", h.Create)
		nights.GET("", h.List)
		nights.GET("/:night_id", h.Get)
		nights.PATCH("/:night_id", h.Update)
		nights.DELETE("/:night_id", h.Delete)
	}
}

type CreateRequest struct {
	Name     *string `json:"name"`
	WineID   *string `json:"wineId"`
	RecipeID *string `json:"recipeId"`
	MediaID  *string `json:"mediaId"`
}

type UpdateRequest struct {
	Name        *string `json:"name"`
	WineID      *string `json:"wineId"`
	RecipeID    *string `json:"recipeId"`
	MediaID     *string `json:"mediaId"`
	ClearWine   *bool   `json:"clearWine"`
	ClearRecipe *bool   `json:"clearRecipe"`
	ClearMedia  *bool   `json:"clearMedia"`
}

func parseOptionalUUID(s *string) (*uuid.UUID, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*s)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (h *Handler) Create(c *gin.Context) {
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

	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wineID, err := parseOptionalUUID(req.WineID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wine id"})
		return
	}
	recipeID, err := parseOptionalUUID(req.RecipeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipe id"})
		return
	}
	mediaID, err := parseOptionalUUID(req.MediaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	var name string
	if req.Name != nil {
		name = *req.Name
	}

	night, err := h.service.Create(c.Request.Context(), instanceID, userID, name, wineID, recipeID, mediaID)
	if err != nil {
		// Distinguish between validation errors (FK not found) and unexpected errors
		if err.Error() == "wine not found in this instance" ||
			err.Error() == "recipe not found in this instance" ||
			err.Error() == "media not found in this instance" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": night})
}

func (h *Handler) List(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	nights, err := h.service.List(c.Request.Context(), instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": nights})
}

func (h *Handler) Get(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	nightID, err := uuid.Parse(c.Param("night_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid night id"})
		return
	}

	night, err := h.service.GetByID(c.Request.Context(), instanceID, nightID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": night})
}

func (h *Handler) Update(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	nightID, err := uuid.Parse(c.Param("night_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid night id"})
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

	wineID, err := parseOptionalUUID(req.WineID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wine id"})
		return
	}
	recipeID, err := parseOptionalUUID(req.RecipeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipe id"})
		return
	}
	mediaID, err := parseOptionalUUID(req.MediaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	night, err := h.service.Update(
		c.Request.Context(), instanceID, nightID, userID,
		req.Name, wineID, recipeID, mediaID,
		req.ClearWine, req.ClearRecipe, req.ClearMedia,
	)
	if err != nil {
		if err.Error() == "night not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "wine not found in this instance" ||
			err.Error() == "recipe not found in this instance" ||
			err.Error() == "media not found in this instance" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": night})
}

func (h *Handler) Delete(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	nightID, err := uuid.Parse(c.Param("night_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid night id"})
		return
	}

	if err := h.service.Delete(c.Request.Context(), instanceID, nightID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "night deleted"})
}
