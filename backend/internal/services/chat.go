package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

// ErrSessionNotFound is returned when a chat session does not exist or does not
// belong to the caller's instance.
var ErrSessionNotFound = errors.New("chat session not found")

type ChatService struct {
	sessionRepo  repositories.ChatSessionRepository
	messageRepo  repositories.ChatMessageRepository
	openaiClient *OpenAIService
}

func NewChatService(
	sessionRepo repositories.ChatSessionRepository,
	messageRepo repositories.ChatMessageRepository,
	openaiClient *OpenAIService,
) *ChatService {
	return &ChatService{
		sessionRepo:  sessionRepo,
		messageRepo:  messageRepo,
		openaiClient: openaiClient,
	}
}

func (s *ChatService) CreateSession(ctx context.Context, instanceID, userID uuid.UUID, title string) (*models.ChatSession, error) {
	session := &models.ChatSession{
		InstanceID: instanceID,
		UserID:     userID,
		Title:      title,
	}
	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

func (s *ChatService) GetSession(ctx context.Context, instanceID, id uuid.UUID) (*models.ChatSession, error) {
	return s.sessionRepo.GetByID(ctx, instanceID, id)
}

func (s *ChatService) ListSessions(ctx context.Context, instanceID uuid.UUID) ([]models.ChatSession, error) {
	return s.sessionRepo.ListByInstance(ctx, instanceID)
}

func (s *ChatService) SendMessage(ctx context.Context, instanceID, sessionID, userID uuid.UUID, role, content string) (*models.ChatMessage, error) {
	// Verify session belongs to this instance before any writes or OpenAI calls
	session, err := s.sessionRepo.GetByID(ctx, instanceID, sessionID)
	if err != nil {
		return nil, fmt.Errorf("verify session: %w", err)
	}
	if session == nil {
		return nil, ErrSessionNotFound
	}

	// Check rate limit before calling OpenAI
	if s.openaiClient != nil {
		if err := s.openaiClient.CheckRateLimit(ctx, userID); err != nil {
			return nil, fmt.Errorf("rate limit: %w", err)
		}
	}

	userMsg := &models.ChatMessage{
		SessionID: sessionID,
		Role:      role,
		Content:   content,
	}
	if err := s.messageRepo.Create(ctx, userMsg); err != nil {
		return nil, err
	}

	history, err := s.messageRepo.ListBySession(ctx, instanceID, sessionID)
	if err != nil {
		return nil, err
	}

	var messages []OpenAIMessage
	messages = append(messages, OpenAIMessage{Role: "system", Content: RecipeSystemPrompt})
	for _, m := range history {
		messages = append(messages, OpenAIMessage{Role: m.Role, Content: m.Content})
	}

	resp, err := s.openaiClient.ChatCompletion(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("openai completion failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("openai returned no choices")
	}

	assistantMsg := &models.ChatMessage{
		SessionID: sessionID,
		Role:      "assistant",
		Content:   resp.Choices[0].Message.Content,
	}
	if err := s.messageRepo.Create(ctx, assistantMsg); err != nil {
		return nil, err
	}

	return assistantMsg, nil
}

func (s *ChatService) DeleteSession(ctx context.Context, instanceID, id uuid.UUID) error {
	// Verify session belongs to this instance before deletion
	session, err := s.sessionRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return fmt.Errorf("verify session: %w", err)
	}
	if session == nil {
		return ErrSessionNotFound
	}

	// Delete messages scoped by instance
	if err := s.messageRepo.DeleteBySession(ctx, instanceID, id); err != nil {
		return err
	}
	return s.sessionRepo.Delete(ctx, instanceID, id)
}


