package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/utils"
)

type RecipeRepository interface {
	Create(ctx context.Context, recipe *models.Recipe) error
	GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Recipe, error)
	List(ctx context.Context, instanceID uuid.UUID, tag string) ([]models.Recipe, error)
	Update(ctx context.Context, recipe *models.Recipe) error
	Delete(ctx context.Context, instanceID, id uuid.UUID) error
	ReplaceIngredients(ctx context.Context, recipeID uuid.UUID, ingredients []models.Ingredient) error
	ReplaceSteps(ctx context.Context, recipeID uuid.UUID, steps []models.RecipeStep) error
	ReplaceTags(ctx context.Context, recipeID uuid.UUID, tags []models.RecipeTag) error
	FindOrCreateTag(ctx context.Context, name string) (*models.RecipeTag, error)
	CreateVersion(ctx context.Context, version *models.RecipeVersion) error
	ListVersions(ctx context.Context, instanceID, recipeID uuid.UUID) ([]models.RecipeVersion, error)
	GetVersion(ctx context.Context, instanceID, recipeID, versionID uuid.UUID) (*models.RecipeVersion, error)
	NextVersionNumber(ctx context.Context, recipeID uuid.UUID) (int, error)
	MarkVersionCurrent(ctx context.Context, recipeID, versionID uuid.UUID) error
}

type recipeRepository struct {
	db *gorm.DB
}

func NewRecipeRepository(db *gorm.DB) RecipeRepository {
	return &recipeRepository{db: db}
}

func (r *recipeRepository) Create(ctx context.Context, recipe *models.Recipe) error {
	if err := r.db.WithContext(ctx).Create(recipe).Error; err != nil {
		return fmt.Errorf("failed to create recipe: %w", err)
	}
	return nil
}

func (r *recipeRepository) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Recipe, error) {
	var recipe models.Recipe
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("Ingredients").
		Preload("Steps").
		Preload("Tags").
		Preload("CreatedBy").
		First(&recipe, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get recipe: %w", err)
	}
	return &recipe, nil
}

func (r *recipeRepository) List(ctx context.Context, instanceID uuid.UUID, tag string) ([]models.Recipe, error) {
	var recipes []models.Recipe
	q := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Preload("CreatedBy")

	if tag != "" {
		q = q.Joins("JOIN recipe_recipe_tags ON recipe_recipe_tags.recipe_id = recipes.id").
			Joins("JOIN recipe_tags ON recipe_tags.id = recipe_recipe_tags.recipe_tag_id").
			Where("recipe_tags.name = ?", tag)
	}

	if err := q.Find(&recipes).Error; err != nil {
		return nil, fmt.Errorf("failed to list recipes: %w", err)
	}
	return recipes, nil
}

func (r *recipeRepository) Update(ctx context.Context, recipe *models.Recipe) error {
	if err := r.db.WithContext(ctx).Save(recipe).Error; err != nil {
		return fmt.Errorf("failed to update recipe: %w", err)
	}
	return nil
}

func (r *recipeRepository) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Scopes(utils.ForInstance(instanceID)).
		Delete(&models.Recipe{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete recipe: %w", err)
	}
	return nil
}

func (r *recipeRepository) ReplaceIngredients(ctx context.Context, recipeID uuid.UUID, ingredients []models.Ingredient) error {
	if err := r.db.WithContext(ctx).Where("recipe_id = ?", recipeID).Delete(&models.Ingredient{}).Error; err != nil {
		return fmt.Errorf("failed to delete ingredients: %w", err)
	}
	if len(ingredients) > 0 {
		if err := r.db.WithContext(ctx).Create(&ingredients).Error; err != nil {
			return fmt.Errorf("failed to create ingredients: %w", err)
		}
	}
	return nil
}

func (r *recipeRepository) ReplaceSteps(ctx context.Context, recipeID uuid.UUID, steps []models.RecipeStep) error {
	if err := r.db.WithContext(ctx).Where("recipe_id = ?", recipeID).Delete(&models.RecipeStep{}).Error; err != nil {
		return fmt.Errorf("failed to delete steps: %w", err)
	}
	if len(steps) > 0 {
		if err := r.db.WithContext(ctx).Create(&steps).Error; err != nil {
			return fmt.Errorf("failed to create steps: %w", err)
		}
	}
	return nil
}

func (r *recipeRepository) ReplaceTags(ctx context.Context, recipeID uuid.UUID, tags []models.RecipeTag) error {
	if err := r.db.WithContext(ctx).
		Table("recipe_recipe_tags").
		Where("recipe_id = ?", recipeID).
		Delete(nil).Error; err != nil {
		return fmt.Errorf("failed to delete tag associations: %w", err)
	}

	recipe := models.Recipe{}
	recipe.ID = recipeID
	if len(tags) > 0 {
		if err := r.db.WithContext(ctx).Model(&recipe).Association("Tags").Replace(tags); err != nil {
			return fmt.Errorf("failed to replace tag associations: %w", err)
		}
	}
	return nil
}

func (r *recipeRepository) FindOrCreateTag(ctx context.Context, name string) (*models.RecipeTag, error) {
	var tag models.RecipeTag
	if err := r.db.WithContext(ctx).Where(models.RecipeTag{Name: name}).FirstOrCreate(&tag).Error; err != nil {
		return nil, fmt.Errorf("failed to find or create tag: %w", err)
	}
	return &tag, nil
}

func (r *recipeRepository) CreateVersion(ctx context.Context, version *models.RecipeVersion) error {
	if version.IsCurrent {
		if err := r.db.WithContext(ctx).
			Model(&models.RecipeVersion{}).
			Where("recipe_id = ?", version.RecipeID).
			Update("is_current", false).Error; err != nil {
			return fmt.Errorf("failed to clear current recipe version: %w", err)
		}
	}

	if err := r.db.WithContext(ctx).Create(version).Error; err != nil {
		return fmt.Errorf("failed to create recipe version: %w", err)
	}
	return nil
}

func (r *recipeRepository) ListVersions(ctx context.Context, instanceID, recipeID uuid.UUID) ([]models.RecipeVersion, error) {
	var versions []models.RecipeVersion
	if err := r.db.WithContext(ctx).
		Where("instance_id = ? AND recipe_id = ?", instanceID, recipeID).
		Preload("CreatedBy").
		Order("version_number DESC").
		Find(&versions).Error; err != nil {
		return nil, fmt.Errorf("failed to list recipe versions: %w", err)
	}
	return versions, nil
}

func (r *recipeRepository) GetVersion(ctx context.Context, instanceID, recipeID, versionID uuid.UUID) (*models.RecipeVersion, error) {
	var version models.RecipeVersion
	if err := r.db.WithContext(ctx).
		Where("instance_id = ? AND recipe_id = ? AND id = ?", instanceID, recipeID, versionID).
		Preload("CreatedBy").
		First(&version).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get recipe version: %w", err)
	}
	return &version, nil
}

func (r *recipeRepository) NextVersionNumber(ctx context.Context, recipeID uuid.UUID) (int, error) {
	var maxVersion int
	if err := r.db.WithContext(ctx).
		Model(&models.RecipeVersion{}).
		Where("recipe_id = ?", recipeID).
		Select("COALESCE(MAX(version_number), 0)").
		Scan(&maxVersion).Error; err != nil {
		return 0, fmt.Errorf("failed to get next recipe version number: %w", err)
	}
	return maxVersion + 1, nil
}

func (r *recipeRepository) MarkVersionCurrent(ctx context.Context, recipeID, versionID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.RecipeVersion{}).
			Where("recipe_id = ?", recipeID).
			Update("is_current", false).Error; err != nil {
			return fmt.Errorf("failed to clear current recipe version: %w", err)
		}
		if err := tx.Model(&models.RecipeVersion{}).
			Where("recipe_id = ? AND id = ?", recipeID, versionID).
			Update("is_current", true).Error; err != nil {
			return fmt.Errorf("failed to mark current recipe version: %w", err)
		}
		return nil
	})
}
