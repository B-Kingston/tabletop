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

func setupRecipeServiceTest(t *testing.T) (uuid.UUID, uuid.UUID) {
	db := setupServiceTestDB(t)
	ctx := context.Background()

	userRepo := repositories.NewUserRepository(db)
	instanceRepo := repositories.NewInstanceRepository(db)

	user := &models.User{ClerkID: "recipe_svc_user", Email: "recipe@test.com"}
	require.NoError(t, userRepo.Create(ctx, user))

	instance := &models.Instance{Name: "RecipeSvcTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, instanceRepo.Create(ctx, instance))
	require.NoError(t, instanceRepo.AddMember(ctx, &models.InstanceMembership{
		UserID: user.ID, InstanceID: instance.ID, Role: "owner",
	}))

	return instance.ID, user.ID
}

func TestRecipeService_Create(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)
	ctx := context.Background()

	instanceID, userID := setupRecipeServiceTest(t)

	recipe, err := svc.Create(ctx, instanceID, userID,
		"Pasta Carbonara", "Classic Italian", "https://example.com",
		15, 20, 4, "",
		[]IngredientInput{
			{Name: "Spaghetti", Quantity: "400g", Unit: "grams"},
			{Name: "Eggs", Quantity: "4", Unit: ""},
		},
		[]StepInput{
			{OrderIndex: 1, Content: "Boil pasta"},
			{OrderIndex: 2, Content: "Mix eggs and cheese"},
		},
		[]string{"italian", "pasta"},
	)
	require.NoError(t, err)
	assert.Equal(t, "Pasta Carbonara", recipe.Title)
	assert.Equal(t, 15, recipe.PrepTime)
	assert.Len(t, recipe.Ingredients, 2)
	assert.Len(t, recipe.Steps, 2)
	assert.Len(t, recipe.Tags, 2)
}

func TestRecipeService_Create_NoIngredientsOrSteps(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)
	ctx := context.Background()

	instanceID, userID := setupRecipeServiceTest(t)

	recipe, err := svc.Create(ctx, instanceID, userID,
		"Simple Recipe", "Easy", "", 5, 0, 1, "",
		nil, nil, nil,
	)
	require.NoError(t, err)
	assert.Equal(t, "Simple Recipe", recipe.Title)
	assert.Empty(t, recipe.Ingredients)
	assert.Empty(t, recipe.Steps)
	assert.Empty(t, recipe.Tags)
}

func TestRecipeService_GetByID(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)
	ctx := context.Background()

	instanceID, userID := setupRecipeServiceTest(t)

	recipe, err := svc.Create(ctx, instanceID, userID,
		"Test Recipe", "Desc", "", 10, 20, 2, "",
		[]IngredientInput{{Name: "Salt", Quantity: "1", Unit: "tsp"}},
		[]StepInput{{OrderIndex: 1, Content: "Add salt"}},
		nil,
	)
	require.NoError(t, err)

	found, err := svc.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Test Recipe", found.Title)
	assert.Len(t, found.Ingredients, 1)
	assert.Len(t, found.Steps, 1)
}

func TestRecipeService_GetByID_NotFound(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)

	_, _ = setupRecipeServiceTest(t)

	_, err := svc.GetByID(context.Background(), uuid.New(), uuid.New())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestRecipeService_List(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)
	ctx := context.Background()

	instanceID, userID := setupRecipeServiceTest(t)

	for _, title := range []string{"Pasta", "Salad"} {
		_, err := svc.Create(ctx, instanceID, userID, title, "", "", 10, 10, 2, "", nil, nil, nil)
		require.NoError(t, err)
	}

	recipes, err := svc.List(ctx, instanceID, "")
	require.NoError(t, err)
	assert.Len(t, recipes, 2)
}

func TestRecipeService_Update(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)
	ctx := context.Background()

	instanceID, userID := setupRecipeServiceTest(t)

	recipe, err := svc.Create(ctx, instanceID, userID,
		"Original", "Desc", "", 10, 20, 2, "",
		[]IngredientInput{{Name: "Salt", Quantity: "1", Unit: "tsp"}},
		[]StepInput{{OrderIndex: 1, Content: "Step 1"}},
		[]string{"quick"},
	)
	require.NoError(t, err)

	updated, err := svc.Update(ctx, instanceID, recipe.ID, userID,
		"Updated Recipe", "New desc", "", 15, 25, 3, "",
		[]IngredientInput{{Name: "Pepper", Quantity: "2", Unit: "tsp"}},
		[]StepInput{{OrderIndex: 1, Content: "New step 1"}, {OrderIndex: 2, Content: "New step 2"}},
		[]string{"dinner"},
	)
	require.NoError(t, err)
	assert.Equal(t, "Updated Recipe", updated.Title)
	assert.Equal(t, 15, updated.PrepTime)
	assert.Len(t, updated.Ingredients, 1)
	assert.Equal(t, "Pepper", updated.Ingredients[0].Name)
	assert.Len(t, updated.Steps, 2)
	assert.Len(t, updated.Tags, 1)
	assert.Equal(t, "dinner", updated.Tags[0].Name)
}

func TestRecipeService_Update_NotFound(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)

	_, _ = setupRecipeServiceTest(t)

	_, err := svc.Update(context.Background(), uuid.New(), uuid.New(), uuid.New(),
		"X", "", "", 0, 0, 0, "", nil, nil, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestRecipeService_Delete(t *testing.T) {
	db := setupServiceTestDB(t)
	repo := repositories.NewRecipeRepository(db)
	svc := NewRecipeService(repo, nil)
	ctx := context.Background()

	instanceID, userID := setupRecipeServiceTest(t)

	recipe, err := svc.Create(ctx, instanceID, userID, "ToDelete", "", "", 0, 0, 0, "", nil, nil, nil)
	require.NoError(t, err)

	err = svc.Delete(ctx, instanceID, recipe.ID)
	require.NoError(t, err)

	_, err = svc.GetByID(ctx, instanceID, recipe.ID)
	assert.Error(t, err)
}
