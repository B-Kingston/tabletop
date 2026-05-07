package integration

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
	"tabletop/backend/internal/services"
)

func setupIntegrationDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{},
		&models.MediaItem{}, &models.Wine{}, &models.Recipe{},
		&models.Ingredient{}, &models.RecipeStep{}, &models.RecipeTag{},
		&models.ChatSession{}, &models.ChatMessage{},
	))
	return db
}

func seedTwoInstances(t *testing.T, db *gorm.DB) (instanceA, instanceB uuid.UUID, userA, userB uuid.UUID) {
	userA = uuid.New()
	userB = uuid.New()

	require.NoError(t, db.Create(&models.User{UUIDModel: models.UUIDModel{ID: userA}, ClerkID: "user_a", Email: "a@test.com"}).Error)
	require.NoError(t, db.Create(&models.User{UUIDModel: models.UUIDModel{ID: userB}, ClerkID: "user_b", Email: "b@test.com"}).Error)

	instanceA = uuid.New()
	instanceB = uuid.New()

	require.NoError(t, db.Create(&models.Instance{UUIDModel: models.UUIDModel{ID: instanceA}, Name: "Instance A", OwnerID: userA, JoinPassword: "hash"}).Error)
	require.NoError(t, db.Create(&models.Instance{UUIDModel: models.UUIDModel{ID: instanceB}, Name: "Instance B", OwnerID: userB, JoinPassword: "hash"}).Error)

	require.NoError(t, db.Create(&models.InstanceMembership{UserID: userA, InstanceID: instanceA, Role: "owner"}).Error)
	require.NoError(t, db.Create(&models.InstanceMembership{UserID: userB, InstanceID: instanceB, Role: "owner"}).Error)

	return
}

func TestCrossInstance_MediaAccess(t *testing.T) {
	db := setupIntegrationDB(t)
	instanceA, instanceB, userA, _ := seedTwoInstances(t, db)

	mediaRepo := repositories.NewMediaRepository(db)
	mediaSvc := services.NewMediaService(mediaRepo)
	ctx := context.Background()

	item, err := mediaSvc.Create(ctx, instanceA, userA, "tt0137523", "movie", "Fight Club", "Overview", "1999")
	require.NoError(t, err)

	_, err = mediaSvc.GetByID(ctx, instanceB, item.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")

	items, err := mediaSvc.List(ctx, instanceB, "", "")
	require.NoError(t, err)
	assert.Empty(t, items)
}

func TestCrossInstance_WineAccess(t *testing.T) {
	db := setupIntegrationDB(t)
	instanceA, instanceB, userA, _ := seedTwoInstances(t, db)

	wineRepo := repositories.NewWineRepository(db)
	wineSvc := services.NewWineService(wineRepo)
	ctx := context.Background()

	wine, err := wineSvc.Create(ctx, instanceA, userA, "Barolo", "red", nil, nil, "", nil)
	require.NoError(t, err)

	_, err = wineSvc.GetByID(ctx, instanceB, wine.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")

	wines, err := wineSvc.List(ctx, instanceB, "")
	require.NoError(t, err)
	assert.Empty(t, wines)
}

func TestCrossInstance_RecipeAccess(t *testing.T) {
	db := setupIntegrationDB(t)
	instanceA, instanceB, userA, _ := seedTwoInstances(t, db)

	recipeRepo := repositories.NewRecipeRepository(db)
	recipeSvc := services.NewRecipeService(recipeRepo, nil)
	ctx := context.Background()

	recipe, err := recipeSvc.Create(ctx, instanceA, userA, "Pasta", "Desc", "", 10, 20, 4, "", nil, nil, nil)
	require.NoError(t, err)

	_, err = recipeSvc.GetByID(ctx, instanceB, recipe.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")

	recipes, err := recipeSvc.List(ctx, instanceB, "")
	require.NoError(t, err)
	assert.Empty(t, recipes)
}

func TestCrossInstance_MiddlewareBlocksAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupIntegrationDB(t)
	instanceA, _, _, _ := seedTwoInstances(t, db)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(middleware.UserContextKey, middleware.UserContext{ClerkID: "user_b"})
		c.Next()
	})
	r.Use(middleware.RequireInstanceMembership(db))
	r.GET("/instances/:instance_id/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"data": "should not reach"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/"+instanceA.String()+"/test", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "not a member")
}

func TestCrossInstance_DeleteFromWrongInstance(t *testing.T) {
	db := setupIntegrationDB(t)
	instanceA, instanceB, userA, _ := seedTwoInstances(t, db)

	mediaRepo := repositories.NewMediaRepository(db)
	ctx := context.Background()

	item := &models.MediaItem{
		InstanceID:  instanceA,
		OMDBID:      "tt0137523",
		Type:        "movie",
		Title:       "Protected",
		Status:      "planning",
		CreatedByID: userA,
		UpdatedByID: userA,
	}
	require.NoError(t, mediaRepo.Create(ctx, item))

	err := mediaRepo.Delete(ctx, instanceB, item.ID)
	require.NoError(t, err)

	found, err := mediaRepo.GetByID(ctx, instanceA, item.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}

func TestFullFlow_CreateInstanceJoinAddMedia(t *testing.T) {
	db := setupIntegrationDB(t)
	ctx := context.Background()

	userRepo := repositories.NewUserRepository(db)
	instanceRepo := repositories.NewInstanceRepository(db)
	instanceSvc := services.NewInstanceService(instanceRepo, userRepo)
	mediaRepo := repositories.NewMediaRepository(db)
	mediaSvc := services.NewMediaService(mediaRepo)

	owner := &models.User{ClerkID: "owner", Email: "owner@test.com", Name: "Owner"}
	require.NoError(t, userRepo.Create(ctx, owner))

	member := &models.User{ClerkID: "member", Email: "member@test.com", Name: "Member"}
	require.NoError(t, userRepo.Create(ctx, member))

	instance, err := instanceSvc.CreateInstance(ctx, owner.ID, "Test Group", "password123")
	require.NoError(t, err)

	err = instanceSvc.JoinInstance(ctx, instance.ID, member.ID, "password123")
	require.NoError(t, err)

	_, err = mediaSvc.Create(ctx, instance.ID, owner.ID, "tt0137523", "movie", "Fight Club", "Great movie", "1999")
	require.NoError(t, err)

	items, err := mediaSvc.List(ctx, instance.ID, "", "")
	require.NoError(t, err)
	assert.Len(t, items, 1)

	isMember, err := instanceRepo.IsMember(ctx, instance.ID, member.ID)
	require.NoError(t, err)
	assert.True(t, isMember)
}

func TestCrossInstance_ChatSessionAccess(t *testing.T) {
	db := setupIntegrationDB(t)
	instanceA, instanceB, userA, _ := seedTwoInstances(t, db)

	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	chatSvc := services.NewChatService(sessionRepo, msgRepo, nil)
	ctx := context.Background()

	session, err := chatSvc.CreateSession(ctx, instanceA, userA, "Private Chat")
	require.NoError(t, err)

	found, err := chatSvc.GetSession(ctx, instanceB, session.ID)
	require.NoError(t, err)
	assert.Nil(t, found)

	sessions, err := chatSvc.ListSessions(ctx, instanceB)
	require.NoError(t, err)
	assert.Empty(t, sessions)
}

func TestCrossInstance_RecipeDeleteFromWrongInstance(t *testing.T) {
	db := setupIntegrationDB(t)
	instanceA, instanceB, userA, _ := seedTwoInstances(t, db)

	recipeRepo := repositories.NewRecipeRepository(db)
	recipeSvc := services.NewRecipeService(recipeRepo, nil)
	ctx := context.Background()

	recipe, err := recipeSvc.Create(ctx, instanceA, userA, "Secret Recipe", "", "", 0, 0, 0, "", nil, nil, nil)
	require.NoError(t, err)

	err = recipeRepo.Delete(ctx, instanceB, recipe.ID)
	require.NoError(t, err)

	found, err := recipeRepo.GetByID(ctx, instanceA, recipe.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}

func TestCrossInstance_WineDeleteFromWrongInstance(t *testing.T) {
	db := setupIntegrationDB(t)
	instanceA, instanceB, userA, _ := seedTwoInstances(t, db)

	wineRepo := repositories.NewWineRepository(db)
	wineSvc := services.NewWineService(wineRepo)
	ctx := context.Background()

	wine, err := wineSvc.Create(ctx, instanceA, userA, "Secret Wine", "red", nil, nil, "", nil)
	require.NoError(t, err)

	err = wineRepo.Delete(ctx, instanceB, wine.ID)
	require.NoError(t, err)

	found, err := wineRepo.GetByID(ctx, instanceA, wine.ID)
	require.NoError(t, err)
	assert.NotNil(t, found)
}
