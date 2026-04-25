package tmdb

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	tmdbService *services.TMDBService
}

func NewHandler(tmdbService *services.TMDBService) *Handler {
	return &Handler{tmdbService: tmdbService}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	tmdb := r.Group("/tmdb")
	{
		tmdb.GET("/search", h.Search)
		tmdb.GET("/movie/:tmdb_id", h.GetMovie)
		tmdb.GET("/tv/:tmdb_id", h.GetTV)
	}
}

func (h *Handler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}

	searchType := c.DefaultQuery("type", "multi")

	var result *services.TMDBSearchResponse
	var err error

	ctx := c.Request.Context()
	switch searchType {
	case "movie":
		result, err = h.tmdbService.SearchMovies(ctx, query, page)
	case "tv":
		result, err = h.tmdbService.SearchTV(ctx, query, page)
	default:
		result, err = h.tmdbService.SearchMulti(ctx, query, page)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *Handler) GetMovie(c *gin.Context) {
	_, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	tmdbID, err := strconv.Atoi(c.Param("tmdb_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tmdb id"})
		return
	}

	details, err := h.tmdbService.GetMovieDetails(c.Request.Context(), tmdbID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": details})
}

func (h *Handler) GetTV(c *gin.Context) {
	_, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	tmdbID, err := strconv.Atoi(c.Param("tmdb_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tmdb id"})
		return
	}

	details, err := h.tmdbService.GetTVDetails(c.Request.Context(), tmdbID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": details})
}
