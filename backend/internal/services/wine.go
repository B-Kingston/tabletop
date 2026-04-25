package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

type WineService struct {
	wineRepo repositories.WineRepository
}

func NewWineService(wineRepo repositories.WineRepository) *WineService {
	return &WineService{wineRepo: wineRepo}
}

func (s *WineService) Create(ctx context.Context, instanceID, userID uuid.UUID, name, producer, wineType string, vintage *int, cost *float64, currency string, rating *float32, notes string, consumedAt *time.Time) (*models.Wine, error) {
	if currency == "" {
		currency = "AUD"
	}
	wine := &models.Wine{
		InstanceID:  instanceID,
		Name:        name,
		Producer:    producer,
		Type:        models.WineType(wineType),
		Vintage:     vintage,
		Cost:        cost,
		Currency:    currency,
		Rating:      rating,
		Notes:       notes,
		ConsumedAt:  consumedAt,
		CreatedByID: userID,
		UpdatedByID: userID,
	}
	if err := s.wineRepo.Create(ctx, wine); err != nil {
		return nil, err
	}
	return s.wineRepo.GetByID(ctx, instanceID, wine.ID)
}

func (s *WineService) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Wine, error) {
	wine, err := s.wineRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if wine == nil {
		return nil, fmt.Errorf("wine not found")
	}
	return wine, nil
}

func (s *WineService) List(ctx context.Context, instanceID uuid.UUID, wineType string) ([]models.Wine, error) {
	return s.wineRepo.List(ctx, instanceID, wineType)
}

func (s *WineService) Update(ctx context.Context, instanceID, id, userID uuid.UUID, name, producer, wineType *string, vintage *int, cost *float64, currency *string, rating *float32, notes *string, consumedAt *time.Time) (*models.Wine, error) {
	wine, err := s.wineRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if wine == nil {
		return nil, fmt.Errorf("wine not found")
	}

	if name != nil {
		wine.Name = *name
	}
	if producer != nil {
		wine.Producer = *producer
	}
	if wineType != nil {
		wine.Type = models.WineType(*wineType)
	}
	if vintage != nil {
		wine.Vintage = vintage
	}
	if cost != nil {
		wine.Cost = cost
	}
	if currency != nil {
		wine.Currency = *currency
	}
	if rating != nil {
		wine.Rating = rating
	}
	if notes != nil {
		wine.Notes = *notes
	}
	if consumedAt != nil {
		wine.ConsumedAt = consumedAt
	}
	wine.UpdatedByID = userID

	if err := s.wineRepo.Update(ctx, wine); err != nil {
		return nil, err
	}
	return s.wineRepo.GetByID(ctx, instanceID, id)
}

func (s *WineService) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	return s.wineRepo.Delete(ctx, instanceID, id)
}
