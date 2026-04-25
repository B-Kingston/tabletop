package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/utils"
)

type MediaRepository interface {
	Create(ctx context.Context, item *models.MediaItem) error
	GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.MediaItem, error)
	List(ctx context.Context, instanceID uuid.UUID, status, mediaType string) ([]models.MediaItem, error)
	Update(ctx context.Context, item *models.MediaItem) error
	Delete(ctx context.Context, instanceID, id uuid.UUID) error
}

type mediaRepository struct {
	db *gorm.DB
}

func NewMediaRepository(db *gorm.DB) MediaRepository {
	return &mediaRepository{db: db}
}

func (r *mediaRepository) Create(ctx context.Context, item *models.MediaItem) error {
	if err := r.db.WithContext(ctx).Create(item).Error; err != nil {
		return fmt.Errorf("failed to create media item: %w", err)
	}
	return nil
}

func (r *mediaRepository) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.MediaItem, error) {
	var item models.MediaItem
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("CreatedBy").
		First(&item, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get media item: %w", err)
	}
	return &item, nil
}

func (r *mediaRepository) List(ctx context.Context, instanceID uuid.UUID, status, mediaType string) ([]models.MediaItem, error) {
	var items []models.MediaItem
	q := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("CreatedBy")

	if status != "" {
		q = q.Where("status = ?", status)
	}
	if mediaType != "" {
		q = q.Where("type = ?", mediaType)
	}

	if err := q.Find(&items).Error; err != nil {
		return nil, fmt.Errorf("failed to list media items: %w", err)
	}
	return items, nil
}

func (r *mediaRepository) Update(ctx context.Context, item *models.MediaItem) error {
	if err := r.db.WithContext(ctx).Save(item).Error; err != nil {
		return fmt.Errorf("failed to update media item: %w", err)
	}
	return nil
}

func (r *mediaRepository) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Delete(&models.MediaItem{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete media item: %w", err)
	}
	return nil
}
