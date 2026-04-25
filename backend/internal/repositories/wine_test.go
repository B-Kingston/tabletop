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

func seedWineTestDB(t *testing.T) (*gorm.DB, uuid.UUID, uuid.UUID) {
	db := setupRepoTestDB(t)

	user := models.User{ClerkID: "wine_user", Email: "wine@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "WineTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	return db, instance.ID, user.ID
}

func createTestWine(instanceID, userID uuid.UUID, overrides ...func(*models.Wine)) *models.Wine {
	wine := &models.Wine{
		InstanceID:  instanceID,
		Name:        "Test Wine",
		Producer:    "Test Winery",
		Type:        models.WineTypeRed,
		Currency:    "AUD",
		CreatedByID: userID,
		UpdatedByID: userID,
	}
	for _, fn := range overrides {
		fn(wine)
	}
	return wine
}

func TestWineRepository_Create(t *testing.T) {
	db, instanceID, userID := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	wine := createTestWine(instanceID, userID)
	err := repo.Create(ctx, wine)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, wine.ID)
}

func TestWineRepository_GetByID(t *testing.T) {
	db, instanceID, userID := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	wine := createTestWine(instanceID, userID)
	require.NoError(t, repo.Create(ctx, wine))

	found, err := repo.GetByID(ctx, instanceID, wine.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Test Wine", found.Name)
	assert.Equal(t, models.WineTypeRed, found.Type)
}

func TestWineRepository_GetByID_NotFound(t *testing.T) {
	db, instanceID, _ := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	found, err := repo.GetByID(ctx, instanceID, uuid.New())
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestWineRepository_GetByID_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	wine := createTestWine(instanceID, userID)
	require.NoError(t, repo.Create(ctx, wine))

	found, err := repo.GetByID(ctx, uuid.New(), wine.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestWineRepository_List(t *testing.T) {
	db, instanceID, userID := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	wineTypes := []models.WineType{models.WineTypeRed, models.WineTypeWhite, models.WineTypeRed}
	for _, wt := range wineTypes {
		require.NoError(t, repo.Create(ctx, createTestWine(instanceID, userID, func(w *models.Wine) {
			w.Name = string(wt) + " Wine"
			w.Type = wt
		})))
	}

	t.Run("all wines", func(t *testing.T) {
		results, err := repo.List(ctx, instanceID, "")
		require.NoError(t, err)
		assert.Len(t, results, 3)
	})

	t.Run("filter by type", func(t *testing.T) {
		results, err := repo.List(ctx, instanceID, "red")
		require.NoError(t, err)
		assert.Len(t, results, 2)
	})

	t.Run("filter white", func(t *testing.T) {
		results, err := repo.List(ctx, instanceID, "white")
		require.NoError(t, err)
		assert.Len(t, results, 1)
	})
}

func TestWineRepository_List_Empty(t *testing.T) {
	db, instanceID, _ := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	results, err := repo.List(ctx, instanceID, "")
	require.NoError(t, err)
	assert.Empty(t, results)
}

func TestWineRepository_Update(t *testing.T) {
	db, instanceID, userID := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	wine := createTestWine(instanceID, userID)
	require.NoError(t, repo.Create(ctx, wine))

	wine.Name = "Updated Wine"
	wine.Type = models.WineTypeWhite
	rating := float32(4.5)
	wine.Rating = &rating
	require.NoError(t, repo.Update(ctx, wine))

	found, err := repo.GetByID(ctx, instanceID, wine.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Updated Wine", found.Name)
	assert.Equal(t, models.WineTypeWhite, found.Type)
	assert.Equal(t, float32(4.5), *found.Rating)
}

func TestWineRepository_Delete(t *testing.T) {
	db, instanceID, userID := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	wine := createTestWine(instanceID, userID)
	require.NoError(t, repo.Create(ctx, wine))

	err := repo.Delete(ctx, instanceID, wine.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, wine.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestWineRepository_Delete_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedWineTestDB(t)
	repo := NewWineRepository(db)
	ctx := context.Background()

	wine := createTestWine(instanceID, userID)
	require.NoError(t, repo.Create(ctx, wine))

	err := repo.Delete(ctx, uuid.New(), wine.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, wine.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}
