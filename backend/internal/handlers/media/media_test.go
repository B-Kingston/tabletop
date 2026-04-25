package media

import (
	"bytes"
	"encoding/json"
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
	"tabletop/backend/internal/repositories"
	"tabletop/backend/internal/services"
)

func setupMediaHandlerTest(t *testing.T) (*gin.Engine, *Handler, uuid.UUID, uuid.UUID) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{},
		&models.MediaItem{},
	))

	user := models.User{ClerkID: "media_handler_user", Email: "test@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Test", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	mediaRepo := repositories.NewMediaRepository(db)
	mediaSvc := services.NewMediaService(mediaRepo)
	handler := NewHandler(mediaSvc)

	r := gin.New()
	return r, handler, instance.ID, user.ID
}

func setInstanceAndUser(c *gin.Context, instanceID, userID uuid.UUID) {
	c.Set("instance_id", instanceID)
	c.Set("internal_user_id", userID)
}

func TestHandler_Create(t *testing.T) {
	r, handler, instanceID, userID := setupMediaHandlerTest(t)

	r.POST("/instances/:instance_id/media", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.Create(c)
	})

	body := createRequest{
		TMDBID:     550,
		Type:       "movie",
		Title:      "Fight Club",
		Overview:   "A great movie",
		PosterPath: "/poster.jpg",
	}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/media", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Fight Club", data["title"])
	assert.Equal(t, "planning", data["status"])
}

func TestHandler_Create_InvalidType(t *testing.T) {
	r, handler, instanceID, userID := setupMediaHandlerTest(t)

	r.POST("/instances/:instance_id/media", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.Create(c)
	})

	body := createRequest{TMDBID: 1, Type: "invalid", Title: "Test"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/media", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_List(t *testing.T) {
	r, handler, instanceID, userID := setupMediaHandlerTest(t)

	r.GET("/instances/:instance_id/media", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.List(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/"+instanceID.String()+"/media", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	data := resp["data"].([]interface{})
	assert.Empty(t, data)
}

func TestHandler_Get(t *testing.T) {
	r, handler, instanceID, userID := setupMediaHandlerTest(t)

	r.POST("/instances/:instance_id/media", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.Create(c)
	})

	body := createRequest{TMDBID: 550, Type: "movie", Title: "Fight Club"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/media", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	mediaID := createResp["data"].(map[string]interface{})["id"].(string)

	r.GET("/instances/:instance_id/media/:media_id", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.Get(c)
	})

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/instances/"+instanceID.String()+"/media/"+mediaID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Get_InvalidUUID(t *testing.T) {
	r, handler, instanceID, userID := setupMediaHandlerTest(t)

	r.GET("/instances/:instance_id/media/:media_id", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.Get(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/"+instanceID.String()+"/media/not-a-uuid", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_Delete(t *testing.T) {
	r, handler, instanceID, userID := setupMediaHandlerTest(t)

	r.POST("/instances/:instance_id/media", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.Create(c)
	})
	r.DELETE("/instances/:instance_id/media/:media_id", func(c *gin.Context) {
		setInstanceAndUser(c, instanceID, userID)
		handler.Delete(c)
	})

	body := createRequest{TMDBID: 550, Type: "movie", Title: "Fight Club"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/media", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	mediaID := createResp["data"].(map[string]interface{})["id"].(string)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/instances/"+instanceID.String()+"/media/"+mediaID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_MissingInstance(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	mediaRepo, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	handler := NewHandler(services.NewMediaService(repositories.NewMediaRepository(mediaRepo)))

	r.GET("/instances/:instance_id/media", handler.List)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/"+uuid.New().String()+"/media", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_MissingUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	mediaDB, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	handler := NewHandler(services.NewMediaService(repositories.NewMediaRepository(mediaDB)))

	r.POST("/instances/:instance_id/media", func(c *gin.Context) {
		c.Set("instance_id", uuid.New())
		handler.Create(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+uuid.New().String()+"/media", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
