package services

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tabletop/backend/internal/models"
)

// ---- Mock repositories ----

type mockNightRepo struct {
	nights      map[uuid.UUID]*models.Night
	createErr   error
	updateErr   error
	deleteErr   error
}

func newMockNightRepo() *mockNightRepo {
	return &mockNightRepo{nights: make(map[uuid.UUID]*models.Night)}
}

func (m *mockNightRepo) Create(ctx context.Context, night *models.Night) error {
	if m.createErr != nil {
		return m.createErr
	}
	night.ID = uuid.New()
	m.nights[night.ID] = night
	return nil
}

func (m *mockNightRepo) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Night, error) {
	night, ok := m.nights[id]
	if !ok || night.InstanceID != instanceID {
		return nil, nil
	}
	// Return a copy
	copyNight := *night
	return &copyNight, nil
}

func (m *mockNightRepo) List(ctx context.Context, instanceID uuid.UUID) ([]models.Night, error) {
	var out []models.Night
	for _, n := range m.nights {
		if n.InstanceID == instanceID {
			copyNight := *n
			out = append(out, copyNight)
		}
	}
	return out, nil
}

func (m *mockNightRepo) Update(ctx context.Context, night *models.Night) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	m.nights[night.ID] = night
	return nil
}

func (m *mockNightRepo) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	if m.deleteErr != nil {
		return m.deleteErr
	}
	night, ok := m.nights[id]
	if ok && night.InstanceID == instanceID {
		delete(m.nights, id)
	}
	return nil
}

type mockWineRepo struct {
	wines map[uuid.UUID]*models.Wine
}

func newMockWineRepo() *mockWineRepo {
	return &mockWineRepo{wines: make(map[uuid.UUID]*models.Wine)}
}

func (m *mockWineRepo) Create(ctx context.Context, wine *models.Wine) error { return nil }
func (m *mockWineRepo) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Wine, error) {
	wine, ok := m.wines[id]
	if !ok || wine.InstanceID != instanceID {
		return nil, nil
	}
	copyWine := *wine
	return &copyWine, nil
}
func (m *mockWineRepo) List(ctx context.Context, instanceID uuid.UUID, wineType string) ([]models.Wine, error) { return nil, nil }
func (m *mockWineRepo) Update(ctx context.Context, wine *models.Wine) error { return nil }
func (m *mockWineRepo) Delete(ctx context.Context, instanceID, id uuid.UUID) error { return nil }

type mockRecipeRepo struct {
	recipes map[uuid.UUID]*models.Recipe
}

func newMockRecipeRepo() *mockRecipeRepo {
	return &mockRecipeRepo{recipes: make(map[uuid.UUID]*models.Recipe)}
}

func (m *mockRecipeRepo) Create(ctx context.Context, recipe *models.Recipe) error { return nil }
func (m *mockRecipeRepo) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Recipe, error) {
	recipe, ok := m.recipes[id]
	if !ok || recipe.InstanceID != instanceID {
		return nil, nil
	}
	copyRecipe := *recipe
	return &copyRecipe, nil
}
func (m *mockRecipeRepo) List(ctx context.Context, instanceID uuid.UUID, tag string) ([]models.Recipe, error) { return nil, nil }
func (m *mockRecipeRepo) Update(ctx context.Context, recipe *models.Recipe) error { return nil }
func (m *mockRecipeRepo) Delete(ctx context.Context, instanceID, id uuid.UUID) error { return nil }
func (m *mockRecipeRepo) ReplaceIngredients(ctx context.Context, recipeID uuid.UUID, ingredients []models.Ingredient) error { return nil }
func (m *mockRecipeRepo) ReplaceSteps(ctx context.Context, recipeID uuid.UUID, steps []models.RecipeStep) error { return nil }
func (m *mockRecipeRepo) ReplaceTags(ctx context.Context, recipeID uuid.UUID, tags []models.RecipeTag) error { return nil }
func (m *mockRecipeRepo) FindOrCreateTag(ctx context.Context, name string) (*models.RecipeTag, error) { return nil, nil }

type mockMediaRepo struct {
	items map[uuid.UUID]*models.MediaItem
}

func newMockMediaRepo() *mockMediaRepo {
	return &mockMediaRepo{items: make(map[uuid.UUID]*models.MediaItem)}
}

func (m *mockMediaRepo) Create(ctx context.Context, item *models.MediaItem) error { return nil }
func (m *mockMediaRepo) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.MediaItem, error) {
	item, ok := m.items[id]
	if !ok || item.InstanceID != instanceID {
		return nil, nil
	}
	copyItem := *item
	return &copyItem, nil
}
func (m *mockMediaRepo) List(ctx context.Context, instanceID uuid.UUID, status, mediaType string) ([]models.MediaItem, error) { return nil, nil }
func (m *mockMediaRepo) Update(ctx context.Context, item *models.MediaItem) error { return nil }
func (m *mockMediaRepo) Delete(ctx context.Context, instanceID, id uuid.UUID) error { return nil }

// ---- Service tests ----

func setupNightServiceTest(t *testing.T) (*NightService, uuid.UUID, uuid.UUID, *mockNightRepo, *mockWineRepo, *mockRecipeRepo, *mockMediaRepo) {
	instanceID := uuid.New()
	userID := uuid.New()
	nightRepo := newMockNightRepo()
	wineRepo := newMockWineRepo()
	recipeRepo := newMockRecipeRepo()
	mediaRepo := newMockMediaRepo()
	svc := NewNightService(nightRepo, wineRepo, recipeRepo, mediaRepo)
	return svc, instanceID, userID, nightRepo, wineRepo, recipeRepo, mediaRepo
}

func TestNightService_Create(t *testing.T) {
	svc, instanceID, userID, _, wineRepo, recipeRepo, mediaRepo := setupNightServiceTest(t)
	ctx := context.Background()

	wineID := uuid.New()
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: instanceID, Name: "Barolo"}
	recipeID := uuid.New()
	recipeRepo.recipes[recipeID] = &models.Recipe{UUIDModel: models.UUIDModel{ID: recipeID}, InstanceID: instanceID, Title: "Bolognese"}
	mediaID := uuid.New()
	mediaRepo.items[mediaID] = &models.MediaItem{UUIDModel: models.UUIDModel{ID: mediaID}, InstanceID: instanceID, Title: "The Godfather"}

	night, err := svc.Create(ctx, instanceID, userID, "", &wineID, &recipeID, &mediaID)
	require.NoError(t, err)
	require.NotNil(t, night)
	assert.Equal(t, "Barolo & Bolognese & The Godfather Night", night.Name)
	assert.Equal(t, wineID, *night.WineID)
	assert.Equal(t, recipeID, *night.RecipeID)
	assert.Equal(t, mediaID, *night.MediaID)
}

func TestNightService_Create_WithName(t *testing.T) {
	svc, instanceID, userID, _, wineRepo, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	wineID := uuid.New()
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: instanceID, Name: "Barolo"}

	night, err := svc.Create(ctx, instanceID, userID, "Custom Name", &wineID, nil, nil)
	require.NoError(t, err)
	assert.Equal(t, "Custom Name", night.Name)
}

func TestNightService_Create_AutoNameOneItem(t *testing.T) {
	svc, instanceID, userID, _, wineRepo, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	wineID := uuid.New()
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: instanceID, Name: "Barolo"}

	night, err := svc.Create(ctx, instanceID, userID, "", &wineID, nil, nil)
	require.NoError(t, err)
	assert.Equal(t, "Barolo Night", night.Name)
}

func TestNightService_Create_AutoNameNoItems(t *testing.T) {
	svc, instanceID, userID, _, _, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	night, err := svc.Create(ctx, instanceID, userID, "", nil, nil, nil)
	require.NoError(t, err)
	assert.Equal(t, "New Night", night.Name)
}

func TestNightService_Create_AutoNameTruncated(t *testing.T) {
	svc, instanceID, userID, _, wineRepo, recipeRepo, mediaRepo := setupNightServiceTest(t)
	ctx := context.Background()

	wineID := uuid.New()
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: instanceID, Name: "Penfolds Grange Hermitage 1951 Vintage"}
	recipeID := uuid.New()
	recipeRepo.recipes[recipeID] = &models.Recipe{UUIDModel: models.UUIDModel{ID: recipeID}, InstanceID: instanceID, Title: "Slow-Cooked Beef Ragu with Hand-Rolled Pappardelle"}
	mediaID := uuid.New()
	mediaRepo.items[mediaID] = &models.MediaItem{UUIDModel: models.UUIDModel{ID: mediaID}, InstanceID: instanceID, Title: "The Godfather Part II"}

	night, err := svc.Create(ctx, instanceID, userID, "", &wineID, &recipeID, &mediaID)
	require.NoError(t, err)
	assert.True(t, len(night.Name) <= 60, "auto-generated name should be truncated to <= 60 chars, got %d", len(night.Name))
	assert.Contains(t, night.Name, "...")
	assert.True(t, night.Name[len(night.Name)-6:] == " Night" || night.Name[len(night.Name)-9:] == " Ni...", "name should end with Night or truncated variant")
}

func TestNightService_Create_FKValidationRejectsCrossInstance(t *testing.T) {
	svc, instanceID, userID, _, wineRepo, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	wineID := uuid.New()
	// Wine belongs to a different instance
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: uuid.New(), Name: "Other Wine"}

	_, err := svc.Create(ctx, instanceID, userID, "", &wineID, nil, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "wine not found in this instance")
}

func TestNightService_GetByID(t *testing.T) {
	svc, instanceID, userID, nightRepo, _, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	id := uuid.New()
	nightRepo.nights[id] = &models.Night{UUIDModel: models.UUIDModel{ID: id}, InstanceID: instanceID, Name: "Found", CreatedByID: userID}

	found, err := svc.GetByID(ctx, instanceID, id)
	require.NoError(t, err)
	assert.Equal(t, "Found", found.Name)
}

func TestNightService_GetByID_NotFound(t *testing.T) {
	svc, instanceID, _, _, _, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	_, err := svc.GetByID(ctx, instanceID, uuid.New())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "night not found")
}

func TestNightService_List(t *testing.T) {
	svc, instanceID, userID, nightRepo, _, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	for i := 0; i < 3; i++ {
		id := uuid.New()
		nightRepo.nights[id] = &models.Night{UUIDModel: models.UUIDModel{ID: id}, InstanceID: instanceID, Name: "Night", CreatedByID: userID}
	}

	results, err := svc.List(ctx, instanceID)
	require.NoError(t, err)
	assert.Len(t, results, 3)
}

func TestNightService_Update(t *testing.T) {
	svc, instanceID, userID, nightRepo, wineRepo, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	id := uuid.New()
	nightRepo.nights[id] = &models.Night{UUIDModel: models.UUIDModel{ID: id}, InstanceID: instanceID, Name: "Old", CreatedByID: userID}

	wineID := uuid.New()
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: instanceID, Name: "Barolo"}

	newName := "Updated"
	updated, err := svc.Update(ctx, instanceID, id, userID, &newName, &wineID, nil, nil, nil, nil, nil)
	require.NoError(t, err)
	assert.Equal(t, "Updated", updated.Name)
	assert.Equal(t, wineID, *updated.WineID)
}

func TestNightService_Update_ClearWine(t *testing.T) {
	svc, instanceID, userID, nightRepo, wineRepo, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	wineID := uuid.New()
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: instanceID, Name: "Barolo"}

	id := uuid.New()
	nightRepo.nights[id] = &models.Night{UUIDModel: models.UUIDModel{ID: id}, InstanceID: instanceID, Name: "Old", WineID: &wineID, CreatedByID: userID}

	clear := true
	updated, err := svc.Update(ctx, instanceID, id, userID, nil, nil, nil, nil, &clear, nil, nil)
	require.NoError(t, err)
	assert.Nil(t, updated.WineID)
}

func TestNightService_Update_FKValidationRejectsCrossInstance(t *testing.T) {
	svc, instanceID, userID, nightRepo, wineRepo, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	id := uuid.New()
	nightRepo.nights[id] = &models.Night{UUIDModel: models.UUIDModel{ID: id}, InstanceID: instanceID, Name: "Old", CreatedByID: userID}

	wineID := uuid.New()
	wineRepo.wines[wineID] = &models.Wine{UUIDModel: models.UUIDModel{ID: wineID}, InstanceID: uuid.New(), Name: "Other"}

	_, err := svc.Update(ctx, instanceID, id, userID, nil, &wineID, nil, nil, nil, nil, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "wine not found in this instance")
}

func TestNightService_Update_NotFound(t *testing.T) {
	svc, instanceID, userID, _, _, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	newName := "Updated"
	_, err := svc.Update(ctx, instanceID, uuid.New(), userID, &newName, nil, nil, nil, nil, nil, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "night not found")
}

func TestNightService_Delete(t *testing.T) {
	svc, instanceID, userID, nightRepo, _, _, _ := setupNightServiceTest(t)
	ctx := context.Background()

	id := uuid.New()
	nightRepo.nights[id] = &models.Night{UUIDModel: models.UUIDModel{ID: id}, InstanceID: instanceID, Name: "ToDelete", CreatedByID: userID}

	err := svc.Delete(ctx, instanceID, id)
	require.NoError(t, err)
	assert.Nil(t, nightRepo.nights[id])
}
