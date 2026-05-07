package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

func TestOMDBService_SearchBuildsRequestAndMapsResults(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/", r.URL.Path)
		assert.Equal(t, "test-key", r.URL.Query().Get("apikey"))
		assert.Equal(t, "batman", r.URL.Query().Get("s"))
		assert.Equal(t, "2", r.URL.Query().Get("page"))
		assert.Equal(t, "movie", r.URL.Query().Get("type"))

		resp := omdbSearchAPIResponse{
			Search: []omdbSearchAPIResult{
				{IMDbID: "tt0372784", Title: "Batman Begins", Year: "2005", Type: "movie"},
			},
			TotalResults: "1",
			Response:     "True",
		}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	svc := NewOMDBService("test-key", nil)
	svc.SetBaseURL(server.URL)

	resp, err := svc.Search(context.Background(), "batman", 2, "movie")
	require.NoError(t, err)
	require.Len(t, resp.Results, 1)
	assert.Equal(t, 2, resp.Page)
	assert.Equal(t, 1, resp.TotalResults)
	assert.Equal(t, "tt0372784", resp.Results[0].OMDBID)
	assert.Equal(t, "Batman Begins", resp.Results[0].Title)
	assert.Equal(t, "movie", resp.Results[0].Type)
	assert.Equal(t, "2005", resp.Results[0].ReleaseYear)
}

func TestOMDBService_SearchMapsSeriesToTV(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "series", r.URL.Query().Get("type"))
		resp := omdbSearchAPIResponse{
			Search: []omdbSearchAPIResult{
				{IMDbID: "tt0903747", Title: "Breaking Bad", Year: "2008-2013", Type: "series"},
			},
			TotalResults: "1",
			Response:     "True",
		}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	svc := NewOMDBService("test-key", nil)
	svc.SetBaseURL(server.URL)

	resp, err := svc.Search(context.Background(), "breaking bad", 1, "tv")
	require.NoError(t, err)
	require.Len(t, resp.Results, 1)
	assert.Equal(t, "tv", resp.Results[0].Type)
	assert.Equal(t, "2008-2013", resp.Results[0].ReleaseYear)
}

func TestOMDBService_SearchReturnsAPIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := omdbSearchAPIResponse{Response: "False", Error: "Movie not found!"}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	svc := NewOMDBService("test-key", nil)
	svc.SetBaseURL(server.URL)

	resp, err := svc.Search(context.Background(), "zzzz", 1, "")
	require.NoError(t, err)
	assert.Empty(t, resp.Results)
	assert.Equal(t, 0, resp.TotalResults)
}

func TestOMDBService_SearchByIMDbID(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "tt0372784", r.URL.Query().Get("i"))
		resp := map[string]interface{}{
			"Title":      "Batman Begins",
			"Year":       "2005",
			"Rated":      "PG-13",
			"Runtime":    "140 min",
			"Genre":      "Action, Crime, Drama",
			"Director":   "Christopher Nolan",
			"Actors":     "Christian Bale, Michael Caine",
			"Plot":       "After training with his mentor, Batman begins his fight.",
			"Poster":     "https://example.com/poster.jpg",
			"imdbRating": "8.2",
			"imdbVotes":  "1,500,000",
			"imdbID":     "tt0372784",
			"Type":       "movie",
			"BoxOffice":  "$373,661,198",
			"Response":   "True",
		}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	svc := NewOMDBService("test-key", nil)
	svc.SetBaseURL(server.URL)

	resp, err := svc.Search(context.Background(), "tt0372784", 1, "")
	require.NoError(t, err)
	require.Len(t, resp.Results, 1)
	assert.Equal(t, "tt0372784", resp.Results[0].OMDBID)
	assert.Equal(t, "Batman Begins", resp.Results[0].Title)
	assert.Equal(t, "movie", resp.Results[0].Type)
	assert.Equal(t, "2005", resp.Results[0].ReleaseYear)
	assert.Equal(t, 1, resp.TotalResults)
}

func TestOMDBService_SearchByIMDbID_NotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]interface{}{
			"Response": "False",
			"Error":    "Incorrect IMDb ID.",
		}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	svc := NewOMDBService("test-key", nil)
	svc.SetBaseURL(server.URL)

	resp, err := svc.Search(context.Background(), "tt9999999", 1, "")
	require.NoError(t, err)
	assert.Empty(t, resp.Results)
	assert.Equal(t, 0, resp.TotalResults)
}

func TestOMDBService_SearchUsesCache(t *testing.T) {
	db := setupServiceTestDB(t)
	cacheRepo := repositories.NewOMDBCacheRepository(db)
	svc := NewOMDBService("test-key", cacheRepo)

	ctx := context.Background()
	err := cacheRepo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins","year":"2005","imdbId":"tt0372784","type":"movie"}`,
		IsFull: true,
	})
	require.NoError(t, err)

	resp, err := svc.Search(ctx, "batman", 1, "")
	require.NoError(t, err)
	require.Len(t, resp.Results, 1)
	assert.Equal(t, "tt0372784", resp.Results[0].OMDBID)
	assert.Equal(t, "Batman Begins", resp.Results[0].Title)
}

func TestOMDBService_SearchCacheFiltersByType(t *testing.T) {
	db := setupServiceTestDB(t)
	cacheRepo := repositories.NewOMDBCacheRepository(db)
	svc := NewOMDBService("test-key", cacheRepo)
	ctx := context.Background()

	require.NoError(t, cacheRepo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins","year":"2005","imdbId":"tt0372784","type":"movie"}`,
		IsFull: true,
	}))
	require.NoError(t, cacheRepo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0903747",
		Title:  "Breaking Bad",
		Data:   `{"title":"Breaking Bad","year":"2008","imdbId":"tt0903747","type":"tv"}`,
		IsFull: true,
	}))

	resp, err := svc.Search(ctx, "begins", 1, "movie")
	require.NoError(t, err)
	require.Len(t, resp.Results, 1)
	assert.Equal(t, "movie", resp.Results[0].Type)
}

func TestOMDBService_GetByIDUsesCache(t *testing.T) {
	db := setupServiceTestDB(t)
	cacheRepo := repositories.NewOMDBCacheRepository(db)
	svc := NewOMDBService("test-key", cacheRepo)
	ctx := context.Background()

	err := cacheRepo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins","year":"2005","imdbId":"tt0372784","type":"movie","plot":"Great movie"}`,
		IsFull: true,
	})
	require.NoError(t, err)

	detail, err := svc.GetByID(ctx, "tt0372784")
	require.NoError(t, err)
	assert.Equal(t, "Batman Begins", detail.Title)
	assert.Equal(t, "Great movie", detail.Plot)
}

func TestOMDBService_GetByID_PartialCacheFallsThrough(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]interface{}{
			"Title":    "Batman Begins",
			"Year":     "2005",
			"imdbID":   "tt0372784",
			"Type":     "movie",
			"Plot":     "After training with his mentor, Batman begins his fight.",
			"Response": "True",
		}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	db := setupServiceTestDB(t)
	cacheRepo := repositories.NewOMDBCacheRepository(db)
	svc := NewOMDBService("test-key", cacheRepo)
	svc.SetBaseURL(server.URL)
	ctx := context.Background()

	// Partial cache (from a search result)
	err := cacheRepo.Upsert(ctx, &models.OMDBCache{
		IMDbID: "tt0372784",
		Title:  "Batman Begins",
		Data:   `{"title":"Batman Begins","year":"2005","imdbId":"tt0372784","type":"movie"}`,
		IsFull: false,
	})
	require.NoError(t, err)

	detail, err := svc.GetByID(ctx, "tt0372784")
	require.NoError(t, err)
	assert.Equal(t, "After training with his mentor, Batman begins his fight.", detail.Plot)

	// Should now be full in cache
	cached, err := cacheRepo.GetByIMDbID(ctx, "tt0372784")
	require.NoError(t, err)
	require.NotNil(t, cached)
	assert.True(t, cached.IsFull)
}

func TestOMDBService_GetByID_CachesResult(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]interface{}{
			"Title":    "Batman Begins",
			"Year":     "2005",
			"imdbID":   "tt0372784",
			"Type":     "movie",
			"Plot":     "After training with his mentor, Batman begins his fight.",
			"Response": "True",
		}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	db := setupServiceTestDB(t)
	cacheRepo := repositories.NewOMDBCacheRepository(db)
	svc := NewOMDBService("test-key", cacheRepo)
	svc.SetBaseURL(server.URL)
	ctx := context.Background()

	_, err := cacheRepo.GetByIMDbID(ctx, "tt0372784")
	require.NoError(t, err)

	detail, err := svc.GetByID(ctx, "tt0372784")
	require.NoError(t, err)
	assert.Equal(t, "Batman Begins", detail.Title)

	cached, err := cacheRepo.GetByIMDbID(ctx, "tt0372784")
	require.NoError(t, err)
	require.NotNil(t, cached)
	assert.True(t, cached.IsFull)
	assert.Contains(t, cached.Data, "After training with his mentor")
}

func TestOMDBService_SearchCachesResults(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := omdbSearchAPIResponse{
			Search: []omdbSearchAPIResult{
				{IMDbID: "tt0372784", Title: "Batman Begins", Year: "2005", Type: "movie"},
			},
			TotalResults: "1",
			Response:     "True",
		}
		require.NoError(t, json.NewEncoder(w).Encode(resp))
	}))
	defer server.Close()

	db := setupServiceTestDB(t)
	cacheRepo := repositories.NewOMDBCacheRepository(db)
	svc := NewOMDBService("test-key", cacheRepo)
	svc.SetBaseURL(server.URL)
	ctx := context.Background()

	resp, err := svc.Search(ctx, "batman", 1, "")
	require.NoError(t, err)
	require.Len(t, resp.Results, 1)

	cached, err := cacheRepo.GetByIMDbID(ctx, "tt0372784")
	require.NoError(t, err)
	require.NotNil(t, cached)
	assert.Equal(t, "Batman Begins", cached.Title)
	assert.False(t, cached.IsFull)
}
