package wines

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	service *services.WineService
	db      *gorm.DB
}

func NewHandler(service *services.WineService, db *gorm.DB) *Handler {
	return &Handler{service: service, db: db}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	wines := r.Group("/wines")
	wines.Use(middleware.RequireInstanceMembership(h.db))
	{
		wines.POST("", h.Create)
		wines.GET("", h.List)
		wines.GET("/:wine_id", h.Get)
		wines.PATCH("/:wine_id", h.Update)
		wines.DELETE("/:wine_id", h.Delete)
	}
}

type CreateRequest struct {
	Name       string   `json:"name" binding:"required"`
	Producer   string   `json:"producer"`
	Type       string   `json:"type" binding:"required,oneof=red white rose sparkling port"`
	Vintage    *int     `json:"vintage"`
	Cost       *float64 `json:"cost"`
	Currency   string   `json:"currency"`
	Rating     *float32 `json:"rating"`
	Notes      string   `json:"notes"`
	ConsumedAt *string  `json:"consumedAt"`
}

type UpdateRequest struct {
	Name       *string  `json:"name"`
	Producer   *string  `json:"producer"`
	Type       *string  `json:"type" binding:"omitempty,oneof=red white rose sparkling port"`
	Vintage    *int     `json:"vintage"`
	Cost       *float64 `json:"cost"`
	Currency   *string  `json:"currency"`
	Rating     *float32 `json:"rating"`
	Notes      *string  `json:"notes"`
	ConsumedAt *string  `json:"consumedAt"`
}

func parseConsumedAt(s *string) (*time.Time, error) {
	if s == nil {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return nil, err
	}
	return &t, nil
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

	consumedAt, err := parseConsumedAt(req.ConsumedAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid consumedAt format, expected ISO 8601"})
		return
	}

	wine, err := h.service.Create(
		c.Request.Context(), instanceID, userID,
		req.Name, req.Producer, req.Type,
		req.Vintage, req.Cost, req.Currency,
		req.Rating, req.Notes, consumedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": wine})
}

func (h *Handler) List(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	wineType := c.Query("type")

	wines, err := h.service.List(c.Request.Context(), instanceID, wineType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": wines})
}

func (h *Handler) Get(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	wineID, err := uuid.Parse(c.Param("wine_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wine id"})
		return
	}

	wine, err := h.service.GetByID(c.Request.Context(), instanceID, wineID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": wine})
}

func (h *Handler) Update(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	wineID, err := uuid.Parse(c.Param("wine_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wine id"})
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

	consumedAt, err := parseConsumedAt(req.ConsumedAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid consumedAt format, expected ISO 8601"})
		return
	}

	wine, err := h.service.Update(
		c.Request.Context(), instanceID, wineID, userID,
		req.Name, req.Producer, req.Type,
		req.Vintage, req.Cost, req.Currency,
		req.Rating, req.Notes, consumedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": wine})
}

func (h *Handler) Delete(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	wineID, err := uuid.Parse(c.Param("wine_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wine id"})
		return
	}

	if err := h.service.Delete(c.Request.Context(), instanceID, wineID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "wine deleted"})
}
