package chat

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

func setupChatHandlerTest(t *testing.T) (*gin.Engine, *Handler, uuid.UUID, uuid.UUID) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{},
		&models.ChatSession{}, &models.ChatMessage{},
	))

	user := models.User{ClerkID: "chat_handler_user", Email: "test@test.com"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Test", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	membership := models.InstanceMembership{UserID: user.ID, InstanceID: instance.ID, Role: "owner"}
	require.NoError(t, db.Create(&membership).Error)

	sessionRepo := repositories.NewChatSessionRepository(db)
	msgRepo := repositories.NewChatMessageRepository(db)
	chatSvc := services.NewChatService(sessionRepo, msgRepo, nil)
	handler := NewHandler(chatSvc)

	r := gin.New()
	return r, handler, instance.ID, user.ID
}

func withContext(c *gin.Context, instanceID, userID uuid.UUID) {
	c.Set("instance_id", instanceID)
	c.Set("internal_user_id", userID)
}

func TestHandler_CreateSession(t *testing.T) {
	r, handler, instanceID, userID := setupChatHandlerTest(t)

	r.POST("/chat/sessions", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.CreateSession(c)
	})

	body := createSessionRequest{Title: "Test Chat"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/chat/sessions", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Test Chat", data["title"])
}

func TestHandler_CreateSession_DefaultTitle(t *testing.T) {
	r, handler, instanceID, userID := setupChatHandlerTest(t)

	r.POST("/chat/sessions", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.CreateSession(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/chat/sessions", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestHandler_ListSessions(t *testing.T) {
	r, handler, instanceID, userID := setupChatHandlerTest(t)

	r.POST("/chat/sessions", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.CreateSession(c)
	})
	r.GET("/chat/sessions", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.ListSessions(c)
	})

	body := createSessionRequest{Title: "Session A"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/chat/sessions", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/chat/sessions", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].([]interface{})
	assert.Len(t, data, 1)
}

func TestHandler_GetSession(t *testing.T) {
	r, handler, instanceID, userID := setupChatHandlerTest(t)

	r.POST("/chat/sessions", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.CreateSession(c)
	})
	r.GET("/chat/sessions/:session_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.GetSession(c)
	})

	body := createSessionRequest{Title: "My Chat"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/chat/sessions", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	sessionID := createResp["data"].(map[string]interface{})["id"].(string)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/chat/sessions/"+sessionID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_GetSession_NotFound(t *testing.T) {
	r, handler, instanceID, userID := setupChatHandlerTest(t)

	r.GET("/chat/sessions/:session_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.GetSession(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/chat/sessions/"+uuid.New().String(), nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestHandler_DeleteSession(t *testing.T) {
	r, handler, instanceID, userID := setupChatHandlerTest(t)

	r.POST("/chat/sessions", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.CreateSession(c)
	})
	r.DELETE("/chat/sessions/:session_id", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.DeleteSession(c)
	})

	body := createSessionRequest{Title: "ToDelete"}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/chat/sessions", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	var createResp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &createResp)
	sessionID := createResp["data"].(map[string]interface{})["id"].(string)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("DELETE", "/chat/sessions/"+sessionID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_GenerateRecipe_MissingPrompt(t *testing.T) {
	r, handler, instanceID, userID := setupChatHandlerTest(t)

	r.POST("/chat/generate-recipe", func(c *gin.Context) {
		withContext(c, instanceID, userID)
		handler.GenerateRecipe(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/chat/generate-recipe", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
