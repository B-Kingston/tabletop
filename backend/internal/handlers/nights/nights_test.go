package nights

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

func setupNightHandlerTest(t *testing.T) (*gin.Engine, *Handler, uuid.UUID, uuid.UUID, *gorm.DB) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{},
		&models.Wine{}, &models.Recipe{}, &models.MediaItem{}, &models.Night{},
		&models.Ingredient{}, &models.RecipeStep{}, &models.RecipeTag{},
		&models.ChatSession{}, &models.ChatMessage{},
	))

	user := models.User{ClerkID: "night_handler_user", Email: "test@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Test", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	nightRepo := repositories.NewNightRepository(db)
	wineRepo := repositories.NewWineRepository(db)
	recipeRepo := repositories.NewRecipeRepository(db)
	mediaRepo := repositories.NewMediaRepository(db)
	nightSvc := services.NewNightService(nightRepo, wineRepo, recipeRepo, mediaRepo)
	handler := NewHandler(nightSvc, db)

	r := gin.New()
	return r, handler, instance.ID, user.ID, db
}

func withContext(c *gin.Context, instanceID, userID uuid.UUID) {
	c.Set("instance_id", instanceID)
	c.Set("internal_user_id", userID)
}

func TestHandler_Create(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})

	name := "Date Night"
	body := CreateRequest{Name: &name}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Date Night", data["name"])
}

func TestHandler_Create_WithFKs(t *testing.T) {
	r, handler, instanceID, userID, db := setupNightHandlerTest(t)

	// Seed related items
	wine := models.Wine{InstanceID: instanceID, Name: "Barolo", Type: models.WineTypeRed, CreatedByID: userID, UpdatedByID: userID}
	require.NoError(t, db.Create(&wine).Error)

	recipe := models.Recipe{InstanceID: instanceID, Title: "Bolognese", PrepTime: 10, CookTime: 20, Servings: 2, CreatedByID: userID, UpdatedByID: userID}
	require.NoError(t, db.Create(&recipe).Error)

	media := models.MediaItem{InstanceID: instanceID, OMDBID: "tt0000123", Type: "movie", Title: "The Godfather", CreatedByID: userID, UpdatedByID: userID}
	require.NoError(t, db.Create(&media).Error)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})

	wineIDStr := wine.ID.String()
	recipeIDStr := recipe.ID.String()
	mediaIDStr := media.ID.String()
	body := CreateRequest{WineID: &wineIDStr, RecipeID: &recipeIDStr, MediaID: &mediaIDStr}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Barolo & Bolognese & The Godfather Night", data["name"])
}

func TestHandler_Create_InvalidUUID(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})

	badUUID := "not-a-uuid"
	body := CreateRequest{WineID: &badUUID}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_Create_CrossInstanceFKInjection(t *testing.T) {
	r, handler, instanceID, userID, db := setupNightHandlerTest(t)

	// Create another instance and a wine in it
	otherUser := models.User{ClerkID: "other", Email: "other@test.com"}
	require.NoError(t, db.Create(&otherUser).Error)
	otherInstance := models.Instance{Name: "Other", OwnerID: otherUser.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&otherInstance).Error)
	otherWine := models.Wine{InstanceID: otherInstance.ID, Name: "Other Wine", Type: models.WineTypeRed, CreatedByID: otherUser.ID, UpdatedByID: otherUser.ID}
	require.NoError(t, db.Create(&otherWine).Error)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})

	wineIDStr := otherWine.ID.String()
	body := CreateRequest{WineID: &wineIDStr}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestHandler_List(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.GET("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.List(c)
	})

	name := "Night One"
	body := CreateRequest{Name: &name}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/instances/"+instanceID.String()+"/nights", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].([]interface{})
	assert.Len(t, data, 1)
}

func TestHandler_Get(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.GET("/instances/:instance_id/nights/:night_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Get(c)
	})

	name := "GetMe"
	body := CreateRequest{Name: &name}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	nightID := createResp["data"].(map[string]interface{})["id"].(string)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/instances/"+instanceID.String()+"/nights/"+nightID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Get_NotFound(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	r.GET("/instances/:instance_id/nights/:night_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Get(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/instances/"+instanceID.String()+"/nights/"+uuid.New().String(), nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestHandler_Get_CrossInstance(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	// Create a night in the test instance
	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})

	name := "Private Night"
	body := CreateRequest{Name: &name}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	nightID := createResp["data"].(map[string]interface{})["id"].(string)

	// Query from a different instance
	otherInstanceID := uuid.New()
	r.GET("/instances/:instance_id/nights/:night_id", func(c *gin.Context) {
		withContext(c, otherInstanceID, userID)
		handler.Get(c)
	})

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/instances/"+otherInstanceID.String()+"/nights/"+nightID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestHandler_Update(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.PATCH("/instances/:instance_id/nights/:night_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Update(c)
	})

	name := "Old Name"
	body := CreateRequest{Name: &name}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	nightID := createResp["data"].(map[string]interface{})["id"].(string)

	newName := "New Name"
	updateBody := UpdateRequest{Name: &newName}
	updateJSON, _ := json.Marshal(updateBody)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/instances/"+instanceID.String()+"/nights/"+nightID, bytes.NewReader(updateJSON))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "New Name", data["name"])
}

func TestHandler_Update_ClearWine(t *testing.T) {
	r, handler, instanceID, userID, db := setupNightHandlerTest(t)

	wine := models.Wine{InstanceID: instanceID, Name: "Barolo", Type: models.WineTypeRed, CreatedByID: userID, UpdatedByID: userID}
	require.NoError(t, db.Create(&wine).Error)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.PATCH("/instances/:instance_id/nights/:night_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Update(c)
	})

	wineIDStr := wine.ID.String()
	name := "With Wine"
	body := CreateRequest{Name: &name, WineID: &wineIDStr}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	nightID := createResp["data"].(map[string]interface{})["id"].(string)

	clear := true
	updateBody := UpdateRequest{ClearWine: &clear}
	updateJSON, _ := json.Marshal(updateBody)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("PATCH", "/instances/"+instanceID.String()+"/nights/"+nightID, bytes.NewReader(updateJSON))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Nil(t, data["wineId"])
}

func TestHandler_Delete(t *testing.T) {
	r, handler, instanceID, userID, _ := setupNightHandlerTest(t)

	r.POST("/instances/:instance_id/nights", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.DELETE("/instances/:instance_id/nights/:night_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Delete(c)
	})

	name := "ToDelete"
	body := CreateRequest{Name: &name}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/nights", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	nightID := createResp["data"].(map[string]interface{})["id"].(string)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/instances/"+instanceID.String()+"/nights/"+nightID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
