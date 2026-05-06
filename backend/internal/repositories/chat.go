package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/utils"
)

type ChatSessionRepository interface {
	Create(ctx context.Context, session *models.ChatSession) error
	GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.ChatSession, error)
	ListByInstance(ctx context.Context, instanceID uuid.UUID) ([]models.ChatSession, error)
	Delete(ctx context.Context, instanceID, id uuid.UUID) error
}

type ChatMessageRepository interface {
	Create(ctx context.Context, msg *models.ChatMessage) error
	ListBySession(ctx context.Context, instanceID, sessionID uuid.UUID) ([]models.ChatMessage, error)
	DeleteBySession(ctx context.Context, instanceID, sessionID uuid.UUID) error
}

type chatSessionRepository struct {
	db *gorm.DB
}

type chatMessageRepository struct {
	db *gorm.DB
}

func NewChatSessionRepository(db *gorm.DB) ChatSessionRepository {
	return &chatSessionRepository{db: db}
}

func NewChatMessageRepository(db *gorm.DB) ChatMessageRepository {
	return &chatMessageRepository{db: db}
}

func (r *chatSessionRepository) Create(ctx context.Context, session *models.ChatSession) error {
	if err := r.db.WithContext(ctx).Create(session).Error; err != nil {
		return fmt.Errorf("failed to create chat session: %w", err)
	}
	return nil
}

func (r *chatSessionRepository) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.ChatSession, error) {
	var session models.ChatSession
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at asc")
		}).
		Preload("User").
		First(&session, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get chat session: %w", err)
	}
	return &session, nil
}

func (r *chatSessionRepository) ListByInstance(ctx context.Context, instanceID uuid.UUID) ([]models.ChatSession, error) {
	var sessions []models.ChatSession
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("User").
		Order("updated_at desc").
		Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to list chat sessions: %w", err)
	}
	return sessions, nil
}

func (r *chatSessionRepository) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Delete(&models.ChatSession{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete chat session: %w", err)
	}
	return nil
}

func (r *chatMessageRepository) Create(ctx context.Context, msg *models.ChatMessage) error {
	if err := r.db.WithContext(ctx).Create(msg).Error; err != nil {
		return fmt.Errorf("failed to create chat message: %w", err)
	}
	return nil
}

func (r *chatMessageRepository) ListBySession(ctx context.Context, instanceID, sessionID uuid.UUID) ([]models.ChatMessage, error) {
	// Verify session belongs to instance before listing messages
	var sessionCount int64
	if err := r.db.WithContext(ctx).
		Model(&models.ChatSession{}).
		Where("id = ? AND instance_id = ?", sessionID, instanceID).
		Count(&sessionCount).Error; err != nil {
		return nil, fmt.Errorf("failed to verify session ownership: %w", err)
	}
	if sessionCount == 0 {
		return nil, nil
	}

	var messages []models.ChatMessage
	if err := r.db.WithContext(ctx).
		Where("session_id = ?", sessionID).
		Order("created_at asc").
		Find(&messages).Error; err != nil {
		return nil, fmt.Errorf("failed to list chat messages: %w", err)
	}
	return messages, nil
}

func (r *chatMessageRepository) DeleteBySession(ctx context.Context, instanceID, sessionID uuid.UUID) error {
	// Verify session belongs to instance before deleting messages
	var sessionCount int64
	if err := r.db.WithContext(ctx).
		Model(&models.ChatSession{}).
		Where("id = ? AND instance_id = ?", sessionID, instanceID).
		Count(&sessionCount).Error; err != nil {
		return fmt.Errorf("failed to verify session ownership: %w", err)
	}
	if sessionCount == 0 {
		return fmt.Errorf("session not found")
	}

	if err := r.db.WithContext(ctx).
		Where("session_id = ?", sessionID).
		Delete(&models.ChatMessage{}).Error; err != nil {
		return fmt.Errorf("failed to delete chat messages: %w", err)
	}
	return nil
}
