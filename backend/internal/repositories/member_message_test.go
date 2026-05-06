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

func seedMemberMessageTestDB(t *testing.T) (*gorm.DB, uuid.UUID, uuid.UUID) {
	db := setupRepoTestDB(t)
	require.NoError(t, db.AutoMigrate(&models.MemberMessage{}))

	user := models.User{ClerkID: "member_message_user", Email: "messages@test.com", Name: "Message User"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Messages", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	require.NoError(t, db.Create(&models.InstanceMembership{
		UserID: user.ID, InstanceID: instance.ID, Role: "owner",
	}).Error)

	return db, instance.ID, user.ID
}

func TestMemberMessageRepository_CreateLoadsSender(t *testing.T) {
	db, instanceID, userID := seedMemberMessageTestDB(t)
	repo := NewMemberMessageRepository(db)
	ctx := context.Background()

	message := &models.MemberMessage{
		InstanceID: instanceID,
		UserID:     userID,
		Content:    "Dinner is at 7",
	}

	require.NoError(t, repo.Create(ctx, message))

	assert.NotEqual(t, uuid.Nil, message.ID)
	assert.Equal(t, "Message User", message.User.Name)
}

func TestMemberMessageRepository_ListByInstanceScopesAndOrdersMessages(t *testing.T) {
	db, instanceID, userID := seedMemberMessageTestDB(t)
	repo := NewMemberMessageRepository(db)
	ctx := context.Background()
	otherInstanceID := uuid.New()

	require.NoError(t, repo.Create(ctx, &models.MemberMessage{InstanceID: instanceID, UserID: userID, Content: "First"}))
	require.NoError(t, repo.Create(ctx, &models.MemberMessage{InstanceID: otherInstanceID, UserID: userID, Content: "Wrong room"}))
	require.NoError(t, repo.Create(ctx, &models.MemberMessage{InstanceID: instanceID, UserID: userID, Content: "Second"}))

	messages, err := repo.ListByInstance(ctx, instanceID)
	require.NoError(t, err)

	require.Len(t, messages, 2)
	assert.Equal(t, "First", messages[0].Content)
	assert.Equal(t, "Second", messages[1].Content)
	assert.Equal(t, "Message User", messages[0].User.Name)
}
