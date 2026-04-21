package middleware

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
	"tabletop/backend/internal/models"
)

func setupInstanceTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	
	err = db.AutoMigrate(&models.User{}, &models.Instance{}, &models.InstanceMembership{})
	require.NoError(t, err)
	
	return db
}

func TestRequireInstanceMembership_Success(t *testing.T) {
	db := setupInstanceTestDB(t)
	
	// Seed data
	user := models.User{ClerkID: "user_123", Email: "test@test.com"}
	require.NoError(t, db.Create(&user).Error)
	
	instance := models.Instance{Name: "Test", OwnerID: user.ID, JoinPassword: "hashed"}
	require.NoError(t, db.Create(&instance).Error)
	
	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "member"}
	require.NoError(t, db.Create(&membership).Error)
	
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set(UserContextKey, UserContext{ClerkID: "user_123"})
		c.Next()
	})
	r.Use(RequireInstanceMembership(db))
	r.GET("/instances/:instance_id/test", func(c *gin.Context) {
		c.Status(200)
	})
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/"+instance.ID.String()+"/test", nil)
	r.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
}

func TestRequireInstanceMembership_NotMember(t *testing.T) {
	db := setupInstanceTestDB(t)
	
	user := models.User{ClerkID: "user_123", Email: "test@test.com"}
	require.NoError(t, db.Create(&user).Error)
	
	otherUser := models.User{ClerkID: "user_456", Email: "other@test.com"}
	require.NoError(t, db.Create(&otherUser).Error)
	
	instance := models.Instance{Name: "Test", OwnerID: otherUser.ID, JoinPassword: "hashed"}
	require.NoError(t, db.Create(&instance).Error)
	
	// user_123 is NOT a member
	
	r := setupTestRouter()
	r.Use(func(c *gin.Context) {
		c.Set(UserContextKey, UserContext{ClerkID: "user_123"})
		c.Next()
	})
	r.Use(RequireInstanceMembership(db))
	r.GET("/instances/:instance_id/test", func(c *gin.Context) {
		c.Status(200)
	})
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/"+instance.ID.String()+"/test", nil)
	r.ServeHTTP(w, req)
	
	assert.Equal(t, 403, w.Code)
	assert.Contains(t, w.Body.String(), "not a member")
}

func TestRequireInstanceMembership_MissingInstanceID(t *testing.T) {
	db := setupInstanceTestDB(t)
	
	r := setupTestRouter()
	r.Use(RequireInstanceMembership(db))
	r.GET("/test", func(c *gin.Context) {
		c.Status(200)
	})
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)
	
	assert.Equal(t, 400, w.Code)
}

func TestRequireInstanceMembership_InvalidUUID(t *testing.T) {
	db := setupInstanceTestDB(t)
	
	r := setupTestRouter()
	r.Use(RequireInstanceMembership(db))
	r.GET("/instances/:instance_id/test", func(c *gin.Context) {
		c.Status(200)
	})
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/not-a-uuid/test", nil)
	r.ServeHTTP(w, req)
	
	assert.Equal(t, 400, w.Code)
}

func TestGetInstanceID(t *testing.T) {
	r := setupTestRouter()
	r.GET("/test", func(c *gin.Context) {
		testID := uuid.MustParse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
		c.Set("instance_id", testID)
		
		id, ok := GetInstanceID(c)
		assert.True(t, ok)
		assert.Equal(t, testID, id)
		c.Status(200)
	})
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
}

func TestGetInternalUserID(t *testing.T) {
	r := setupTestRouter()
	r.GET("/test", func(c *gin.Context) {
		testID := uuid.MustParse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
		c.Set("internal_user_id", testID)
		
		id, ok := GetInternalUserID(c)
		assert.True(t, ok)
		assert.Equal(t, testID, id)
		c.Status(200)
	})
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)
	
	assert.Equal(t, 200, w.Code)
}
