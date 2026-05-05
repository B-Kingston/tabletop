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

func seedNightTestDB(t *testing.T) (*gorm.DB, uuid.UUID, uuid.UUID) {
	db := setupRepoTestDB(t)

	user := models.User{ClerkID: "night_user", Email: "night@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "NightTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	require.NoError(t, db.AutoMigrate(&models.Night{}))

	return db, instance.ID, user.ID
}

func createTestWineForNight(instanceID, userID uuid.UUID) *models.Wine {
	return &models.Wine{
		InstanceID:  instanceID,
		Name:        "Test Wine",
		Type:        models.WineTypeRed,
		CreatedByID: userID,
		UpdatedByID: userID,
	}
}

func createTestRecipeForNight(instanceID, userID uuid.UUID) *models.Recipe {
	return &models.Recipe{
		InstanceID:  instanceID,
		Title:       "Test Recipe",
		PrepTime:    10,
		CookTime:    20,
		Servings:    2,
		CreatedByID: userID,
		UpdatedByID: userID,
	}
}

func createTestMediaItemForNight(instanceID, userID uuid.UUID) *models.MediaItem {
	return &models.MediaItem{
		InstanceID:  instanceID,
		TMDBID:      123,
		Type:        "movie",
		Title:       "Test Movie",
		CreatedByID: userID,
		UpdatedByID: userID,
	}
}

func createTestNight(instanceID, userID uuid.UUID, overrides ...func(*models.Night)) *models.Night {
	night := &models.Night{
		InstanceID:  instanceID,
		Name:        "Test Night",
		CreatedByID: userID,
		UpdatedByID: userID,
	}
	for _, fn := range overrides {
		fn(night)
	}
	return night
}

func TestNightRepository_Create(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	wine := createTestWineForNight(instanceID, userID)
	require.NoError(t, db.Create(wine).Error)

	night := createTestNight(instanceID, userID, func(n *models.Night) {
		n.WineID = &wine.ID
	})
	err := repo.Create(ctx, night)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, night.ID)
}

func TestNightRepository_GetByID(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	wine := createTestWineForNight(instanceID, userID)
	require.NoError(t, db.Create(wine).Error)
	recipe := createTestRecipeForNight(instanceID, userID)
	require.NoError(t, db.Create(recipe).Error)
	media := createTestMediaItemForNight(instanceID, userID)
	require.NoError(t, db.Create(media).Error)

	night := createTestNight(instanceID, userID, func(n *models.Night) {
		n.WineID = &wine.ID
		n.RecipeID = &recipe.ID
		n.MediaID = &media.ID
	})
	require.NoError(t, repo.Create(ctx, night))

	found, err := repo.GetByID(ctx, instanceID, night.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Test Night", found.Name)
	require.NotNil(t, found.Wine)
	assert.Equal(t, "Test Wine", found.Wine.Name)
	require.NotNil(t, found.Recipe)
	assert.Equal(t, "Test Recipe", found.Recipe.Title)
	require.NotNil(t, found.Media)
	assert.Equal(t, "Test Movie", found.Media.Title)
}

func TestNightRepository_GetByID_NullFKs(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	wine := createTestWineForNight(instanceID, userID)
	require.NoError(t, db.Create(wine).Error)

	night := createTestNight(instanceID, userID, func(n *models.Night) {
		n.WineID = &wine.ID
		// recipe_id and media_id intentionally left nil
	})
	require.NoError(t, repo.Create(ctx, night))

	found, err := repo.GetByID(ctx, instanceID, night.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	require.NotNil(t, found.Wine)
	assert.Equal(t, "Test Wine", found.Wine.Name)
	assert.Nil(t, found.Recipe)
	assert.Nil(t, found.Media)
}

func TestNightRepository_GetByID_NotFound(t *testing.T) {
	db, instanceID, _ := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	found, err := repo.GetByID(ctx, instanceID, uuid.New())
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestNightRepository_GetByID_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	night := createTestNight(instanceID, userID)
	require.NoError(t, repo.Create(ctx, night))

	found, err := repo.GetByID(ctx, uuid.New(), night.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestNightRepository_List(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	names := []string{"Alpha Night", "Beta Night", "Gamma Night"}
	for _, name := range names {
		require.NoError(t, repo.Create(ctx, createTestNight(instanceID, userID, func(n *models.Night) {
			n.Name = name
		})))
	}

	results, err := repo.List(ctx, instanceID)
	require.NoError(t, err)
	assert.Len(t, results, 3)
	// Verify descending order by created_at
	assert.Equal(t, "Gamma Night", results[0].Name)
	assert.Equal(t, "Beta Night", results[1].Name)
	assert.Equal(t, "Alpha Night", results[2].Name)
}

func TestNightRepository_List_Empty(t *testing.T) {
	db, instanceID, _ := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	results, err := repo.List(ctx, instanceID)
	require.NoError(t, err)
	assert.Empty(t, results)
}

func TestNightRepository_Update(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	wine := createTestWineForNight(instanceID, userID)
	require.NoError(t, db.Create(wine).Error)
	recipe := createTestRecipeForNight(instanceID, userID)
	require.NoError(t, db.Create(recipe).Error)

	night := createTestNight(instanceID, userID, func(n *models.Night) {
		n.WineID = &wine.ID
	})
	require.NoError(t, repo.Create(ctx, night))

	night.Name = "Updated Night"
	night.RecipeID = &recipe.ID
	require.NoError(t, repo.Update(ctx, night))

	found, err := repo.GetByID(ctx, instanceID, night.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Updated Night", found.Name)
	require.NotNil(t, found.Recipe)
	assert.Equal(t, "Test Recipe", found.Recipe.Title)
}

func TestNightRepository_Delete(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	night := createTestNight(instanceID, userID)
	require.NoError(t, repo.Create(ctx, night))

	err := repo.Delete(ctx, instanceID, night.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, night.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestNightRepository_Delete_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedNightTestDB(t)
	repo := NewNightRepository(db)
	ctx := context.Background()

	night := createTestNight(instanceID, userID)
	require.NoError(t, repo.Create(ctx, night))

	err := repo.Delete(ctx, uuid.New(), night.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, night.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}
