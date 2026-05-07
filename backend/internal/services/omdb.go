package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

// OMDBService handles interactions with the OMDb API.
type OMDBService struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	cacheRepo  repositories.OMDBCacheRepository
}

// OMDBRating represents a single rating source/value pair.
type OMDBRating struct {
	Source string `json:"source"`
	Value  string `json:"value"`
}

// OMDBDetail is the full OMDb response for a title lookup.
type OMDBDetail struct {
	Title        string       `json:"title"`
	Year         string       `json:"year"`
	Rated        string       `json:"rated"`
	Released     string       `json:"released"`
	Runtime      string       `json:"runtime"`
	Genre        string       `json:"genre"`
	Director     string       `json:"director"`
	Writer       string       `json:"writer"`
	Actors       string       `json:"actors"`
	Plot         string       `json:"plot"`
	Language     string       `json:"language"`
	Country      string       `json:"country"`
	Awards       string       `json:"awards"`
	Poster       string       `json:"poster"`
	Ratings      []OMDBRating `json:"ratings"`
	Metascore    string       `json:"metascore"`
	IMDbRating   string       `json:"imdbRating"`
	IMDbVotes    string       `json:"imdbVotes"`
	IMDbID       string       `json:"imdbId"`
	Type         string       `json:"type"`
	BoxOffice    string       `json:"boxOffice"`
	Production   string       `json:"production"`
	TotalSeasons string       `json:"totalSeasons"`
}

type OMDBSearchResult struct {
	OMDBID      string `json:"omdbId"`
	Title       string `json:"title"`
	Type        string `json:"type"`
	ReleaseYear string `json:"releaseYear"`
}

type OMDBSearchResponse struct {
	Page         int                `json:"page"`
	Results      []OMDBSearchResult `json:"results"`
	TotalResults int                `json:"totalResults"`
}

type omdbSearchAPIResult struct {
	IMDbID string `json:"imdbID"`
	Title  string `json:"Title"`
	Year   string `json:"Year"`
	Type   string `json:"Type"`
}

type omdbSearchAPIResponse struct {
	Search       []omdbSearchAPIResult `json:"Search"`
	TotalResults string                `json:"TotalResults"`
	Response     string                `json:"Response"`
	Error        string                `json:"Error"`
}

func NewOMDBService(apiKey string, cacheRepo repositories.OMDBCacheRepository) *OMDBService {
	return &OMDBService{
		apiKey:     apiKey,
		baseURL:    "https://www.omdbapi.com/",
		httpClient: &http.Client{Timeout: 10 * time.Second},
		cacheRepo:  cacheRepo,
	}
}

func (s *OMDBService) SetBaseURL(url string) {
	s.baseURL = url
}

func (s *OMDBService) SetHTTPClient(client *http.Client) {
	s.httpClient = client
}

// GetByID fetches full details for a title by its IMDb ID.
func (s *OMDBService) GetByID(ctx context.Context, imdbID string) (*OMDBDetail, error) {
	// Check cache first
	if s.cacheRepo != nil {
		cached, err := s.cacheRepo.GetByIMDbID(ctx, imdbID)
		if err != nil {
			// Log but don't fail — fall through to API
		} else if cached != nil && cached.IsFull {
			var detail OMDBDetail
			if err := json.Unmarshal([]byte(cached.Data), &detail); err == nil {
				return &detail, nil
			}
		}
	}

	params := url.Values{
		"apikey": {s.apiKey},
		"i":      {imdbID},
		"plot":   {"full"},
	}

	endpoint := fmt.Sprintf("%s?%s", s.baseURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch OMDb detail: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OMDb returned %d: %s", resp.StatusCode, string(body))
	}

	var apiResp struct {
		Title        string `json:"Title"`
		Year         string `json:"Year"`
		Rated        string `json:"Rated"`
		Released     string `json:"Released"`
		Runtime      string `json:"Runtime"`
		Genre        string `json:"Genre"`
		Director     string `json:"Director"`
		Writer       string `json:"Writer"`
		Actors       string `json:"Actors"`
		Plot         string `json:"Plot"`
		Language     string `json:"Language"`
		Country      string `json:"Country"`
		Awards       string `json:"Awards"`
		Poster       string `json:"Poster"`
		Ratings      []struct {
			Source string `json:"Source"`
			Value  string `json:"Value"`
		} `json:"Ratings"`
		Metascore    string `json:"Metascore"`
		IMDbRating   string `json:"imdbRating"`
		IMDbVotes    string `json:"imdbVotes"`
		IMDbID       string `json:"imdbID"`
		Type         string `json:"Type"`
		BoxOffice    string `json:"BoxOffice"`
		Production   string `json:"Production"`
		TotalSeasons string `json:"totalSeasons"`
		Response     string `json:"Response"`
		Error        string `json:"Error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if apiResp.Response == "False" {
		return nil, fmt.Errorf("OMDb error: %s", apiResp.Error)
	}

	ratings := make([]OMDBRating, 0, len(apiResp.Ratings))
	for _, r := range apiResp.Ratings {
		ratings = append(ratings, OMDBRating{Source: r.Source, Value: r.Value})
	}

	detail := &OMDBDetail{
		Title:        apiResp.Title,
		Year:         apiResp.Year,
		Rated:        apiResp.Rated,
		Released:     apiResp.Released,
		Runtime:      apiResp.Runtime,
		Genre:        apiResp.Genre,
		Director:     apiResp.Director,
		Writer:       apiResp.Writer,
		Actors:       apiResp.Actors,
		Plot:         apiResp.Plot,
		Language:     apiResp.Language,
		Country:      apiResp.Country,
		Awards:       apiResp.Awards,
		Poster:       apiResp.Poster,
		Ratings:      ratings,
		Metascore:    apiResp.Metascore,
		IMDbRating:   apiResp.IMDbRating,
		IMDbVotes:    apiResp.IMDbVotes,
		IMDbID:       apiResp.IMDbID,
		Type:         fromOMDBType(apiResp.Type),
		BoxOffice:    apiResp.BoxOffice,
		Production:   apiResp.Production,
		TotalSeasons: apiResp.TotalSeasons,
	}

	// Store full detail in cache
	if s.cacheRepo != nil {
		data, _ := json.Marshal(detail)
		_ = s.cacheRepo.Upsert(ctx, &models.OMDBCache{
			IMDbID: detail.IMDbID,
			Title:  detail.Title,
			Data:   string(data),
			IsFull: true,
		})
	}

	return detail, nil
}

func (s *OMDBService) Search(ctx context.Context, query string, page int, mediaType string) (*OMDBSearchResponse, error) {
	if page < 1 {
		page = 1
	}
	if page > 100 {
		page = 100
	}

	// IMDb ID search: delegate to GetByID
	if strings.HasPrefix(strings.ToLower(query), "tt") {
		detail, err := s.GetByID(ctx, query)
		if err != nil {
			return &OMDBSearchResponse{
				Page:         page,
				Results:      []OMDBSearchResult{},
				TotalResults: 0,
			}, nil
		}
		return &OMDBSearchResponse{
			Page: page,
			Results: []OMDBSearchResult{{
				OMDBID:      detail.IMDbID,
				Title:       detail.Title,
				Type:        detail.Type,
				ReleaseYear: detail.Year,
			}},
			TotalResults: 1,
		}, nil
	}

	// Check cache first (only for page 1)
	if s.cacheRepo != nil && page == 1 {
		cached, err := s.cacheRepo.SearchByTitle(ctx, query, 10)
		if err == nil && len(cached) > 0 {
			results := make([]OMDBSearchResult, 0, len(cached))
			for _, c := range cached {
				var detail OMDBDetail
				if err := json.Unmarshal([]byte(c.Data), &detail); err != nil {
					continue
				}
				if mediaType != "" && detail.Type != mediaType {
					continue
				}
				results = append(results, OMDBSearchResult{
					OMDBID:      detail.IMDbID,
					Title:       detail.Title,
					Type:        detail.Type,
					ReleaseYear: detail.Year,
				})
			}
			if len(results) > 0 {
				return &OMDBSearchResponse{
					Page:         page,
					Results:      results,
					TotalResults: len(results),
				}, nil
			}
		}
	}

	params := url.Values{
		"apikey": {s.apiKey},
		"s":      {query},
		"page":   {fmt.Sprintf("%d", page)},
	}
	if omdbType := toOMDBType(mediaType); omdbType != "" {
		params.Set("type", omdbType)
	}

	endpoint := fmt.Sprintf("%s?%s", s.baseURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to search OMDb: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OMDb returned %d: %s", resp.StatusCode, string(body))
	}

	var apiResp omdbSearchAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	totalResults, _ := strconv.Atoi(apiResp.TotalResults)
	result := &OMDBSearchResponse{
		Page:         page,
		Results:      make([]OMDBSearchResult, 0, len(apiResp.Search)),
		TotalResults: totalResults,
	}

	if apiResp.Response == "False" {
		return result, nil
	}

	for _, item := range apiResp.Search {
		mappedType := fromOMDBType(item.Type)
		if mappedType == "" {
			continue
		}
		result.Results = append(result.Results, OMDBSearchResult{
			OMDBID:      item.IMDbID,
			Title:       item.Title,
			Type:        mappedType,
			ReleaseYear: item.Year,
		})
	}

	// Cache search results (as partial / not full)
	if s.cacheRepo != nil {
		for _, r := range result.Results {
			detail := OMDBDetail{
				Title:  r.Title,
				Year:   r.ReleaseYear,
				IMDbID: r.OMDBID,
				Type:   r.Type,
			}
			data, _ := json.Marshal(detail)
			_ = s.cacheRepo.Upsert(ctx, &models.OMDBCache{
				IMDbID: r.OMDBID,
				Title:  r.Title,
				Data:   string(data),
				IsFull: false,
			})
		}
	}

	return result, nil
}

func toOMDBType(mediaType string) string {
	switch mediaType {
	case "movie":
		return "movie"
	case "tv", "series":
		return "series"
	default:
		return ""
	}
}

func fromOMDBType(mediaType string) string {
	switch mediaType {
	case "movie":
		return "movie"
	case "series":
		return "tv"
	default:
		return ""
	}
}
