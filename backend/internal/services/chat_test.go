package services

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

func setupChatServiceTest(t *testing.T) (*repositories.GormUserRepository, uuid.UUID, uuid.UUID) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))

	userRepo := repositories.NewUserRepository(db)
	instanceRepo := repositories.NewInstanceRepository(db)
	ctx := context.Background()

	user := &models.User{ClerkID: "chat_svc_user", Email: "chat@test.com"}
	require.NoError(t, userRepo.Create(ctx, user))

	instance := &models.Instance{Name: "ChatSvcTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, instanceRepo.Create(ctx, instance))
	require.NoError(t, instanceRepo.AddMember(ctx, &models.InstanceMembership{
		UserID: user.ID, InstanceID: instance.ID, Role: "owner",
	}))

	return userRepo, instance.ID, user.ID
}

func TestChatService_CreateSession(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	_, instanceID, userID := setupChatServiceTest(t)

	session, err := svc.CreateSession(ctx, instanceID, userID, "Test Session")
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, session.ID)
	assert.Equal(t, "Test Session", session.Title)
	assert.Equal(t, instanceID, session.InstanceID)
}

func TestChatService_GetSession(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	_, instanceID, userID := setupChatServiceTest(t)

	session, err := svc.CreateSession(ctx, instanceID, userID, "Session")
	require.NoError(t, err)

	found, err := svc.GetSession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Session", found.Title)
}

func TestChatService_GetSession_NotFound(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)

	_, instanceID, _ := setupChatServiceTest(t)

	found, err := svc.GetSession(context.Background(), instanceID, uuid.New())
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestChatService_ListSessions(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	_, instanceID, userID := setupChatServiceTest(t)

	_, err := svc.CreateSession(ctx, instanceID, userID, "A")
	require.NoError(t, err)
	_, err = svc.CreateSession(ctx, instanceID, userID, "B")
	require.NoError(t, err)

	sessions, err := svc.ListSessions(ctx, instanceID)
	require.NoError(t, err)
	assert.Len(t, sessions, 2)
}

func TestChatService_DeleteSession_WithMessages(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	_, instanceID, userID := setupChatServiceTest(t)

	session, err := svc.CreateSession(ctx, instanceID, userID, "WithMessages")
	require.NoError(t, err)

	// Add a message to the session
	msg := &models.ChatMessage{SessionID: session.ID, Role: "user", Content: "Hello"}
	require.NoError(t, msgRepo.Create(ctx, msg))

	// Delete should cascade and succeed
	err = svc.DeleteSession(ctx, instanceID, session.ID)
	require.NoError(t, err)

	// Verify session is gone
	found, err := svc.GetSession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Nil(t, found)

	// Verify messages are also gone
	msgs, err := msgRepo.ListBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Empty(t, msgs)
}

func TestChatService_DeleteSession(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	_, instanceID, userID := setupChatServiceTest(t)

	session, err := svc.CreateSession(ctx, instanceID, userID, "ToDelete")
	require.NoError(t, err)

	err = svc.DeleteSession(ctx, instanceID, session.ID)
	require.NoError(t, err)

	found, err := svc.GetSession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestChatService_DeleteSession_WrongInstance(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	_, instanceID, userID := setupChatServiceTest(t)

	session, err := svc.CreateSession(ctx, instanceID, userID, "MySession")
	require.NoError(t, err)

	// Try to delete using a different instance ID
	err = svc.DeleteSession(ctx, uuid.New(), session.ID)
	assert.Error(t, err)
	assert.ErrorIs(t, err, ErrSessionNotFound)

	// Verify session still exists for the correct instance
	found, err := svc.GetSession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}

func TestChatService_SendMessage_CrossInstance(t *testing.T) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))
	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	svc := NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	_, instanceID, userID := setupChatServiceTest(t)

	session, err := svc.CreateSession(ctx, instanceID, userID, "A")
	require.NoError(t, err)

	// Try to send a message to a session from a different instance
	_, err = svc.SendMessage(ctx, uuid.New(), session.ID, userID, "user", "hello")
	assert.Error(t, err)
	assert.ErrorIs(t, err, ErrSessionNotFound)
}
