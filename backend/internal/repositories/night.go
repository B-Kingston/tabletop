package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/utils"
)

type NightRepository interface {
	Create(ctx context.Context, night *models.Night) error
	GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Night, error)
	List(ctx context.Context, instanceID uuid.UUID) ([]models.Night, error)
	Update(ctx context.Context, night *models.Night) error
	Delete(ctx context.Context, instanceID, id uuid.UUID) error
}

type nightRepository struct {
	db *gorm.DB
}

func NewNightRepository(db *gorm.DB) NightRepository {
	return &nightRepository{db: db}
}

func (r *nightRepository) Create(ctx context.Context, night *models.Night) error {
	if err := r.db.WithContext(ctx).Create(night).Error; err != nil {
		return fmt.Errorf("failed to create night: %w", err)
	}
	return nil
}

func (r *nightRepository) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Night, error) {
	var night models.Night
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("Wine").
		Preload("Recipe").
		Preload("Media").
		Preload("CreatedBy").
		First(&night, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get night: %w", err)
	}
	return &night, nil
}

func (r *nightRepository) List(ctx context.Context, instanceID uuid.UUID) ([]models.Night, error) {
	var nights []models.Night
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("Wine").
		Preload("Recipe").
		Preload("Media").
		Preload("CreatedBy").
		Order("created_at desc").
		Find(&nights).Error; err != nil {
		return nil, fmt.Errorf("failed to list nights: %w", err)
	}
	return nights, nil
}

func (r *nightRepository) Update(ctx context.Context, night *models.Night) error {
	if err := r.db.WithContext(ctx).Save(night).Error; err != nil {
		return fmt.Errorf("failed to update night: %w", err)
	}
	return nil
}

func (r *nightRepository) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Delete(&models.Night{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete night: %w", err)
	}
	return nil
}
