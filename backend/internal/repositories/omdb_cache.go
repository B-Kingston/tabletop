package repositories

import (
	"context"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"tabletop/backend/internal/models"
)

// OMDBCacheRepository provides access to cached OMDb data.
type OMDBCacheRepository interface {
	GetByIMDbID(ctx context.Context, imdbID string) (*models.OMDBCache, error)
	SearchByTitle(ctx context.Context, query string, limit int) ([]models.OMDBCache, error)
	Upsert(ctx context.Context, cache *models.OMDBCache) error
}

type omdbCacheRepository struct {
	db *gorm.DB
}

// NewOMDBCacheRepository creates a new OMDBCacheRepository.
func NewOMDBCacheRepository(db *gorm.DB) OMDBCacheRepository {
	return &omdbCacheRepository{db: db}
}

func (r *omdbCacheRepository) GetByIMDbID(ctx context.Context, imdbID string) (*models.OMDBCache, error) {
	var cached models.OMDBCache
	if err := r.db.WithContext(ctx).First(&cached, "imdb_id = ?", imdbID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get omdb cache: %w", err)
	}
	return &cached, nil
}

func (r *omdbCacheRepository) SearchByTitle(ctx context.Context, query string, limit int) ([]models.OMDBCache, error) {
	var results []models.OMDBCache
	if err := r.db.WithContext(ctx).
		Where("LOWER(title) LIKE LOWER(?)", "%"+query+"%").
		Limit(limit).
		Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to search omdb cache: %w", err)
	}
	return results, nil
}

func (r *omdbCacheRepository) Upsert(ctx context.Context, cache *models.OMDBCache) error {
	if err := r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "imdb_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "data", "is_full", "updated_at"}),
		}).
		Create(cache).Error; err != nil {
		return fmt.Errorf("failed to upsert omdb cache: %w", err)
	}
	return nil
}
