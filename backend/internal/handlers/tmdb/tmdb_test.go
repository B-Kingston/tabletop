package tmdb

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tabletop/backend/internal/services"
)

func setupTMDBHandlerTest(t *testing.T) (*gin.Engine, *Handler, uuid.UUID) {
	gin.SetMode(gin.TestMode)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/search/multi" {
			resp := services.TMDBSearchResponse{
				Page: 1,
				Results: []services.TMDBSearchResult{
					{ID: 1, Title: "Batman", MediaType: "movie"},
				},
			}
			json.NewEncoder(w).Encode(resp)
			return
		}
		if r.URL.Path == "/search/movie" {
			resp := services.TMDBSearchResponse{
				Results: []services.TMDBSearchResult{
					{ID: 2, Title: "Inception"},
				},
			}
			json.NewEncoder(w).Encode(resp)
			return
		}
		if r.URL.Path == "/movie/550" {
			details := services.TMDBMovieDetails{ID: 550, Title: "Fight Club", Runtime: 139}
			json.NewEncoder(w).Encode(details)
			return
		}
		if r.URL.Path == "/tv/1396" {
			details := services.TMDBTVDetails{ID: 1396, Name: "Breaking Bad", NumberOfEpisodes: 62}
			json.NewEncoder(w).Encode(details)
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))

	tmdbSvc := services.NewTMDBService("test-key")
	tmdbSvc.SetBaseURL(server.URL)

	handler := NewHandler(tmdbSvc)

	r := gin.New()
	instanceID := uuid.New()

	t.Cleanup(func() { server.Close() })

	return r, handler, instanceID
}

func withInstance(c *gin.Context, instanceID uuid.UUID) {
	c.Set("instance_id", instanceID)
}

func TestHandler_Search(t *testing.T) {
	r, handler, instanceID := setupTMDBHandlerTest(t)

	r.GET("/tmdb/search", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Search(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/tmdb/search?q=batman&type=multi", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	results := data["results"].([]interface{})
	assert.Len(t, results, 1)
}

func TestHandler_Search_MissingQuery(t *testing.T) {
	r, handler, instanceID := setupTMDBHandlerTest(t)

	r.GET("/tmdb/search", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Search(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/tmdb/search", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_Search_MovieType(t *testing.T) {
	r, handler, instanceID := setupTMDBHandlerTest(t)

	r.GET("/tmdb/search", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Search(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/tmdb/search?q=test&type=movie", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_GetMovie(t *testing.T) {
	r, handler, instanceID := setupTMDBHandlerTest(t)

	r.GET("/tmdb/movie/:tmdb_id", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.GetMovie(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/tmdb/movie/550", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Fight Club", data["title"])
}

func TestHandler_GetMovie_InvalidID(t *testing.T) {
	r, handler, instanceID := setupTMDBHandlerTest(t)

	r.GET("/tmdb/movie/:tmdb_id", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.GetMovie(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/tmdb/movie/not-a-number", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_GetTV(t *testing.T) {
	r, handler, instanceID := setupTMDBHandlerTest(t)

	r.GET("/tmdb/tv/:tmdb_id", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.GetTV(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/tmdb/tv/1396", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Breaking Bad", data["name"])
}

func TestHandler_GetTV_InvalidID(t *testing.T) {
	r, handler, instanceID := setupTMDBHandlerTest(t)

	r.GET("/tmdb/tv/:tmdb_id", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.GetTV(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/tmdb/tv/abc", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
