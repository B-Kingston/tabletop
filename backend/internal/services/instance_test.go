package services

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

func setupServiceTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{},
		&models.MediaItem{}, &models.Wine{}, &models.Recipe{},
	)
	require.NoError(t, err)

	return db
}

func TestInstanceService_CreateAndGet(t *testing.T) {
	db := setupServiceTestDB(t)
	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	svc := NewInstanceService(instanceRepo, userRepo)
	ctx := context.Background()

	user := &models.User{ClerkID: "user_123", Email: "user@test.com"}
	require.NoError(t, userRepo.Create(ctx, user))

	instance, err := svc.CreateInstance(ctx, user.ID, "My Group", "secret123")
	require.NoError(t, err)
	assert.Equal(t, "My Group", instance.Name)
	assert.Equal(t, user.ID, instance.OwnerID)

	// Verify owner is a member
	isMember, err := instanceRepo.IsMember(ctx, instance.ID, user.ID)
	require.NoError(t, err)
	assert.True(t, isMember)

	// Get instance
	found, err := svc.GetInstance(ctx, instance.ID, user.ID)
	require.NoError(t, err)
	assert.Equal(t, "My Group", found.Name)
}

func TestInstanceService_JoinInstance(t *testing.T) {
	db := setupServiceTestDB(t)
	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	svc := NewInstanceService(instanceRepo, userRepo)
	ctx := context.Background()

	owner := &models.User{ClerkID: "owner_123", Email: "owner@test.com"}
	member := &models.User{ClerkID: "member_456", Email: "member@test.com"}
	require.NoError(t, userRepo.Create(ctx, owner))
	require.NoError(t, userRepo.Create(ctx, member))

	instance, err := svc.CreateInstance(ctx, owner.ID, "Test Group", "password123")
	require.NoError(t, err)

	// Member joins with correct password
	err = svc.JoinInstance(ctx, instance.ID, member.ID, "password123")
	require.NoError(t, err)

	isMember, err := instanceRepo.IsMember(ctx, instance.ID, member.ID)
	require.NoError(t, err)
	assert.True(t, isMember)
}

func TestInstanceService_JoinInstance_WrongPassword(t *testing.T) {
	db := setupServiceTestDB(t)
	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	svc := NewInstanceService(instanceRepo, userRepo)
	ctx := context.Background()

	owner := &models.User{ClerkID: "owner_123", Email: "owner@test.com"}
	member := &models.User{ClerkID: "member_456", Email: "member@test.com"}
	require.NoError(t, userRepo.Create(ctx, owner))
	require.NoError(t, userRepo.Create(ctx, member))

	instance, err := svc.CreateInstance(ctx, owner.ID, "Test Group", "password123")
	require.NoError(t, err)

	err = svc.JoinInstance(ctx, instance.ID, member.ID, "wrongpassword")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid password")
}

func TestInstanceService_ListUserInstances(t *testing.T) {
	db := setupServiceTestDB(t)
	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	svc := NewInstanceService(instanceRepo, userRepo)
	ctx := context.Background()

	user := &models.User{ClerkID: "user_123", Email: "user@test.com"}
	require.NoError(t, userRepo.Create(ctx, user))

	_, err := svc.CreateInstance(ctx, user.ID, "Group A", "pass1")
	require.NoError(t, err)
	_, err = svc.CreateInstance(ctx, user.ID, "Group B", "pass2")
	require.NoError(t, err)

	instances, err := svc.ListUserInstances(ctx, user.ID)
	require.NoError(t, err)
	assert.Len(t, instances, 2)
}

func TestInstanceService_LeaveInstance(t *testing.T) {
	db := setupServiceTestDB(t)
	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	svc := NewInstanceService(instanceRepo, userRepo)
	ctx := context.Background()

	owner := &models.User{ClerkID: "owner_123", Email: "owner@test.com"}
	member := &models.User{ClerkID: "member_456", Email: "member@test.com"}
	require.NoError(t, userRepo.Create(ctx, owner))
	require.NoError(t, userRepo.Create(ctx, member))

	instance, err := svc.CreateInstance(ctx, owner.ID, "Test Group", "password123")
	require.NoError(t, err)

	err = svc.JoinInstance(ctx, instance.ID, member.ID, "password123")
	require.NoError(t, err)

	err = svc.LeaveInstance(ctx, instance.ID, member.ID)
	require.NoError(t, err)

	isMember, err := instanceRepo.IsMember(ctx, instance.ID, member.ID)
	require.NoError(t, err)
	assert.False(t, isMember)
}

func TestInstanceService_LeaveInstance_OwnerCannotLeave(t *testing.T) {
	db := setupServiceTestDB(t)
	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	svc := NewInstanceService(instanceRepo, userRepo)
	ctx := context.Background()

	owner := &models.User{ClerkID: "owner_123", Email: "owner@test.com"}
	require.NoError(t, userRepo.Create(ctx, owner))

	instance, err := svc.CreateInstance(ctx, owner.ID, "Test Group", "password123")
	require.NoError(t, err)

	err = svc.LeaveInstance(ctx, instance.ID, owner.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "transfer ownership or delete")
}

func TestInstanceService_DeleteInstance(t *testing.T) {
	db := setupServiceTestDB(t)
	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	svc := NewInstanceService(instanceRepo, userRepo)
	ctx := context.Background()

	owner := &models.User{ClerkID: "owner_123", Email: "owner@test.com"}
	member := &models.User{ClerkID: "member_456", Email: "member@test.com"}
	require.NoError(t, userRepo.Create(ctx, owner))
	require.NoError(t, userRepo.Create(ctx, member))

	instance, err := svc.CreateInstance(ctx, owner.ID, "ToDelete", "password123")
	require.NoError(t, err)

	// Member cannot delete
	err = svc.DeleteInstance(ctx, instance.ID, member.ID)
	assert.Error(t, err)

	// Owner can delete
	err = svc.DeleteInstance(ctx, instance.ID, owner.ID)
	require.NoError(t, err)

	found, err := instanceRepo.GetByID(ctx, instance.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}
