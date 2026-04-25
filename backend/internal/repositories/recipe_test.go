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

func seedRecipeTestDB(t *testing.T) (*gorm.DB, uuid.UUID, uuid.UUID) {
	db := setupRepoTestDB(t)

	user := models.User{ClerkID: "recipe_user", Email: "recipe@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "RecipeTest", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	return db, instance.ID, user.ID
}

func createTestRecipe(instanceID, userID uuid.UUID) *models.Recipe {
	return &models.Recipe{
		InstanceID:  instanceID,
		Title:       "Test Recipe",
		Description: "A test recipe",
		PrepTime:    15,
		CookTime:    30,
		Servings:    4,
		CreatedByID: userID,
		UpdatedByID: userID,
	}
}

func TestRecipeRepository_Create(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	err := repo.Create(ctx, recipe)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, recipe.ID)
}

func TestRecipeRepository_GetByID(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Test Recipe", found.Title)
	assert.Equal(t, 15, found.PrepTime)
	assert.Equal(t, 30, found.CookTime)
}

func TestRecipeRepository_GetByID_WithAssociations(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	ingredients := []models.Ingredient{
		{RecipeID: recipe.ID, Name: "Flour", Quantity: "2", Unit: "cups"},
		{RecipeID: recipe.ID, Name: "Sugar", Quantity: "1", Unit: "cup"},
	}
	require.NoError(t, repo.ReplaceIngredients(ctx, recipe.ID, ingredients))

	steps := []models.RecipeStep{
		{RecipeID: recipe.ID, OrderIndex: 1, Content: "Mix dry ingredients"},
		{RecipeID: recipe.ID, OrderIndex: 2, Content: "Add wet ingredients"},
	}
	require.NoError(t, repo.ReplaceSteps(ctx, recipe.ID, steps))

	tag, err := repo.FindOrCreateTag(ctx, "dessert")
	require.NoError(t, err)
	require.NoError(t, repo.ReplaceTags(ctx, recipe.ID, []models.RecipeTag{*tag}))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Len(t, found.Ingredients, 2)
	assert.Len(t, found.Steps, 2)
	assert.Len(t, found.Tags, 1)
	assert.Equal(t, "dessert", found.Tags[0].Name)
}

func TestRecipeRepository_GetByID_NotFound(t *testing.T) {
	db, instanceID, _ := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	found, err := repo.GetByID(ctx, instanceID, uuid.New())
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestRecipeRepository_GetByID_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	found, err := repo.GetByID(ctx, uuid.New(), recipe.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestRecipeRepository_List(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	for _, title := range []string{"Pasta", "Salad", "Soup"} {
		r := createTestRecipe(instanceID, userID)
		r.Title = title
		require.NoError(t, repo.Create(ctx, r))
	}

	results, err := repo.List(ctx, instanceID, "")
	require.NoError(t, err)
	assert.Len(t, results, 3)
}

func TestRecipeRepository_List_ByTag(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	tagged := createTestRecipe(instanceID, userID)
	tagged.Title = "Tagged Recipe"
	require.NoError(t, repo.Create(ctx, tagged))

	tag, err := repo.FindOrCreateTag(ctx, "italian")
	require.NoError(t, err)
	require.NoError(t, repo.ReplaceTags(ctx, tagged.ID, []models.RecipeTag{*tag}))

	untagged := createTestRecipe(instanceID, userID)
	untagged.Title = "Untagged Recipe"
	require.NoError(t, repo.Create(ctx, untagged))

	results, err := repo.List(ctx, instanceID, "italian")
	require.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, "Tagged Recipe", results[0].Title)
}

func TestRecipeRepository_Update(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	recipe.Title = "Updated Recipe"
	recipe.PrepTime = 20
	require.NoError(t, repo.Update(ctx, recipe))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	require.NotNil(t, found)
	assert.Equal(t, "Updated Recipe", found.Title)
	assert.Equal(t, 20, found.PrepTime)
}

func TestRecipeRepository_Delete(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	err := repo.Delete(ctx, instanceID, recipe.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	assert.Nil(t, found)
}

func TestRecipeRepository_Delete_WrongInstance(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	err := repo.Delete(ctx, uuid.New(), recipe.ID)
	require.NoError(t, err)

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}

func TestRecipeRepository_ReplaceIngredients(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	ingredients := []models.Ingredient{
		{RecipeID: recipe.ID, Name: "Flour", Quantity: "2", Unit: "cups"},
	}
	require.NoError(t, repo.ReplaceIngredients(ctx, recipe.ID, ingredients))

	newIngredients := []models.Ingredient{
		{RecipeID: recipe.ID, Name: "Rice", Quantity: "1", Unit: "cup"},
		{RecipeID: recipe.ID, Name: "Water", Quantity: "2", Unit: "cups"},
	}
	require.NoError(t, repo.ReplaceIngredients(ctx, recipe.ID, newIngredients))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	assert.Len(t, found.Ingredients, 2)
	assert.Equal(t, "Rice", found.Ingredients[0].Name)
}

func TestRecipeRepository_ReplaceSteps(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	steps := []models.RecipeStep{
		{RecipeID: recipe.ID, OrderIndex: 1, Content: "Step one"},
	}
	require.NoError(t, repo.ReplaceSteps(ctx, recipe.ID, steps))

	newSteps := []models.RecipeStep{
		{RecipeID: recipe.ID, OrderIndex: 1, Content: "New step one"},
		{RecipeID: recipe.ID, OrderIndex: 2, Content: "New step two"},
	}
	require.NoError(t, repo.ReplaceSteps(ctx, recipe.ID, newSteps))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	assert.Len(t, found.Steps, 2)
	assert.Equal(t, "New step one", found.Steps[0].Content)
}

func TestRecipeRepository_ReplaceTags(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	tag1, err := repo.FindOrCreateTag(ctx, "dinner")
	require.NoError(t, err)
	require.NoError(t, repo.ReplaceTags(ctx, recipe.ID, []models.RecipeTag{*tag1}))

	tag2, err := repo.FindOrCreateTag(ctx, "quick")
	require.NoError(t, err)
	require.NoError(t, repo.ReplaceTags(ctx, recipe.ID, []models.RecipeTag{*tag2}))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	assert.Len(t, found.Tags, 1)
	assert.Equal(t, "quick", found.Tags[0].Name)
}

func TestRecipeRepository_FindOrCreateTag(t *testing.T) {
	db, _, _ := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	tag1, err := repo.FindOrCreateTag(ctx, "vegan")
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, tag1.ID)

	tag2, err := repo.FindOrCreateTag(ctx, "vegan")
	require.NoError(t, err)
	assert.Equal(t, tag1.ID, tag2.ID)
}

func TestRecipeRepository_ReplaceIngredients_Empty(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	ingredients := []models.Ingredient{
		{RecipeID: recipe.ID, Name: "Flour", Quantity: "2", Unit: "cups"},
	}
	require.NoError(t, repo.ReplaceIngredients(ctx, recipe.ID, ingredients))

	require.NoError(t, repo.ReplaceIngredients(ctx, recipe.ID, []models.Ingredient{}))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	assert.Empty(t, found.Ingredients)
}

func TestRecipeRepository_ReplaceSteps_Empty(t *testing.T) {
	db, instanceID, userID := seedRecipeTestDB(t)
	repo := NewRecipeRepository(db)
	ctx := context.Background()

	recipe := createTestRecipe(instanceID, userID)
	require.NoError(t, repo.Create(ctx, recipe))

	steps := []models.RecipeStep{
		{RecipeID: recipe.ID, OrderIndex: 1, Content: "Step one"},
	}
	require.NoError(t, repo.ReplaceSteps(ctx, recipe.ID, steps))

	require.NoError(t, repo.ReplaceSteps(ctx, recipe.ID, []models.RecipeStep{}))

	found, err := repo.GetByID(ctx, instanceID, recipe.ID)
	require.NoError(t, err)
	assert.Empty(t, found.Steps)
}
