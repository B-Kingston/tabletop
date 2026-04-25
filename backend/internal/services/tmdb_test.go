package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTMDBService_SearchMulti(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Contains(t, r.URL.Path, "/search/multi")
		assert.Equal(t, "test-key", r.URL.Query().Get("api_key"))
		assert.Equal(t, "batman", r.URL.Query().Get("query"))

		resp := TMDBSearchResponse{
			Page:         1,
			TotalResults: 1,
			TotalPages:   1,
			Results: []TMDBSearchResult{
				{ID: 1, Title: "Batman", MediaType: "movie", VoteAverage: 7.5},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	svc := NewTMDBService("test-key")
	svc.baseURL = server.URL

	resp, err := svc.SearchMulti(context.Background(), "batman", 1)
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Equal(t, 1, resp.TotalResults)
	assert.Equal(t, "Batman", resp.Results[0].Title)
}

func TestTMDBService_SearchMovies(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Contains(t, r.URL.Path, "/search/movie")

		resp := TMDBSearchResponse{
			Page: 1,
			Results: []TMDBSearchResult{
				{ID: 2, Title: "Inception", MediaType: "movie"},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	svc := NewTMDBService("test-key")
	svc.baseURL = server.URL

	resp, err := svc.SearchMovies(context.Background(), "inception", 1)
	require.NoError(t, err)
	assert.Len(t, resp.Results, 1)
	assert.Equal(t, "Inception", resp.Results[0].Title)
}

func TestTMDBService_SearchTV(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Contains(t, r.URL.Path, "/search/tv")

		resp := TMDBSearchResponse{
			Results: []TMDBSearchResult{
				{ID: 3, Name: "Breaking Bad", MediaType: "tv"},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	svc := NewTMDBService("test-key")
	svc.baseURL = server.URL

	resp, err := svc.SearchTV(context.Background(), "breaking bad", 1)
	require.NoError(t, err)
	assert.Equal(t, "Breaking Bad", resp.Results[0].Name)
}

func TestTMDBService_GetMovieDetails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Contains(t, r.URL.Path, "/movie/550")

		details := TMDBMovieDetails{
			ID:          550,
			Title:       "Fight Club",
			Overview:    "A great movie",
			PosterPath:  "/poster.jpg",
			ReleaseDate: "1999-10-15",
			Runtime:     139,
			VoteAverage: 8.4,
		}
		json.NewEncoder(w).Encode(details)
	}))
	defer server.Close()

	svc := NewTMDBService("test-key")
	svc.baseURL = server.URL

	details, err := svc.GetMovieDetails(context.Background(), 550)
	require.NoError(t, err)
	assert.Equal(t, "Fight Club", details.Title)
	assert.Equal(t, 139, details.Runtime)
}

func TestTMDBService_GetTVDetails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Contains(t, r.URL.Path, "/tv/1396")

		details := TMDBTVDetails{
			ID:               1396,
			Name:             "Breaking Bad",
			NumberOfEpisodes: 62,
			NumberOfSeasons:  5,
			VoteAverage:      9.5,
		}
		json.NewEncoder(w).Encode(details)
	}))
	defer server.Close()

	svc := NewTMDBService("test-key")
	svc.baseURL = server.URL

	details, err := svc.GetTVDetails(context.Background(), 1396)
	require.NoError(t, err)
	assert.Equal(t, "Breaking Bad", details.Name)
	assert.Equal(t, 62, details.NumberOfEpisodes)
}

func TestTMDBService_ErrorResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"status_message":"Invalid API key"}`))
	}))
	defer server.Close()

	svc := NewTMDBService("bad-key")
	svc.baseURL = server.URL

	_, err := svc.SearchMulti(context.Background(), "test", 1)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "401")
}

func TestTMDBService_GetMovieDetails_ErrorResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`not found`))
	}))
	defer server.Close()

	svc := NewTMDBService("test-key")
	svc.baseURL = server.URL

	_, err := svc.GetMovieDetails(context.Background(), 999999)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "404")
}
