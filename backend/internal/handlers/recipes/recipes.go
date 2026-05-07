package recipes

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/services"
)

type Handler struct {
	service *services.RecipeService
	db      *gorm.DB
}

func NewHandler(service *services.RecipeService, db *gorm.DB) *Handler {
	return &Handler{service: service, db: db}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	recipes := r.Group("/recipes")
	recipes.Use(middleware.RequireInstanceMembership(h.db))
	{
		recipes.POST("", h.Create)
		recipes.GET("", h.List)
		recipes.GET("/:recipe_id", h.Get)
		recipes.PATCH("/:recipe_id", h.Update)
		recipes.DELETE("/:recipe_id", h.Delete)
		recipes.POST("/generate", h.Generate)
	}
}

type recipeIngredientInput struct {
	Name     string `json:"name" binding:"required"`
	Quantity string `json:"quantity"`
	Unit     string `json:"unit"`
	Optional bool   `json:"optional"`
}

type recipeStepInput struct {
	OrderIndex  int    `json:"orderIndex"`
	Title       string `json:"title"`
	Content     string `json:"content" binding:"required"`
	DurationMin *int   `json:"durationMin"`
}

type CreateRequest struct {
	Title       string                  `json:"title" binding:"required"`
	Description string                  `json:"description"`
	SourceURL   string                  `json:"sourceUrl"`
	PrepTime    int                     `json:"prepTime"`
	CookTime    int                     `json:"cookTime"`
	Servings    int                     `json:"servings"`
	ImageURL    string                  `json:"imageUrl"`
	Ingredients []recipeIngredientInput `json:"ingredients"`
	Steps       []recipeStepInput       `json:"steps"`
	Tags        []string                `json:"tags"`
}

type UpdateRequest struct {
	Title       *string                 `json:"title"`
	Description *string                 `json:"description"`
	SourceURL   *string                 `json:"sourceUrl"`
	PrepTime    *int                    `json:"prepTime"`
	CookTime    *int                    `json:"cookTime"`
	Servings    *int                    `json:"servings"`
	ImageURL    *string                 `json:"imageUrl"`
	Ingredients []recipeIngredientInput `json:"ingredients"`
	Steps       []recipeStepInput       `json:"steps"`
	Tags        []string                `json:"tags"`
}

func (h *Handler) Create(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ingredients := make([]services.IngredientInput, len(req.Ingredients))
	for i, inp := range req.Ingredients {
		ingredients[i] = services.IngredientInput{
			Name:     inp.Name,
			Quantity: inp.Quantity,
			Unit:     inp.Unit,
			Optional: inp.Optional,
		}
	}

	steps := make([]services.StepInput, len(req.Steps))
	for i, inp := range req.Steps {
		steps[i] = services.StepInput{
			OrderIndex:  inp.OrderIndex,
			Title:       inp.Title,
			Content:     inp.Content,
			DurationMin: inp.DurationMin,
		}
	}

	recipe, err := h.service.Create(
		c.Request.Context(), instanceID, userID,
		req.Title, req.Description, req.SourceURL,
		req.PrepTime, req.CookTime, req.Servings,
		req.ImageURL, ingredients, steps, req.Tags,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": recipe})
}

func (h *Handler) List(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	tag := c.Query("tag")

	recipes, err := h.service.List(c.Request.Context(), instanceID, tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": recipes})
}

func (h *Handler) Get(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	recipeIDStr := c.Param("recipe_id")
	recipeID, err := uuid.Parse(recipeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipe id"})
		return
	}

	recipe, err := h.service.GetByID(c.Request.Context(), instanceID, recipeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": recipe})
}

func (h *Handler) Update(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	recipeIDStr := c.Param("recipe_id")
	recipeID, err := uuid.Parse(recipeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipe id"})
		return
	}

	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing, err := h.service.GetByID(c.Request.Context(), instanceID, recipeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	title := existing.Title
	if req.Title != nil {
		title = *req.Title
	}
	description := existing.Description
	if req.Description != nil {
		description = *req.Description
	}
	sourceUrl := existing.SourceURL
	if req.SourceURL != nil {
		sourceUrl = *req.SourceURL
	}
	prepTime := existing.PrepTime
	if req.PrepTime != nil {
		prepTime = *req.PrepTime
	}
	cookTime := existing.CookTime
	if req.CookTime != nil {
		cookTime = *req.CookTime
	}
	servings := existing.Servings
	if req.Servings != nil {
		servings = *req.Servings
	}
	imageURL := existing.ImageURL
	if req.ImageURL != nil {
		imageURL = *req.ImageURL
	}

	var ingredients []services.IngredientInput
	if req.Ingredients != nil {
		ingredients = make([]services.IngredientInput, len(req.Ingredients))
		for i, inp := range req.Ingredients {
			ingredients[i] = services.IngredientInput{
				Name:     inp.Name,
				Quantity: inp.Quantity,
				Unit:     inp.Unit,
				Optional: inp.Optional,
			}
		}
	} else {
		ingredients = make([]services.IngredientInput, len(existing.Ingredients))
		for i, ing := range existing.Ingredients {
			ingredients[i] = services.IngredientInput{
				Name:     ing.Name,
				Quantity: ing.Quantity,
				Unit:     ing.Unit,
				Optional: ing.Optional,
			}
		}
	}

	var steps []services.StepInput
	if req.Steps != nil {
		steps = make([]services.StepInput, len(req.Steps))
		for i, inp := range req.Steps {
			steps[i] = services.StepInput{
				OrderIndex:  inp.OrderIndex,
				Title:       inp.Title,
				Content:     inp.Content,
				DurationMin: inp.DurationMin,
			}
		}
	} else {
		steps = make([]services.StepInput, len(existing.Steps))
		for i, s := range existing.Steps {
			steps[i] = services.StepInput{
				OrderIndex:  s.OrderIndex,
				Title:       s.Title,
				Content:     s.Content,
				DurationMin: s.DurationMin,
			}
		}
	}

	var tagNames []string
	if req.Tags != nil {
		tagNames = req.Tags
	} else {
		tagNames = make([]string, len(existing.Tags))
		for i, t := range existing.Tags {
			tagNames[i] = t.Name
		}
	}

	recipe, err := h.service.Update(
		c.Request.Context(), instanceID, recipeID, userID,
		title, description, sourceUrl,
		prepTime, cookTime, servings,
		imageURL, ingredients, steps, tagNames,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": recipe})
}

func (h *Handler) Delete(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	recipeIDStr := c.Param("recipe_id")
	recipeID, err := uuid.Parse(recipeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipe id"})
		return
	}

	if err := h.service.Delete(c.Request.Context(), instanceID, recipeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": nil})
}

func (h *Handler) Generate(c *gin.Context) {
	instanceID, ok := middleware.GetInstanceID(c)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
		return
	}

	userID, ok := middleware.GetInternalUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not identified"})
		return
	}

	var req struct {
		Prompt string `json:"prompt" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = instanceID // validated by RequireInstanceMembership middleware

	generated, err := h.service.GenerateRecipe(c.Request.Context(), userID, req.Prompt)
	if err != nil {
		if errors.Is(err, services.ErrRateLimiterUnavailable) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service unavailable"})
			return
		}
		if errors.Is(err, services.ErrDailyLimitExceeded) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "daily AI request limit reached"})
			return
		}
		if errors.Is(err, services.ErrOpenAIUpstream) {
			c.JSON(http.StatusBadGateway, gin.H{"error": "AI upstream service error"})
			return
		}
		if errors.Is(err, services.ErrGeneratedRecipeInvalid) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": generated})
}
