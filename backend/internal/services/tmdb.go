package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// TMDBService handles interactions with The Movie Database API
type TMDBService struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// TMDBSearchResult is a single result from TMDB search
type TMDBSearchResult struct {
	ID          int     `json:"id"`
	Title       string  `json:"title,omitempty"`
	Name        string  `json:"name,omitempty"`
	Overview    string  `json:"overview"`
	PosterPath  string  `json:"poster_path,omitempty"`
	ReleaseDate string  `json:"release_date,omitempty"`
	FirstAirDate string `json:"first_air_date,omitempty"`
	MediaType   string  `json:"media_type,omitempty"`
	VoteAverage float64 `json:"vote_average"`
}

// TMDBSearchResponse is the paginated search response
type TMDBSearchResponse struct {
	Page         int              `json:"page"`
	Results      []TMDBSearchResult `json:"results"`
	TotalPages   int              `json:"total_pages"`
	TotalResults int              `json:"total_results"`
}

// TMDBMovieDetails contains detailed info about a movie
type TMDBMovieDetails struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Overview    string `json:"overview"`
	PosterPath  string `json:"poster_path"`
	ReleaseDate string `json:"release_date"`
	Runtime     int    `json:"runtime"`
	VoteAverage float64 `json:"vote_average"`
	Genres      []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	} `json:"genres"`
}

// NewTMDBService creates a new TMDB service
func NewTMDBService(apiKey string) *TMDBService {
	return &TMDBService{
		apiKey:  apiKey,
		baseURL: "https://api.themoviedb.org/3",
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SearchMulti searches for movies and TV shows
func (s *TMDBService) SearchMulti(ctx context.Context, query string, page int) (*TMDBSearchResponse, error) {
	params := url.Values{
		"query":       {query},
		"page":        {fmt.Sprintf("%d", page)},
		"api_key":     {s.apiKey},
		"include_adult": {"false"},
	}

	endpoint := fmt.Sprintf("%s/search/multi?%s", s.baseURL, params.Encode())
	return s.doSearchRequest(ctx, endpoint)
}

// SearchMovies searches for movies only
func (s *TMDBService) SearchMovies(ctx context.Context, query string, page int) (*TMDBSearchResponse, error) {
	params := url.Values{
		"query":   {query},
		"page":    {fmt.Sprintf("%d", page)},
		"api_key": {s.apiKey},
	}

	endpoint := fmt.Sprintf("%s/search/movie?%s", s.baseURL, params.Encode())
	return s.doSearchRequest(ctx, endpoint)
}

// SearchTV searches for TV shows only
func (s *TMDBService) SearchTV(ctx context.Context, query string, page int) (*TMDBSearchResponse, error) {
	params := url.Values{
		"query":   {query},
		"page":    {fmt.Sprintf("%d", page)},
		"api_key": {s.apiKey},
	}

	endpoint := fmt.Sprintf("%s/search/tv?%s", s.baseURL, params.Encode())
	return s.doSearchRequest(ctx, endpoint)
}

// GetMovieDetails fetches full details for a movie
func (s *TMDBService) GetMovieDetails(ctx context.Context, tmdbID int) (*TMDBMovieDetails, error) {
	params := url.Values{"api_key": {s.apiKey}}
	endpoint := fmt.Sprintf("%s/movie/%d?%s", s.baseURL, tmdbID, params.Encode())

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch movie: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("TMDB returned %d: %s", resp.StatusCode, string(body))
	}

	var details TMDBMovieDetails
	if err := json.NewDecoder(resp.Body).Decode(&details); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &details, nil
}

func (s *TMDBService) doSearchRequest(ctx context.Context, endpoint string) (*TMDBSearchResponse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to search TMDB: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("TMDB returned %d: %s", resp.StatusCode, string(body))
	}

	var result TMDBSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}
