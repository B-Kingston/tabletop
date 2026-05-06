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

func setupMemberMessageServiceTest(t *testing.T) (*MemberMessageService, uuid.UUID, uuid.UUID) {
	db := setupServiceTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.MemberMessage{}))

	user := models.User{ClerkID: "member_message_svc_user", Email: "member-svc@test.com", Name: "Service User"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Service Messages", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	repo := repositories.NewMemberMessageRepository(db)
	return NewMemberMessageService(repo), instance.ID, user.ID
}

func TestMemberMessageService_SendMessageTrimsAndPersists(t *testing.T) {
	svc, instanceID, userID := setupMemberMessageServiceTest(t)

	message, err := svc.SendMessage(context.Background(), instanceID, userID, "  bring dessert  ")
	require.NoError(t, err)

	assert.NotEqual(t, uuid.Nil, message.ID)
	assert.Equal(t, instanceID, message.InstanceID)
	assert.Equal(t, userID, message.UserID)
	assert.Equal(t, "bring dessert", message.Content)
	assert.Equal(t, "Service User", message.User.Name)
}

func TestMemberMessageService_SendMessageRejectsEmptyContent(t *testing.T) {
	svc, instanceID, userID := setupMemberMessageServiceTest(t)

	message, err := svc.SendMessage(context.Background(), instanceID, userID, "   ")

	assert.Nil(t, message)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "message content is required")
}

func TestMemberMessageService_ListMessages(t *testing.T) {
	svc, instanceID, userID := setupMemberMessageServiceTest(t)
	ctx := context.Background()

	_, err := svc.SendMessage(ctx, instanceID, userID, "Hello")
	require.NoError(t, err)

	messages, err := svc.ListMessages(ctx, instanceID)
	require.NoError(t, err)

	require.Len(t, messages, 1)
	assert.Equal(t, "Hello", messages[0].Content)
}
