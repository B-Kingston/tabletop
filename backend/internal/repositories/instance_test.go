package repositories

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
)

func setupRepoTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{},
		&models.MediaItem{}, &models.Wine{}, &models.Recipe{},
	)
	require.NoError(t, err)

	return db
}

func TestInstanceRepository_CreateAndGet(t *testing.T) {
	db := setupRepoTestDB(t)
	repo := NewInstanceRepository(db)
	ctx := context.Background()

	owner := models.User{ClerkID: "owner_123", Email: "owner@test.com"}
	require.NoError(t, db.Create(&owner).Error)

	instance := models.Instance{
		Name:         "Test Instance",
		OwnerID:      owner.ID,
		JoinPassword: "hashed_password",
	}

	err := repo.Create(ctx, &instance)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, instance.ID)

	found, err := repo.GetByID(ctx, instance.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Test Instance", found.Name)
	assert.Equal(t, owner.ID, found.OwnerID)
}

func TestInstanceRepository_ListByUserID(t *testing.T) {
	db := setupRepoTestDB(t)
	repo := NewInstanceRepository(db)
	ctx := context.Background()

	user := models.User{ClerkID: "user_123", Email: "user@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Shared", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, repo.Create(ctx, &instance))
	require.NoError(t, repo.AddMember(ctx, &models.InstanceMembership{
		UserID:     user.ID,
		InstanceID: instance.ID,
		Role:       "member",
	}))

	instances, err := repo.ListByUserID(ctx, user.ID)
	require.NoError(t, err)
	assert.Len(t, instances, 1)
	assert.Equal(t, "Shared", instances[0].Name)
}

func TestInstanceRepository_IsMember(t *testing.T) {
	db := setupRepoTestDB(t)
	repo := NewInstanceRepository(db)
	ctx := context.Background()

	user := models.User{ClerkID: "user_123", Email: "user@test.com"}
	other := models.User{ClerkID: "other_456", Email: "other@test.com"}
	require.NoError(t, db.Create(&user).Error)
	require.NoError(t, db.Create(&other).Error)

	instance := models.Instance{Name: "Private", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, repo.Create(ctx, &instance))
	require.NoError(t, repo.AddMember(ctx, &models.InstanceMembership{
		UserID:     user.ID,
		InstanceID: instance.ID,
		Role:       "owner",
	}))

	isMember, err := repo.IsMember(ctx, instance.ID, user.ID)
	require.NoError(t, err)
	assert.True(t, isMember)

	isMember, err = repo.IsMember(ctx, instance.ID, other.ID)
	require.NoError(t, err)
	assert.False(t, isMember)
}

func TestInstanceRepository_RemoveMember(t *testing.T) {
	db := setupRepoTestDB(t)
	repo := NewInstanceRepository(db)
	ctx := context.Background()

	user := models.User{ClerkID: "user_123", Email: "user@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Group", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, repo.Create(ctx, &instance))
	require.NoError(t, repo.AddMember(ctx, &models.InstanceMembership{
		UserID:     user.ID,
		InstanceID: instance.ID,
		Role:       "member",
	}))

	err := repo.RemoveMember(ctx, instance.ID, user.ID)
	require.NoError(t, err)

	isMember, err := repo.IsMember(ctx, instance.ID, user.ID)
	require.NoError(t, err)
	assert.False(t, isMember)
}

func TestInstanceRepository_Delete(t *testing.T) {
	db := setupRepoTestDB(t)
	repo := NewInstanceRepository(db)
	ctx := context.Background()

	user := models.User{ClerkID: "user_123", Email: "user@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "ToDelete", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, repo.Create(ctx, &instance))

	err := repo.Delete(ctx, instance.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instance.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}
