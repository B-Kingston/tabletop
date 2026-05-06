package wines

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

func setupWineHandlerTest(t *testing.T) (*gin.Engine, *Handler, uuid.UUID, uuid.UUID) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{}, &models.Wine{},
	))

	user := models.User{ClerkID: "wine_handler_user", Email: "test@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Test", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	wineRepo := repositories.NewWineRepository(db)
	wineSvc := services.NewWineService(wineRepo)
	handler := NewHandler(wineSvc, db)

	r := gin.New()
	return r, handler, instance.ID, user.ID
}

func withContext(c *gin.Context, instanceID, userID uuid.UUID) {
	c.Set("instance_id", instanceID)
	c.Set("internal_user_id", userID)
}

func TestHandler_Create(t *testing.T) {
	r, handler, instanceID, userID := setupWineHandlerTest(t)

	r.POST("/instances/:instance_id/wines", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})

	body := CreateRequest{
		Name: "Barolo",
		Type: "red",
	}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/wines", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Barolo", data["name"])
}

func TestHandler_Create_InvalidType(t *testing.T) {
	r, handler, instanceID, userID := setupWineHandlerTest(t)

	r.POST("/instances/:instance_id/wines", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})

	body := CreateRequest{Name: "Test", Type: "invalid"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/wines", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_List(t *testing.T) {
	r, handler, instanceID, userID := setupWineHandlerTest(t)

	r.POST("/instances/:instance_id/wines", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.GET("/instances/:instance_id/wines", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.List(c)
	})

	body := CreateRequest{Name: "Barolo", Type: "red"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/wines", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/instances/"+instanceID.String()+"/wines", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Get(t *testing.T) {
	r, handler, instanceID, userID := setupWineHandlerTest(t)

	r.POST("/instances/:instance_id/wines", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.GET("/instances/:instance_id/wines/:wine_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Get(c)
	})

	body := CreateRequest{Name: "Barolo", Type: "red"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/wines", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	wineID := createResp["data"].(map[string]interface{})["id"].(string)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/instances/"+instanceID.String()+"/wines/"+wineID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Delete(t *testing.T) {
	r, handler, instanceID, userID := setupWineHandlerTest(t)

	r.POST("/instances/:instance_id/wines", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Create(c)
	})
	r.DELETE("/instances/:instance_id/wines/:wine_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.Delete(c)
	})

	body := CreateRequest{Name: "ToDelete", Type: "red"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/instances/"+instanceID.String()+"/wines", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	wineID := createResp["data"].(map[string]interface{})["id"].(string)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/instances/"+instanceID.String()+"/wines/"+wineID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
