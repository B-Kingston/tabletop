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

func setupMediaServiceTestDB(t *testing.T) (*repositories.GormUserRepository, *repositories.GormInstanceRepository, uuid.UUID, uuid.UUID) {
	db := setupServiceTestDB(t)
	userRepo := repositories.NewUserRepository(db)
	instanceRepo := repositories.NewInstanceRepository(db)
	ctx := context.Background()

	user := &models.User{ClerkID: "media_svc_user", Email: "media@test.com"}
	require.NoError(t, userRepo.Create(ctx, user))

	instance := &models.Instance{Name: "MediaSvcTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, instanceRepo.Create(ctx, instance))
	require.NoError(t, instanceRepo.AddMember(ctx, &models.InstanceMembership{
		UserID: user.ID, InstanceID: instance.ID, Role: "owner",
	}))

	return userRepo, instanceRepo, instance.ID, user.ID
}

func TestMediaService_Create(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, userID := setupMediaServiceTestDB(t)

	item, err := svc.Create(ctx, instanceID, userID, 550, "movie", "Fight Club", "A great movie", "/poster.jpg", nil)
	require.NoError(t, err)
	require.NotNil(t, item)
	assert.Equal(t, "Fight Club", item.Title)
	assert.Equal(t, "planning", item.Status)
	assert.Equal(t, 550, item.TMDBID)
	assert.Equal(t, instanceID, item.InstanceID)
	assert.Equal(t, userID, item.CreatedByID)
}

func TestMediaService_GetByID(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, userID := setupMediaServiceTestDB(t)

	item, err := svc.Create(ctx, instanceID, userID, 550, "movie", "Fight Club", "", "", nil)
	require.NoError(t, err)

	found, err := svc.GetByID(ctx, instanceID, item.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Fight Club", found.Title)
}

func TestMediaService_GetByID_NotFound(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, _ := setupMediaServiceTestDB(t)

	_, err := svc.GetByID(ctx, instanceID, uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestMediaService_List(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, userID := setupMediaServiceTestDB(t)

	_, err := svc.Create(ctx, instanceID, userID, 1, "movie", "Movie A", "", "", nil)
	require.NoError(t, err)
	_, err = svc.Create(ctx, instanceID, userID, 2, "tv", "TV Show B", "", "", nil)
	require.NoError(t, err)

	items, err := svc.List(ctx, instanceID, "", "")
	require.NoError(t, err)
	assert.Len(t, items, 2)

	movies, err := svc.List(ctx, instanceID, "", "movie")
	require.NoError(t, err)
	assert.Len(t, movies, 1)
	assert.Equal(t, "Movie A", movies[0].Title)
}

func TestMediaService_Update(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, userID := setupMediaServiceTestDB(t)

	item, err := svc.Create(ctx, instanceID, userID, 550, "movie", "Fight Club", "", "", nil)
	require.NoError(t, err)

	rating := float32(9.0)
	updated, err := svc.Update(ctx, instanceID, item.ID, userID, "completed", &rating, "Amazing!", nil)
	require.NoError(t, err)
	assert.Equal(t, "completed", updated.Status)
	assert.Equal(t, float32(9.0), *updated.Rating)
	assert.Equal(t, "Amazing!", updated.Review)
}

func TestMediaService_Update_PartialFields(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, userID := setupMediaServiceTestDB(t)

	item, err := svc.Create(ctx, instanceID, userID, 550, "movie", "Fight Club", "", "", nil)
	require.NoError(t, err)

	updated, err := svc.Update(ctx, instanceID, item.ID, userID, "watching", nil, "", nil)
	require.NoError(t, err)
	assert.Equal(t, "watching", updated.Status)
	assert.Nil(t, updated.Rating)
	assert.Equal(t, "", updated.Review)
}

func TestMediaService_Update_NotFound(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, userID := setupMediaServiceTestDB(t)

	_, err := svc.Update(ctx, instanceID, uuid.New(), userID, "completed", nil, "", nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestMediaService_Delete(t *testing.T) {
	db := setupServiceTestDB(t)
	mediaRepo := repositories.NewMediaRepository(db)
	svc := NewMediaService(mediaRepo)
	ctx := context.Background()

	_, _, instanceID, userID := setupMediaServiceTestDB(t)

	item, err := svc.Create(ctx, instanceID, userID, 550, "movie", "Fight Club", "", "", nil)
	require.NoError(t, err)

	err = svc.Delete(ctx, instanceID, item.ID)
	require.NoError(t, err)

	_, err = svc.GetByID(ctx, instanceID, item.ID)
	assert.Error(t, err)
}
