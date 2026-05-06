package repositories

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
)

func seedChatTestDB(t *testing.T) (*gorm.DB, uuid.UUID, uuid.UUID) {
	db := setupRepoTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.ChatSession{}, &models.ChatMessage{}))

	user := models.User{ClerkID: "chat_user", Email: "chat@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "ChatTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	return db, instance.ID, user.ID
}

func TestChatSessionRepository_Create(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	repo := NewChatSessionRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{
		InstanceID: instanceID,
		UserID:     userID,
		Title:      "Test Session",
	}
	err := repo.Create(ctx, session)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, session.ID)
}

func TestChatSessionRepository_GetByID(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	repo := NewChatSessionRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{
		InstanceID: instanceID,
		UserID:     userID,
		Title:      "Test Session",
	}
	require.NoError(t, repo.Create(ctx, session))

	found, err := repo.GetByID(ctx, instanceID, session.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Test Session", found.Title)
}

func TestChatSessionRepository_GetByID_WithMessages(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	sessionRepo := NewChatSessionRepository(db)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{
		InstanceID: instanceID,
		UserID:     userID,
		Title:      "Chat",
	}
	require.NoError(t, sessionRepo.Create(ctx, session))

	msgs := []models.ChatMessage{
		{SessionID: session.ID, Role: "user", Content: "Hello"},
		{SessionID: session.ID, Role: "assistant", Content: "Hi there!"},
	}
	for _, m := range msgs {
		require.NoError(t, msgRepo.Create(ctx, &m))
	}

	found, err := sessionRepo.GetByID(ctx, instanceID, session.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Len(t, found.Messages, 2)
	assert.Equal(t, "Hello", found.Messages[0].Content)
	assert.Equal(t, "Hi there!", found.Messages[1].Content)
}

func TestChatSessionRepository_GetByID_NotFound(t *testing.T) {
	db, instanceID, _ := seedChatTestDB(t)
	repo := NewChatSessionRepository(db)
	ctx := context.Background()

	found, err := repo.GetByID(ctx, instanceID, uuid.New())
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestChatSessionRepository_GetByID_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	repo := NewChatSessionRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{
		InstanceID: instanceID,
		UserID:     userID,
		Title:      "Chat",
	}
	require.NoError(t, repo.Create(ctx, session))

	found, err := repo.GetByID(ctx, uuid.New(), session.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestChatSessionRepository_ListByInstance(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	repo := NewChatSessionRepository(db)
	ctx := context.Background()

	for _, title := range []string{"Session A", "Session B"} {
		require.NoError(t, repo.Create(ctx, &models.ChatSession{
			InstanceID: instanceID,
			UserID:     userID,
			Title:      title,
		}))
	}

	sessions, err := repo.ListByInstance(ctx, instanceID)
	require.NoError(t, err)
	assert.Len(t, sessions, 2)
}

func TestChatSessionRepository_Delete_WithMessages(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	sessionRepo := NewChatSessionRepository(db)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{
		InstanceID: instanceID,
		UserID:     userID,
		Title:      "WithMessages",
	}
	require.NoError(t, sessionRepo.Create(ctx, session))

	msg := &models.ChatMessage{SessionID: session.ID, Role: "user", Content: "Hello"}
	require.NoError(t, msgRepo.Create(ctx, msg))

	// Delete messages first (as the service does), then delete session
	err := msgRepo.DeleteBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)

	// Verify messages are gone
	remaining, err := msgRepo.ListBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Empty(t, remaining)

	// Now session delete should succeed
	err = sessionRepo.Delete(ctx, instanceID, session.ID)
	require.NoError(t, err)

	found, err := sessionRepo.GetByID(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestChatSessionRepository_Delete(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	repo := NewChatSessionRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{
		InstanceID: instanceID,
		UserID:     userID,
		Title:      "ToDelete",
	}
	require.NoError(t, repo.Create(ctx, session))

	err := repo.Delete(ctx, instanceID, session.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestChatMessageRepository_Create(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	sessionRepo := NewChatSessionRepository(db)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{InstanceID: instanceID, UserID: userID, Title: "Chat"}
	require.NoError(t, sessionRepo.Create(ctx, session))

	msg := &models.ChatMessage{
		SessionID: session.ID,
		Role:      "user",
		Content:   "Hello AI",
	}
	err := msgRepo.Create(ctx, msg)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, msg.ID)
}

func TestChatMessageRepository_ListBySession(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	sessionRepo := NewChatSessionRepository(db)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{InstanceID: instanceID, UserID: userID, Title: "Chat"}
	require.NoError(t, sessionRepo.Create(ctx, session))

	msgs := []models.ChatMessage{
		{SessionID: session.ID, Role: "user", Content: "First"},
		{SessionID: session.ID, Role: "assistant", Content: "Second"},
		{SessionID: session.ID, Role: "user", Content: "Third"},
	}
	for _, m := range msgs {
		require.NoError(t, msgRepo.Create(ctx, &m))
	}

	results, err := msgRepo.ListBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Len(t, results, 3)
	assert.Equal(t, "First", results[0].Content)
	assert.Equal(t, "Third", results[2].Content)
}

func TestChatMessageRepository_DeleteBySession(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	sessionRepo := NewChatSessionRepository(db)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{InstanceID: instanceID, UserID: userID, Title: "Chat"}
	require.NoError(t, sessionRepo.Create(ctx, session))

	for _, content := range []string{"A", "B", "C"} {
		require.NoError(t, msgRepo.Create(ctx, &models.ChatMessage{SessionID: session.ID, Role: "user", Content: content}))
	}

	// Verify 3 messages exist
	msgs, err := msgRepo.ListBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Len(t, msgs, 3)

	// Delete them
	err = msgRepo.DeleteBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)

	// Verify empty
	msgs, err = msgRepo.ListBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Empty(t, msgs)
}

func TestChatMessageRepository_ListBySession_Empty(t *testing.T) {
	db, instanceID, _ := seedChatTestDB(t)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	results, err := msgRepo.ListBySession(ctx, instanceID, uuid.New())
	require.NoError(t, err)
	assert.Empty(t, results)
}

func TestChatMessageRepository_ListBySession_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	sessionRepo := NewChatSessionRepository(db)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{InstanceID: instanceID, UserID: userID, Title: "Chat"}
	require.NoError(t, sessionRepo.Create(ctx, session))

	msg := &models.ChatMessage{SessionID: session.ID, Role: "user", Content: "Secret"}
	require.NoError(t, msgRepo.Create(ctx, msg))

	// Try to list messages using a different instance ID
	results, err := msgRepo.ListBySession(ctx, uuid.New(), session.ID)
	require.NoError(t, err)
	assert.Empty(t, results)
}

func TestChatMessageRepository_DeleteBySession_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedChatTestDB(t)
	sessionRepo := NewChatSessionRepository(db)
	msgRepo := NewChatMessageRepository(db)
	ctx := context.Background()

	session := &models.ChatSession{InstanceID: instanceID, UserID: userID, Title: "Chat"}
	require.NoError(t, sessionRepo.Create(ctx, session))

	msg := &models.ChatMessage{SessionID: session.ID, Role: "user", Content: "Secret"}
	require.NoError(t, msgRepo.Create(ctx, msg))

	// Try to delete messages using a different instance ID
	err := msgRepo.DeleteBySession(ctx, uuid.New(), session.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "session not found")

	// Verify messages still exist for the correct instance
	results, err := msgRepo.ListBySession(ctx, instanceID, session.ID)
	require.NoError(t, err)
	assert.Len(t, results, 1)
}
