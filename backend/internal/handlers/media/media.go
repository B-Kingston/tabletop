package media

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	service *services.MediaService
}

func NewHandler(service *services.MediaService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	media := r.Group("/media")
	{
		media.POST("", h.Create)
		media.GET("", h.List)
		media.GET("/:media_id", h.Get)
		media.PATCH("/:media_id", h.Update)
		media.DELETE("/:media_id", h.Delete)
	}
}

type createRequest struct {
	TMDBID      int     `json:"tmdbId" binding:"required"`
	Type        string  `json:"type" binding:"required,oneof=movie tv"`
	Title       string  `json:"title" binding:"required"`
	Overview    string  `json:"overview"`
	PosterPath  string  `json:"posterPath"`
	ReleaseDate *string `json:"releaseDate"`
}

type updateRequest struct {
	Status          string   `json:"status" binding:"omitempty,oneof=planning watching completed dropped"`
	Rating          *float32 `json:"rating" binding:"omitempty,min=0,max=5"`
	Review          string   `json:"review"`
	PlanToWatchDate *string  `json:"planToWatchDate"`
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

	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var releaseDate *time.Time
	if req.ReleaseDate != nil {
		t, err := time.Parse("2006-01-02", *req.ReleaseDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid releaseDate format, expected YYYY-MM-DD"})
			return
		}
		releaseDate = &t
	}

	item, err := h.service.Create(
		c.Request.Context(),
		instanceID,
		userID,
		req.TMDBID,
		req.Type,
		req.Title,
		req.Overview,
		req.PosterPath,
		releaseDate,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func (h *Handler) List(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	status := c.Query("status")
	mediaType := c.Query("type")

	items, err := h.service.List(c.Request.Context(), instanceID, status, mediaType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *Handler) Get(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	mediaID, err := uuid.Parse(c.Param("media_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	item, err := h.service.GetByID(c.Request.Context(), instanceID, mediaID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *Handler) Update(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	mediaID, err := uuid.Parse(c.Param("media_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	var req updateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var planToWatchDate *time.Time
	if req.PlanToWatchDate != nil && *req.PlanToWatchDate != "" {
		t, err := time.Parse("2006-01-02", *req.PlanToWatchDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid planToWatchDate format, expected YYYY-MM-DD"})
			return
		}
		planToWatchDate = &t
	}

	item, err := h.service.Update(c.Request.Context(), instanceID, mediaID, userID, req.Status, req.Rating, req.Review, planToWatchDate)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

func (h *Handler) Delete(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	mediaID, err := uuid.Parse(c.Param("media_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	if err := h.service.Delete(c.Request.Context(), instanceID, mediaID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": nil})
}
