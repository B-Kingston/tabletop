package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/utils"
)

type MemberMessageRepository interface {
	Create(ctx context.Context, message *models.MemberMessage) error
	ListByInstance(ctx context.Context, instanceID uuid.UUID) ([]models.MemberMessage, error)
}

type memberMessageRepository struct {
	db *gorm.DB
}

func NewMemberMessageRepository(db *gorm.DB) MemberMessageRepository {
	return &memberMessageRepository{db: db}
}

func (r *memberMessageRepository) Create(ctx context.Context, message *models.MemberMessage) error {
	if err := r.db.WithContext(ctx).Create(message).Error; err != nil {
		return fmt.Errorf("failed to create member message: %w", err)
	}

	if err := r.db.WithContext(ctx).
		Preload("User").
		First(message, "id = ?", message.ID).Error; err != nil {
		return fmt.Errorf("failed to load member message sender: %w", err)
	}

	return nil
}

func (r *memberMessageRepository) ListByInstance(ctx context.Context, instanceID uuid.UUID) ([]models.MemberMessage, error) {
	var messages []models.MemberMessage
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("User").
		Order("created_at asc").
		Find(&messages).Error; err != nil {
		return nil, fmt.Errorf("failed to list member messages: %w", err)
	}
	return messages, nil
}
