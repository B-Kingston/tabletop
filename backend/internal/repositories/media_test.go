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

func seedMediaTestDB(t *testing.T) (*gorm.DB, uuid.UUID, uuid.UUID) {
	db := setupRepoTestDB(t)

	user := models.User{ClerkID: "media_user", Email: "media@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "MediaTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	return db, instance.ID, user.ID
}

func createTestMediaItem(instanceID, userID uuid.UUID, overrides ...func(*models.MediaItem)) *models.MediaItem {
	item := &models.MediaItem{
		InstanceID:  instanceID,
		TMDBID:      123,
		Type:        "movie",
		Title:       "Test Movie",
		Overview:    "A test movie overview",
		PosterPath:  "/poster.jpg",
		Status:      "planning",
		CreatedByID: userID,
		UpdatedByID: userID,
	}
	for _, fn := range overrides {
		fn(item)
	}
	return item
}

func TestMediaRepository_Create(t *testing.T) {
	db, instanceID, userID := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	item := createTestMediaItem(instanceID, userID)
	err := repo.Create(ctx, item)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, item.ID)
	assert.Equal(t, "planning", item.Status)
}

func TestMediaRepository_GetByID(t *testing.T) {
	db, instanceID, userID := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	item := createTestMediaItem(instanceID, userID)
	require.NoError(t, repo.Create(ctx, item))

	found, err := repo.GetByID(ctx, instanceID, item.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Test Movie", found.Title)
	assert.Equal(t, item.TMDBID, found.TMDBID)
}

func TestMediaRepository_GetByID_NotFound(t *testing.T) {
	db, instanceID, _ := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	found, err := repo.GetByID(ctx, instanceID, uuid.New())
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestMediaRepository_GetByID_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	item := createTestMediaItem(instanceID, userID)
	require.NoError(t, repo.Create(ctx, item))

	found, err := repo.GetByID(ctx, uuid.New(), item.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestMediaRepository_List(t *testing.T) {
	db, instanceID, userID := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	items := []struct {
		mediaType string
		status    string
	}{
		{"movie", "planning"},
		{"tv", "watching"},
		{"movie", "completed"},
	}
	for _, tc := range items {
		require.NoError(t, repo.Create(ctx, createTestMediaItem(instanceID, userID, func(m *models.MediaItem) {
			m.Type = tc.mediaType
			m.Status = tc.status
			m.Title = tc.mediaType + " " + tc.status
		})))
	}

	tests := []struct {
		name      string
		status    string
		mediaType string
		expected  int
	}{
		{"all", "", "", 3},
		{"movies only", "", "movie", 2},
		{"tv only", "", "tv", 1},
		{"planning status", "planning", "", 1},
		{"watching status", "watching", "", 1},
		{"completed movies", "completed", "movie", 1},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			results, err := repo.List(ctx, instanceID, tc.status, tc.mediaType)
			require.NoError(t, err)
			assert.Len(t, results, tc.expected)
		})
	}
}

func TestMediaRepository_List_Empty(t *testing.T) {
	db, instanceID, _ := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	results, err := repo.List(ctx, instanceID, "", "")
	require.NoError(t, err)
	assert.Empty(t, results)
}

func TestMediaRepository_Update(t *testing.T) {
	db, instanceID, userID := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	item := createTestMediaItem(instanceID, userID)
	require.NoError(t, repo.Create(ctx, item))

	item.Status = "completed"
	rating := float32(8.5)
	item.Rating = &rating
	item.Review = "Great movie!"
	require.NoError(t, repo.Update(ctx, item))

	found, err := repo.GetByID(ctx, instanceID, item.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "completed", found.Status)
	assert.Equal(t, float32(8.5), *found.Rating)
	assert.Equal(t, "Great movie!", found.Review)
}

func TestMediaRepository_Delete(t *testing.T) {
	db, instanceID, userID := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	item := createTestMediaItem(instanceID, userID)
	require.NoError(t, repo.Create(ctx, item))

	err := repo.Delete(ctx, instanceID, item.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, item.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestMediaRepository_Delete_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedMediaTestDB(t)
	repo := NewMediaRepository(db)
	ctx := context.Background()

	item := createTestMediaItem(instanceID, userID)
	require.NoError(t, repo.Create(ctx, item))

	err := repo.Delete(ctx, uuid.New(), item.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, item.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}
