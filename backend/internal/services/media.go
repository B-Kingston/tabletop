package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

type MediaService struct {
	mediaRepo repositories.MediaRepository
}

func NewMediaService(mediaRepo repositories.MediaRepository) *MediaService {
	return &MediaService{mediaRepo: mediaRepo}
}

func (s *MediaService) Create(ctx context.Context, instanceID, userID uuid.UUID, omdbID, mediaType, title, overview, releaseYear string) (*models.MediaItem, error) {
	item := &models.MediaItem{
		InstanceID:  instanceID,
		OMDBID:      omdbID,
		Type:        mediaType,
		Title:       title,
		Overview:    overview,
		ReleaseYear: releaseYear,
		Status:      "planning",
		CreatedByID: userID,
		UpdatedByID: userID,
	}

	if err := s.mediaRepo.Create(ctx, item); err != nil {
		return nil, err
	}

	return s.mediaRepo.GetByID(ctx, instanceID, item.ID)
}

func (s *MediaService) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.MediaItem, error) {
	item, err := s.mediaRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, fmt.Errorf("media item not found")
	}
	return item, nil
}

func (s *MediaService) List(ctx context.Context, instanceID uuid.UUID, status, mediaType string) ([]models.MediaItem, error) {
	return s.mediaRepo.List(ctx, instanceID, status, mediaType)
}

func (s *MediaService) Update(ctx context.Context, instanceID, id, userID uuid.UUID, status string, rating *float32, review string, planToWatchDate *time.Time) (*models.MediaItem, error) {
	item, err := s.mediaRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, fmt.Errorf("media item not found")
	}

	if status != "" {
		item.Status = status
	}
	if rating != nil {
		item.Rating = rating
	}
	if review != "" {
		item.Review = review
	}
	if planToWatchDate != nil {
		item.PlanToWatchDate = planToWatchDate
	}
	item.UpdatedByID = userID

	if err := s.mediaRepo.Update(ctx, item); err != nil {
		return nil, err
	}

	return s.mediaRepo.GetByID(ctx, instanceID, id)
}

func (s *MediaService) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	return s.mediaRepo.Delete(ctx, instanceID, id)
}
