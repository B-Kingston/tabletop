package omdb

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

func setupOMDBHandlerTest(t *testing.T) (*gin.Engine, *Handler, uuid.UUID) {
	gin.SetMode(gin.TestMode)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/", r.URL.Path)

		if r.URL.Query().Get("s") != "" {
			assert.Equal(t, "batman", r.URL.Query().Get("s"))
			assert.Equal(t, "1", r.URL.Query().Get("page"))
			if r.URL.Query().Get("type") != "" {
				assert.Equal(t, "series", r.URL.Query().Get("type"))
			}

			resp := map[string]interface{}{
				"Search": []map[string]string{
					{"imdbID": "tt0372784", "Title": "Batman Begins", "Year": "2005", "Type": "movie"},
				},
				"totalResults": "1",
				"Response":     "True",
			}
			require.NoError(t, json.NewEncoder(w).Encode(resp))
			return
		}

		if r.URL.Query().Get("i") != "" {
			assert.Equal(t, "tt0372784", r.URL.Query().Get("i"))
			resp := map[string]interface{}{
				"Title":    "Batman Begins",
				"Year":     "2005",
				"Rated":    "PG-13",
				"Runtime":  "140 min",
				"Genre":    "Action, Crime, Drama",
				"Director": "Christopher Nolan",
				"Actors":   "Christian Bale, Michael Caine",
				"Plot":     "After training with his mentor, Batman begins his fight.",
				"Poster":   "https://example.com/poster.jpg",
				"Ratings": []map[string]string{
					{"Source": "Internet Movie Database", "Value": "8.2/10"},
					{"Source": "Rotten Tomatoes", "Value": "84%"},
				},
				"imdbRating": "8.2",
				"imdbVotes":  "1,500,000",
				"imdbID":     "tt0372784",
				"Type":       "movie",
				"BoxOffice":  "$373,661,198",
				"Response":   "True",
			}
			require.NoError(t, json.NewEncoder(w).Encode(resp))
			return
		}

		t.Fatal("unexpected OMDb request")
	}))
	t.Cleanup(server.Close)

	omdbSvc := services.NewOMDBService("test-key", nil)
	omdbSvc.SetBaseURL(server.URL)

	handler := NewHandler(omdbSvc)
	return gin.New(), handler, uuid.New()
}

func withInstance(c *gin.Context, instanceID uuid.UUID) {
	c.Set("instance_id", instanceID)
}

func TestHandler_Search(t *testing.T) {
	r, handler, instanceID := setupOMDBHandlerTest(t)

	r.GET("/omdb/search", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Search(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/omdb/search?q=batman", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Data services.OMDBSearchResponse `json:"data"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	require.Len(t, resp.Data.Results, 1)
	assert.Equal(t, "tt0372784", resp.Data.Results[0].OMDBID)
}

func TestHandler_Search_MissingQuery(t *testing.T) {
	r, handler, instanceID := setupOMDBHandlerTest(t)

	r.GET("/omdb/search", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Search(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/omdb/search", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_Search_TVTypeAndInvalidPage(t *testing.T) {
	r, handler, instanceID := setupOMDBHandlerTest(t)

	r.GET("/omdb/search", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Search(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/omdb/search?q=batman&type=tv&page=0", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Detail(t *testing.T) {
	r, handler, instanceID := setupOMDBHandlerTest(t)

	r.GET("/omdb/:omdb_id", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Detail(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/omdb/tt0372784", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Data services.OMDBDetail `json:"data"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "Batman Begins", resp.Data.Title)
	assert.Equal(t, "8.2", resp.Data.IMDbRating)
	assert.Equal(t, "movie", resp.Data.Type)
	require.Len(t, resp.Data.Ratings, 2)
	assert.Equal(t, "Internet Movie Database", resp.Data.Ratings[0].Source)
}

func TestHandler_Detail_MissingID(t *testing.T) {
	r, handler, instanceID := setupOMDBHandlerTest(t)

	r.GET("/omdb/:omdb_id", func(c *gin.Context) {
		withInstance(c, instanceID)
		handler.Detail(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/omdb/", nil)
	r.ServeHTTP(w, req)

	// Gin returns 404 for empty path param before handler is invoked
	assert.Equal(t, http.StatusNotFound, w.Code)
}
