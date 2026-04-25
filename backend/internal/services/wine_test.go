package services

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

func setupWineServiceTest(t *testing.T) (uuid.UUID, uuid.UUID) {
	db := setupServiceTestDB(t)
	ctx := context.Background()

	userRepo := repositories.NewUserRepository(db)
	instanceRepo := repositories.NewInstanceRepository(db)

	user := &models.User{ClerkID: "wine_svc_user", Email: "wine@test.com"}
	require.NoError(t, userRepo.Create(ctx, user))

	instance := &models.Instance{Name: "WineSvcTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, instanceRepo.Create(ctx, instance))
	require.NoError(t, instanceRepo.AddMember(ctx, &models.InstanceMembership{
		UserID: user.ID, InstanceID: instance.ID, Role: "owner",
	}))

	return instance.ID, user.ID
}

func TestWineService_Create(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)
	ctx := context.Background()

	instanceID, userID := setupWineServiceTest(t)

	wine, err := svc.Create(ctx, instanceID, userID, "Barolo", "Giacomo", "red", nil, nil, "", nil, "Great wine", nil)
	require.NoError(t, err)
	require.NotNil(t, wine)
	assert.Equal(t, "Barolo", wine.Name)
	assert.Equal(t, models.WineTypeRed, wine.Type)
	assert.Equal(t, "AUD", wine.Currency)
}

func TestWineService_Create_DefaultCurrency(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)
	ctx := context.Background()

	instanceID, userID := setupWineServiceTest(t)

	wine, err := svc.Create(ctx, instanceID, userID, "Sancerre", "Domaine", "white", nil, nil, "", nil, "", nil)
	require.NoError(t, err)
	assert.Equal(t, "AUD", wine.Currency)
}

func TestWineService_Create_WithOptionalFields(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)
	ctx := context.Background()

	instanceID, userID := setupWineServiceTest(t)

	vintage := 2018
	cost := 45.50
	rating := float32(4.5)
	consumedAt := time.Now()

	wine, err := svc.Create(ctx, instanceID, userID, "Chianti", "Producer", "red", &vintage, &cost, "EUR", &rating, "Excellent", &consumedAt)
	require.NoError(t, err)
	assert.Equal(t, 2018, *wine.Vintage)
	assert.Equal(t, 45.50, *wine.Cost)
	assert.Equal(t, "EUR", wine.Currency)
	assert.Equal(t, float32(4.5), *wine.Rating)
}

func TestWineService_GetByID(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)
	ctx := context.Background()

	instanceID, userID := setupWineServiceTest(t)

	wine, err := svc.Create(ctx, instanceID, userID, "Barolo", "Giacomo", "red", nil, nil, "", nil, "", nil)
	require.NoError(t, err)

	found, err := svc.GetByID(ctx, instanceID, wine.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Barolo", found.Name)
}

func TestWineService_GetByID_NotFound(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)

	_, _ = setupWineServiceTest(t)

	_, err := svc.GetByID(context.Background(), uuid.New(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestWineService_List(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)
	ctx := context.Background()

	instanceID, userID := setupWineServiceTest(t)

	_, err := svc.Create(ctx, instanceID, userID, "Red 1", "P1", "red", nil, nil, "", nil, "", nil)
	require.NoError(t, err)
	_, err = svc.Create(ctx, instanceID, userID, "White 1", "P2", "white", nil, nil, "", nil, "", nil)
	require.NoError(t, err)

	all, err := svc.List(ctx, instanceID, "")
	require.NoError(t, err)
	assert.Len(t, all, 2)

	reds, err := svc.List(ctx, instanceID, "red")
	require.NoError(t, err)
	assert.Len(t, reds, 1)
	assert.Equal(t, "Red 1", reds[0].Name)
}

func TestWineService_Update(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)
	ctx := context.Background()

	instanceID, userID := setupWineServiceTest(t)

	wine, err := svc.Create(ctx, instanceID, userID, "Barolo", "Giacomo", "red", nil, nil, "", nil, "", nil)
	require.NoError(t, err)

	newName := "Updated Barolo"
	rating := float32(4.8)
	updated, err := svc.Update(ctx, instanceID, wine.ID, userID, &newName, nil, nil, nil, nil, nil, &rating, nil, nil)
	require.NoError(t, err)
	assert.Equal(t, "Updated Barolo", updated.Name)
	assert.Equal(t, float32(4.8), *updated.Rating)
}

func TestWineService_Update_NotFound(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)

	_, _ = setupWineServiceTest(t)

	_, err := svc.Update(context.Background(), uuid.New(), uuid.New(), uuid.New(), nil, nil, nil, nil, nil, nil, nil, nil, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestWineService_Delete(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewWineRepository(db)
	svc := NewWineService(repo)
	ctx := context.Background()

	instanceID, userID := setupWineServiceTest(t)

	wine, err := svc.Create(ctx, instanceID, userID, "ToDelete", "P", "red", nil, nil, "", nil, "", nil)
	require.NoError(t, err)

	err = svc.Delete(ctx, instanceID, wine.ID)
	require.NoError(t, err)

	_, err = svc.GetByID(ctx, instanceID, wine.ID)
	assert.Error(t, err)
}
