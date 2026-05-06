package instances

import (
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

func setupInstanceHandlerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.User{}, &models.Instance{}, &models.InstanceMembership{}))

	return db
}

func TestRegisterRoutes_GetUsesParentAuthContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupInstanceHandlerTestDB(t)

	user := models.User{ClerkID: "user_123", Email: "test@example.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Family", OwnerID: user.ID, JoinPassword: "hashed"}
	require.NoError(t, db.Create(&instance).Error)
	require.NoError(t, db.Create(&models.InstanceMembership{
		UserID:     user.ID,
		InstanceID: instance.ID,
		Role:       "owner",
	}).Error)

	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	handler := NewHandler(services.NewInstanceService(instanceRepo, userRepo), db)

	router := gin.New()
	group := router.Group("/v1")
	group.Use(func(c *gin.Context) {
		c.Set(middleware.UserContextKey, middleware.UserContext{ClerkID: "user_123", Email: "test@example.com"})
		c.Next()
	})
	handler.RegisterRoutes(group)

	req, err := http.NewRequest(http.MethodGet, "/v1/instances/"+instance.ID.String(), nil)
	require.NoError(t, err)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotContains(t, w.Body.String(), "auth not configured")
	assert.NotContains(t, w.Body.String(), "missing authorization")
}

func TestRegisterRoutes_GetStillRequiresMembership(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupInstanceHandlerTestDB(t)

	user := models.User{ClerkID: "user_123", Email: "test@example.com"}
	otherUser := models.User{ClerkID: "other_123", Email: "other@example.com"}
	require.NoError(t, db.Create(&user).Error)
	require.NoError(t, db.Create(&otherUser).Error)

	instance := models.Instance{Name: "Family", OwnerID: otherUser.ID, JoinPassword: "hashed"}
	require.NoError(t, db.Create(&instance).Error)

	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	handler := NewHandler(services.NewInstanceService(instanceRepo, userRepo), db)

	router := gin.New()
	group := router.Group("/v1")
	group.Use(func(c *gin.Context) {
		c.Set(middleware.UserContextKey, middleware.UserContext{ClerkID: "user_123", Email: "test@example.com"})
		c.Next()
	})
	handler.RegisterRoutes(group)

	req, err := http.NewRequest(http.MethodGet, "/v1/instances/"+instance.ID.String(), nil)
	require.NoError(t, err)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "not a member of this instance")
}

func TestRegisterRoutes_GetRejectsInvalidInstanceID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupInstanceHandlerTestDB(t)

	user := models.User{ClerkID: "user_123", Email: "test@example.com"}
	require.NoError(t, db.Create(&user).Error)

	instanceRepo := repositories.NewInstanceRepository(db)
	userRepo := repositories.NewUserRepository(db)
	handler := NewHandler(services.NewInstanceService(instanceRepo, userRepo), db)

	router := gin.New()
	group := router.Group("/v1")
	group.Use(func(c *gin.Context) {
		c.Set(middleware.UserContextKey, middleware.UserContext{ClerkID: "user_123", Email: "test@example.com"})
		c.Next()
	})
	handler.RegisterRoutes(group)

	req, err := http.NewRequest(http.MethodGet, "/v1/instances/"+uuid.NewString()+"-bad", nil)
	require.NoError(t, err)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "invalid instance_id")
}
