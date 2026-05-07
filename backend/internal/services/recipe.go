package services

import (
	"context"
	"encoding/json"
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

type recipeSnapshot struct {
	Title       string                     `json:"title"`
	Description string                     `json:"description"`
	SourceURL   string                     `json:"sourceUrl"`
	SourceURLs  []string                   `json:"sourceUrls"`
	PrepTime    int                        `json:"prepTime"`
	CookTime    int                        `json:"cookTime"`
	Servings    int                        `json:"servings"`
	ImageURL    string                     `json:"imageUrl"`
	Ingredients []recipeIngredientSnapshot `json:"ingredients"`
	Steps       []recipeStepSnapshot       `json:"steps"`
	Tags        []string                   `json:"tags"`
}

type recipeIngredientSnapshot struct {
	Name     string `json:"name"`
	Quantity string `json:"quantity"`
	Unit     string `json:"unit"`
	Optional bool   `json:"optional"`
}

type recipeStepSnapshot struct {
	OrderIndex  int    `json:"orderIndex"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	DurationMin *int   `json:"durationMin"`
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
	sourceURLs ...[]string,
) (*models.Recipe, error) {
	allSourceURLs := normalizeSourceURLs(sourceUrl, sourceURLs...)
	if sourceUrl == "" && len(allSourceURLs) > 0 {
		sourceUrl = allSourceURLs[0]
	}
	recipe := &models.Recipe{
		InstanceID:  instanceID,
		Title:       title,
		Description: description,
		SourceURL:   sourceUrl,
		SourceURLs:  models.StringList(allSourceURLs),
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
	sourceURLs ...[]string,
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
	recipe.SourceURLs = models.StringList(normalizeSourceURLs(sourceUrl, sourceURLs...))
	if sourceUrl == "" && len(recipe.SourceURLs) > 0 {
		sourceUrl = recipe.SourceURLs[0]
	}
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

func (s *RecipeService) ListVersions(ctx context.Context, instanceID, recipeID uuid.UUID) ([]models.RecipeVersion, error) {
	recipe, err := s.recipeRepo.GetByID(ctx, instanceID, recipeID)
	if err != nil {
		return nil, err
	}
	if recipe == nil {
		return nil, fmt.Errorf("recipe not found")
	}
	return s.recipeRepo.ListVersions(ctx, instanceID, recipeID)
}

func (s *RecipeService) RemixRecipe(ctx context.Context, instanceID, recipeID, userID uuid.UUID, prompt string, simplicity int) (*models.Recipe, error) {
	if s.openaiClient == nil {
		return nil, ErrRateLimiterUnavailable
	}

	recipe, err := s.recipeRepo.GetByID(ctx, instanceID, recipeID)
	if err != nil {
		return nil, err
	}
	if recipe == nil {
		return nil, fmt.Errorf("recipe not found")
	}

	if err := s.ensureVersionHistoryStarted(ctx, recipe, userID); err != nil {
		return nil, err
	}

	currentSnapshot, err := snapshotRecipe(recipe)
	if err != nil {
		return nil, err
	}

	if err := s.openaiClient.CheckRateLimit(ctx, userID); err != nil {
		return nil, fmt.Errorf("rate limit: %w", err)
	}

	generated, err := s.openaiClient.GenerateRecipe(ctx, buildRemixPrompt(prompt, currentSnapshot, simplicity))
	if err != nil {
		return nil, err
	}

	generatedSnapshot, err := snapshotGeneratedRecipe(generated)
	if err != nil {
		return nil, err
	}
	versionNumber, err := s.recipeRepo.NextVersionNumber(ctx, recipeID)
	if err != nil {
		return nil, err
	}

	version := &models.RecipeVersion{
		InstanceID:    instanceID,
		RecipeID:      recipeID,
		VersionNumber: versionNumber,
		RemixPrompt:   prompt,
		Snapshot:      models.JSONBlob(generatedSnapshot),
		CreatedByID:   userID,
		IsCurrent:     false,
	}
	if err := s.recipeRepo.CreateVersion(ctx, version); err != nil {
		return nil, err
	}

	updated, err := s.applyGeneratedRecipe(ctx, instanceID, recipeID, userID, generated)
	if err != nil {
		return nil, err
	}
	if err := s.recipeRepo.MarkVersionCurrent(ctx, recipeID, version.ID); err != nil {
		return nil, err
	}

	return updated, nil
}

func (s *RecipeService) RestoreVersion(ctx context.Context, instanceID, recipeID, versionID, userID uuid.UUID) (*models.Recipe, error) {
	version, err := s.recipeRepo.GetVersion(ctx, instanceID, recipeID, versionID)
	if err != nil {
		return nil, err
	}
	if version == nil {
		return nil, fmt.Errorf("recipe version not found")
	}

	var snapshot recipeSnapshot
	if err := json.Unmarshal(version.Snapshot, &snapshot); err != nil {
		return nil, fmt.Errorf("failed to parse recipe version snapshot: %w", err)
	}

	updated, err := s.applySnapshot(ctx, instanceID, recipeID, userID, snapshot)
	if err != nil {
		return nil, err
	}
	if err := s.recipeRepo.MarkVersionCurrent(ctx, recipeID, versionID); err != nil {
		return nil, err
	}

	return updated, nil
}

// GenerateRecipe uses the OpenAI service to generate a structured recipe from
// a natural-language prompt. Rate limiting is applied per user before the
// OpenAI call.
func (s *RecipeService) GenerateRecipe(ctx context.Context, userID uuid.UUID, prompt string, simplicity int) (*GeneratedRecipe, error) {
	if s.openaiClient == nil {
		return nil, ErrRateLimiterUnavailable
	}

	if err := s.openaiClient.CheckRateLimit(ctx, userID); err != nil {
		return nil, fmt.Errorf("rate limit: %w", err)
	}

	return s.openaiClient.GenerateRecipe(ctx, buildSimplicityPrompt(prompt, simplicity))
}

func (s *RecipeService) ensureVersionHistoryStarted(ctx context.Context, recipe *models.Recipe, userID uuid.UUID) error {
	versions, err := s.recipeRepo.ListVersions(ctx, recipe.InstanceID, recipe.ID)
	if err != nil {
		return err
	}
	if len(versions) > 0 {
		return nil
	}

	snapshot, err := snapshotRecipe(recipe)
	if err != nil {
		return err
	}
	return s.recipeRepo.CreateVersion(ctx, &models.RecipeVersion{
		InstanceID:    recipe.InstanceID,
		RecipeID:      recipe.ID,
		VersionNumber: 1,
		RemixPrompt:   "",
		Snapshot:      models.JSONBlob(snapshot),
		CreatedByID:   userID,
		IsCurrent:     true,
	})
}

func (s *RecipeService) applyGeneratedRecipe(ctx context.Context, instanceID, recipeID, userID uuid.UUID, generated *GeneratedRecipe) (*models.Recipe, error) {
	sourceURL := ""
	if len(generated.SourceURLs) > 0 {
		sourceURL = generated.SourceURLs[0]
	}

	ingredients := make([]IngredientInput, len(generated.Ingredients))
	for i, ing := range generated.Ingredients {
		ingredients[i] = IngredientInput{
			Name:     ing.Name,
			Quantity: ing.Quantity,
			Unit:     ing.Unit,
			Optional: ing.Optional,
		}
	}

	steps := make([]StepInput, len(generated.Steps))
	for i, step := range generated.Steps {
		orderIndex := step.OrderIndex
		if orderIndex == 0 {
			orderIndex = i + 1
		}
		steps[i] = StepInput{
			OrderIndex:  orderIndex,
			Title:       step.Title,
			Content:     step.Content,
			DurationMin: step.DurationMin,
		}
	}

	return s.Update(ctx, instanceID, recipeID, userID,
		generated.Title, generated.Description, sourceURL,
		generated.PrepTime, generated.CookTime, generated.Servings,
		"", ingredients, steps, generated.Tags, generated.SourceURLs,
	)
}

func (s *RecipeService) applySnapshot(ctx context.Context, instanceID, recipeID, userID uuid.UUID, snapshot recipeSnapshot) (*models.Recipe, error) {
	ingredients := make([]IngredientInput, len(snapshot.Ingredients))
	for i, ing := range snapshot.Ingredients {
		ingredients[i] = IngredientInput{
			Name:     ing.Name,
			Quantity: ing.Quantity,
			Unit:     ing.Unit,
			Optional: ing.Optional,
		}
	}

	steps := make([]StepInput, len(snapshot.Steps))
	for i, step := range snapshot.Steps {
		steps[i] = StepInput{
			OrderIndex:  step.OrderIndex,
			Title:       step.Title,
			Content:     step.Content,
			DurationMin: step.DurationMin,
		}
	}

	return s.Update(ctx, instanceID, recipeID, userID,
		snapshot.Title, snapshot.Description, snapshot.SourceURL,
		snapshot.PrepTime, snapshot.CookTime, snapshot.Servings,
		snapshot.ImageURL, ingredients, steps, snapshot.Tags, snapshot.SourceURLs,
	)
}

func snapshotRecipe(recipe *models.Recipe) ([]byte, error) {
	snapshot := recipeSnapshot{
		Title:       recipe.Title,
		Description: recipe.Description,
		SourceURL:   recipe.SourceURL,
		SourceURLs:  []string(recipe.SourceURLs),
		PrepTime:    recipe.PrepTime,
		CookTime:    recipe.CookTime,
		Servings:    recipe.Servings,
		ImageURL:    recipe.ImageURL,
		Ingredients: make([]recipeIngredientSnapshot, len(recipe.Ingredients)),
		Steps:       make([]recipeStepSnapshot, len(recipe.Steps)),
		Tags:        make([]string, len(recipe.Tags)),
	}

	for i, ing := range recipe.Ingredients {
		snapshot.Ingredients[i] = recipeIngredientSnapshot{
			Name:     ing.Name,
			Quantity: ing.Quantity,
			Unit:     ing.Unit,
			Optional: ing.Optional,
		}
	}
	for i, step := range recipe.Steps {
		snapshot.Steps[i] = recipeStepSnapshot{
			OrderIndex:  step.OrderIndex,
			Title:       step.Title,
			Content:     step.Content,
			DurationMin: step.DurationMin,
		}
	}
	for i, tag := range recipe.Tags {
		snapshot.Tags[i] = tag.Name
	}

	return json.Marshal(snapshot)
}

func snapshotGeneratedRecipe(generated *GeneratedRecipe) ([]byte, error) {
	sourceURL := ""
	if len(generated.SourceURLs) > 0 {
		sourceURL = generated.SourceURLs[0]
	}

	snapshot := recipeSnapshot{
		Title:       generated.Title,
		Description: generated.Description,
		SourceURL:   sourceURL,
		SourceURLs:  generated.SourceURLs,
		PrepTime:    generated.PrepTime,
		CookTime:    generated.CookTime,
		Servings:    generated.Servings,
		ImageURL:    "",
		Ingredients: make([]recipeIngredientSnapshot, len(generated.Ingredients)),
		Steps:       make([]recipeStepSnapshot, len(generated.Steps)),
		Tags:        generated.Tags,
	}
	for i, ing := range generated.Ingredients {
		snapshot.Ingredients[i] = recipeIngredientSnapshot{
			Name:     ing.Name,
			Quantity: ing.Quantity,
			Unit:     ing.Unit,
			Optional: ing.Optional,
		}
	}
	for i, step := range generated.Steps {
		orderIndex := step.OrderIndex
		if orderIndex == 0 {
			orderIndex = i + 1
		}
		snapshot.Steps[i] = recipeStepSnapshot{
			OrderIndex:  orderIndex,
			Title:       step.Title,
			Content:     step.Content,
			DurationMin: step.DurationMin,
		}
	}

	return json.Marshal(snapshot)
}

func buildRemixPrompt(prompt string, currentSnapshot []byte, simplicity int) string {
	return fmt.Sprintf("Remix the current recipe JSON according to the user's prompt. Return a complete replacement recipe, not a patch.\n\n%s\n\nCurrent recipe JSON:\n%s", buildSimplicityPrompt(prompt, simplicity), string(currentSnapshot))
}

func buildSimplicityPrompt(prompt string, simplicity int) string {
	if simplicity < 1 {
		simplicity = 3
	}
	if simplicity > 5 {
		simplicity = 5
	}

	guidance := map[int]string{
		1: "Keep the recipe extremely simple, quick, low-effort, and forgiving. Prefer very few ingredients, pantry staples, minimal prep, and short cook time.",
		2: "Keep the recipe mostly simple and weeknight-friendly. Use accessible ingredients and avoid elaborate techniques.",
		3: "Use a balanced everyday level of complexity with a reasonable ingredient list and clear technique.",
		4: "Allow a more involved recipe with layered flavor, a few extra steps, and moderate prep if it improves the result.",
		5: "Allow an ambitious, more complex recipe with deeper technique, longer prep, and more developed flavors while staying practical for a home cook.",
	}

	return fmt.Sprintf("Recipe simplicity level: %d out of 5. %s\n\nUser prompt:\n%s", simplicity, guidance[simplicity], prompt)
}

func normalizeSourceURLs(primary string, sourceURLs ...[]string) []string {
	seen := map[string]bool{}
	var urls []string
	for _, group := range sourceURLs {
		for _, url := range group {
			if url == "" || seen[url] {
				continue
			}
			seen[url] = true
			urls = append(urls, url)
		}
	}
	if primary != "" && !seen[primary] {
		urls = append([]string{primary}, urls...)
	}
	return urls
}
