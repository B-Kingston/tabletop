package messages

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

type fakeBroadcaster struct {
	instanceID uuid.UUID
	message    []byte
}

func (f *fakeBroadcaster) Broadcast(instanceID uuid.UUID, message []byte) {
	f.instanceID = instanceID
	f.message = message
}

func setupMessagesHandlerTest(t *testing.T) (*gin.Engine, *Handler, *fakeBroadcaster, uuid.UUID, uuid.UUID) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&models.User{}, &models.Instance{}, &models.InstanceMembership{},
		&models.MemberMessage{},
	))

	user := models.User{ClerkID: "messages_handler_user", Email: "messages@test.com", Name: "Handler User"}
	require.NoError(t, db.Create(&user).Error)

	instance := models.Instance{Name: "Messages Handler", OwnerID: user.ID, JoinPassword: "hash"}
	require.NoError(t, db.Create(&instance).Error)

	repo := repositories.NewMemberMessageRepository(db)
	svc := services.NewMemberMessageService(repo)
	broadcaster := &fakeBroadcaster{}
	handler := NewHandler(svc, broadcaster)

	return gin.New(), handler, broadcaster, instance.ID, user.ID
}

func withMessagesContext(c *gin.Context, instanceID, userID uuid.UUID) {
	c.Set("instance_id", instanceID)
	c.Set("internal_user_id", userID)
}

func TestHandler_SendMessagePersistsAndBroadcasts(t *testing.T) {
	r, handler, broadcaster, instanceID, userID := setupMessagesHandlerTest(t)
	r.POST("/messages", func(c *gin.Context) {
		withMessagesContext(c, instanceID, userID)
		handler.SendMessage(c)
	})

	body, err := json.Marshal(sendMessageRequest{Content: "What should I bring?"})
	require.NoError(t, err)

	w := httptest.NewRecorder()
	req, err := http.NewRequest("POST", "/messages", bytes.NewReader(body))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Equal(t, instanceID, broadcaster.instanceID)

	var event struct {
		Type string               `json:"type"`
		Data models.MemberMessage `json:"data"`
	}
	require.NoError(t, json.Unmarshal(broadcaster.message, &event))
	assert.Equal(t, "member_message.created", event.Type)
	assert.Equal(t, "What should I bring?", event.Data.Content)
	assert.Equal(t, "Handler User", event.Data.User.Name)
}

func TestHandler_ListMessages(t *testing.T) {
	r, handler, _, instanceID, userID := setupMessagesHandlerTest(t)
	r.POST("/messages", func(c *gin.Context) {
		withMessagesContext(c, instanceID, userID)
		handler.SendMessage(c)
	})
	r.GET("/messages", func(c *gin.Context) {
		withMessagesContext(c, instanceID, userID)
		handler.ListMessages(c)
	})

	body, err := json.Marshal(sendMessageRequest{Content: "See you soon"})
	require.NoError(t, err)

	w := httptest.NewRecorder()
	req, err := http.NewRequest("POST", "/messages", bytes.NewReader(body))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	w = httptest.NewRecorder()
	req, err = http.NewRequest("GET", "/messages", nil)
	require.NoError(t, err)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Data []models.MemberMessage `json:"data"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	require.Len(t, resp.Data, 1)
	assert.Equal(t, "See you soon", resp.Data[0].Content)
}

func TestHandler_SendMessageRejectsEmptyContent(t *testing.T) {
	r, handler, _, instanceID, userID := setupMessagesHandlerTest(t)
	r.POST("/messages", func(c *gin.Context) {
		withMessagesContext(c, instanceID, userID)
		handler.SendMessage(c)
	})

	w := httptest.NewRecorder()
	req, err := http.NewRequest("POST", "/messages", bytes.NewReader([]byte(`{"content":"   "}`)))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
