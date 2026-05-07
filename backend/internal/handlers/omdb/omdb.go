package omdb

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	omdbService *services.OMDBService
}

func NewHandler(omdbService *services.OMDBService) *Handler {
	return &Handler{omdbService: omdbService}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	omdb := r.Group("/omdb")
	{
		omdb.GET("/search", h.Search)
		omdb.GET("/:omdb_id", h.Detail)
	}
}

func (h *Handler) Search(c *gin.Context) {
	if _, ok := middleware.GetInstanceID(c); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	if page > 100 {
		page = 100
	}

	result, err := h.omdbService.Search(c.Request.Context(), query, page, c.Query("type"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *Handler) Detail(c *gin.Context) {
	if _, ok := middleware.GetInstanceID(c); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	imdbID := c.Param("omdb_id")
	if imdbID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "omdb_id is required"})
		return
	}

	result, err := h.omdbService.GetByID(c.Request.Context(), imdbID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}
