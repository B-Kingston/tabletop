package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

type IngredientInput struct {
	Name     string
	Quantity string
	Unit     string
	Optional bool
}

type StepInput struct {
	OrderIndex  int
	Title       string
	Content     string
	DurationMin *int
}

type RecipeService struct {
	recipeRepo   repositories.RecipeRepository
	openaiClient *OpenAIService
}

func NewRecipeService(recipeRepo repositories.RecipeRepository, openaiClient *OpenAIService) *RecipeService {
	return &RecipeService{recipeRepo: recipeRepo, openaiClient: openaiClient}
}

func (s *RecipeService) Create(
	ctx context.Context,
	instanceID, userID uuid.UUID,
	title, description, sourceUrl string,
	prepTime, cookTime, servings int,
	imageURL string,
	ingredients []IngredientInput,
	steps []StepInput,
	tagNames []string,
) (*models.Recipe, error) {
	recipe := &models.Recipe{
		InstanceID:  instanceID,
		Title:       title,
		Description: description,
		SourceURL:   sourceUrl,
		PrepTime:    prepTime,
		CookTime:    cookTime,
		Servings:    servings,
		ImageURL:    imageURL,
		CreatedByID: userID,
		UpdatedByID: userID,
	}

	if err := s.recipeRepo.Create(ctx, recipe); err != nil {
		return nil, err
	}

	if len(ingredients) > 0 {
		ingredientModels := make([]models.Ingredient, len(ingredients))
		for i, inp := range ingredients {
			ingredientModels[i] = models.Ingredient{
				RecipeID: recipe.ID,
				Name:     inp.Name,
				Quantity: inp.Quantity,
				Unit:     inp.Unit,
				Optional: inp.Optional,
			}
		}
		if err := s.recipeRepo.ReplaceIngredients(ctx, recipe.ID, ingredientModels); err != nil {
			return nil, fmt.Errorf("failed to create ingredients: %w", err)
		}
		recipe.Ingredients = ingredientModels
	}

	if len(steps) > 0 {
		stepModels := make([]models.RecipeStep, len(steps))
		for i, inp := range steps {
			stepModels[i] = models.RecipeStep{
				RecipeID:    recipe.ID,
				OrderIndex:  inp.OrderIndex,
				Title:       inp.Title,
				Content:     inp.Content,
				DurationMin: inp.DurationMin,
			}
		}
		if err := s.recipeRepo.ReplaceSteps(ctx, recipe.ID, stepModels); err != nil {
			return nil, fmt.Errorf("failed to create steps: %w", err)
		}
		recipe.Steps = stepModels
	}

	if len(tagNames) > 0 {
		tags := make([]models.RecipeTag, len(tagNames))
		for i, name := range tagNames {
			tag, err := s.recipeRepo.FindOrCreateTag(ctx, name)
			if err != nil {
				return nil, fmt.Errorf("failed to find or create tag: %w", err)
			}
			tags[i] = *tag
		}
		if err := s.recipeRepo.ReplaceTags(ctx, recipe.ID, tags); err != nil {
			return nil, fmt.Errorf("failed to associate tags: %w", err)
		}
		recipe.Tags = tags
	}

	return recipe, nil
}

func (s *RecipeService) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Recipe, error) {
	recipe, err := s.recipeRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if recipe == nil {
		return nil, fmt.Errorf("recipe not found")
	}
	return recipe, nil
}

func (s *RecipeService) List(ctx context.Context, instanceID uuid.UUID, tag string) ([]models.Recipe, error) {
	return s.recipeRepo.List(ctx, instanceID, tag)
}

func (s *RecipeService) Update(
	ctx context.Context,
	instanceID, id, userID uuid.UUID,
	title, description, sourceUrl string,
	prepTime, cookTime, servings int,
	imageURL string,
	ingredients []IngredientInput,
	steps []StepInput,
	tagNames []string,
) (*models.Recipe, error) {
	recipe, err := s.recipeRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if recipe == nil {
		return nil, fmt.Errorf("recipe not found")
	}

	recipe.Title = title
	recipe.Description = description
	recipe.SourceURL = sourceUrl
	recipe.PrepTime = prepTime
	recipe.CookTime = cookTime
	recipe.Servings = servings
	recipe.ImageURL = imageURL
	recipe.UpdatedByID = userID

	if err := s.recipeRepo.Update(ctx, recipe); err != nil {
		return nil, err
	}

	ingredientModels := make([]models.Ingredient, len(ingredients))
	for i, inp := range ingredients {
		ingredientModels[i] = models.Ingredient{
			RecipeID: recipe.ID,
			Name:     inp.Name,
			Quantity: inp.Quantity,
			Unit:     inp.Unit,
			Optional: inp.Optional,
		}
	}
	if err := s.recipeRepo.ReplaceIngredients(ctx, recipe.ID, ingredientModels); err != nil {
		return nil, fmt.Errorf("failed to replace ingredients: %w", err)
	}
	recipe.Ingredients = ingredientModels

	stepModels := make([]models.RecipeStep, len(steps))
	for i, inp := range steps {
		stepModels[i] = models.RecipeStep{
			RecipeID:    recipe.ID,
			OrderIndex:  inp.OrderIndex,
			Title:       inp.Title,
			Content:     inp.Content,
			DurationMin: inp.DurationMin,
		}
	}
	if err := s.recipeRepo.ReplaceSteps(ctx, recipe.ID, stepModels); err != nil {
		return nil, fmt.Errorf("failed to replace steps: %w", err)
	}
	recipe.Steps = stepModels

	tags := make([]models.RecipeTag, len(tagNames))
	for i, name := range tagNames {
		tag, err := s.recipeRepo.FindOrCreateTag(ctx, name)
		if err != nil {
			return nil, fmt.Errorf("failed to find or create tag: %w", err)
		}
		tags[i] = *tag
	}
	if err := s.recipeRepo.ReplaceTags(ctx, recipe.ID, tags); err != nil {
		return nil, fmt.Errorf("failed to replace tags: %w", err)
	}
	recipe.Tags = tags

	return recipe, nil
}

func (s *RecipeService) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	return s.recipeRepo.Delete(ctx, instanceID, id)
}

// GenerateRecipe uses the OpenAI service to generate a structured recipe from
// a natural-language prompt. Rate limiting is applied per user before the
// OpenAI call.
func (s *RecipeService) GenerateRecipe(ctx context.Context, userID uuid.UUID, prompt string) (*GeneratedRecipe, error) {
	if s.openaiClient == nil {
		return nil, ErrRateLimiterUnavailable
	}

	if err := s.openaiClient.CheckRateLimit(ctx, userID); err != nil {
		return nil, fmt.Errorf("rate limit: %w", err)
	}

	return s.openaiClient.GenerateRecipe(ctx, prompt)
}
