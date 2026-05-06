package services

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

var ErrMemberMessageContentRequired = errors.New("message content is required")

type MemberMessageService struct {
	repo repositories.MemberMessageRepository
}

func NewMemberMessageService(repo repositories.MemberMessageRepository) *MemberMessageService {
	return &MemberMessageService{repo: repo}
}

func (s *MemberMessageService) ListMessages(ctx context.Context, instanceID uuid.UUID) ([]models.MemberMessage, error) {
	return s.repo.ListByInstance(ctx, instanceID)
}

func (s *MemberMessageService) SendMessage(ctx context.Context, instanceID, userID uuid.UUID, content string) (*models.MemberMessage, error) {
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return nil, ErrMemberMessageContentRequired
	}

	message := &models.MemberMessage{
		InstanceID: instanceID,
		UserID:     userID,
		Content:    trimmed,
	}
	if err := s.repo.Create(ctx, message); err != nil {
		return nil, err
	}
	return message, nil
}
