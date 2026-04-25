package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/utils"
)

type WineRepository interface {
	Create(ctx context.Context, wine *models.Wine) error
	GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Wine, error)
	List(ctx context.Context, instanceID uuid.UUID, wineType string) ([]models.Wine, error)
	Update(ctx context.Context, wine *models.Wine) error
	Delete(ctx context.Context, instanceID, id uuid.UUID) error
}

type wineRepository struct {
	db *gorm.DB
}

func NewWineRepository(db *gorm.DB) WineRepository {
	return &wineRepository{db: db}
}

func (r *wineRepository) Create(ctx context.Context, wine *models.Wine) error {
	if err := r.db.WithContext(ctx).Create(wine).Error; err != nil {
		return fmt.Errorf("failed to create wine: %w", err)
	}
	return nil
}

func (r *wineRepository) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Wine, error) {
	var wine models.Wine
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("CreatedBy").
		First(&wine, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get wine: %w", err)
	}
	return &wine, nil
}

func (r *wineRepository) List(ctx context.Context, instanceID uuid.UUID, wineType string) ([]models.Wine, error) {
	var wines []models.Wine
	query := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("CreatedBy")
	if wineType != "" {
		query = query.Where("type = ?", wineType)
	}
	if err := query.Order("created_at desc").Find(&wines).Error; err != nil {
		return nil, fmt.Errorf("failed to list wines: %w", err)
	}
	return wines, nil
}

func (r *wineRepository) Update(ctx context.Context, wine *models.Wine) error {
	if err := r.db.WithContext(ctx).Save(wine).Error; err != nil {
		return fmt.Errorf("failed to update wine: %w", err)
	}
	return nil
}

func (r *wineRepository) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Delete(&models.Wine{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete wine: %w", err)
	}
	return nil
}
