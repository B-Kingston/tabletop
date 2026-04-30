package webhooks

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

func setupWebhookHandlerTest(t *testing.T) (*gin.Engine, *Handler, string) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.User{}))

	userRepo := repositories.NewUserRepository(db)
	// Svix secrets are base64-encoded after the whsec_ prefix
	rawSecret := "test-webhook-secret"
	webhookSecret := "whsec_" + base64.StdEncoding.EncodeToString([]byte(rawSecret))
	handler := NewHandler(userRepo, webhookSecret)

	r := gin.New()
	return r, handler, rawSecret
}

func signPayload(secret string, body []byte, id string, timestamp int64) string {
	signedContent := fmt.Sprintf("%s.%d.%s", id, timestamp, string(body))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signedContent))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func makeSvixHeaders(secret string, body []byte) (string, string, string) {
	id := "msg_123"
	ts := time.Now().Unix()
	sig := signPayload(secret, body, id, ts)
	return id, strconv.FormatInt(ts, 10), "v1," + sig
}

func TestHandler_UserCreated(t *testing.T) {
	r, handler, rawSecret := setupWebhookHandlerTest(t)

	r.POST("/webhooks/clerk", handler.HandleClerkWebhook)

	event := ClerkWebhookEvent{}
	event.Type = "user.created"
	event.Data.ID = "clerk_123"
	event.Data.EmailAddresses = []struct {
		EmailAddress string `json:"email_address"`
	}{{EmailAddress: "test@example.com"}}
	event.Data.FirstName = "John"
	event.Data.LastName = "Doe"

	body, _ := json.Marshal(event)
	svixID, svixTs, svixSig := makeSvixHeaders(rawSecret, body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", svixID)
	req.Header.Set("svix-timestamp", svixTs)
	req.Header.Set("svix-signature", svixSig)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "clerk_123", data["clerkId"])
	assert.Equal(t, "John Doe", data["name"])
}

func TestHandler_UserUpdated(t *testing.T) {
	r, handler, rawSecret := setupWebhookHandlerTest(t)

	r.POST("/webhooks/clerk", handler.HandleClerkWebhook)

	createEvent := ClerkWebhookEvent{}
	createEvent.Type = "user.created"
	createEvent.Data.ID = "clerk_456"
	createEvent.Data.EmailAddresses = []struct {
		EmailAddress string `json:"email_address"`
	}{{EmailAddress: "original@example.com"}}
	createEvent.Data.FirstName = "Jane"

	body, _ := json.Marshal(createEvent)
	svixID, svixTs, svixSig := makeSvixHeaders(rawSecret, body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", svixID)
	req.Header.Set("svix-timestamp", svixTs)
	req.Header.Set("svix-signature", svixSig)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	updateEvent := ClerkWebhookEvent{}
	updateEvent.Type = "user.updated"
	updateEvent.Data.ID = "clerk_456"
	updateEvent.Data.EmailAddresses = []struct {
		EmailAddress string `json:"email_address"`
	}{{EmailAddress: "updated@example.com"}}
	updateEvent.Data.FirstName = "Jane"
	updateEvent.Data.LastName = "Smith"

	body, _ = json.Marshal(updateEvent)
	svixID, svixTs, svixSig = makeSvixHeaders(rawSecret, body)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", svixID)
	req.Header.Set("svix-timestamp", svixTs)
	req.Header.Set("svix-signature", svixSig)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "updated@example.com", data["email"])
	assert.Equal(t, "Jane Smith", data["name"])
}

func TestHandler_UserDeleted(t *testing.T) {
	r, handler, rawSecret := setupWebhookHandlerTest(t)

	r.POST("/webhooks/clerk", handler.HandleClerkWebhook)

	createEvent := ClerkWebhookEvent{}
	createEvent.Type = "user.created"
	createEvent.Data.ID = "clerk_789"
	createEvent.Data.EmailAddresses = []struct {
		EmailAddress string `json:"email_address"`
	}{{EmailAddress: "delete@test.com"}}
	createEvent.Data.FirstName = "ToDelete"

	body, _ := json.Marshal(createEvent)
	svixID, svixTs, svixSig := makeSvixHeaders(rawSecret, body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", svixID)
	req.Header.Set("svix-timestamp", svixTs)
	req.Header.Set("svix-signature", svixSig)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	deleteEvent := ClerkWebhookEvent{}
	deleteEvent.Type = "user.deleted"
	deleteEvent.Data.ID = "clerk_789"

	body, _ = json.Marshal(deleteEvent)
	svixID, svixTs, svixSig = makeSvixHeaders(rawSecret, body)

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", svixID)
	req.Header.Set("svix-timestamp", svixTs)
	req.Header.Set("svix-signature", svixSig)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_InvalidSignature(t *testing.T) {
	r, handler, _ := setupWebhookHandlerTest(t)

	r.POST("/webhooks/clerk", handler.HandleClerkWebhook)

	event := ClerkWebhookEvent{}
	event.Type = "user.created"
	event.Data.ID = "clerk_evil"

	body, _ := json.Marshal(event)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", "msg_bad")
	req.Header.Set("svix-timestamp", strconv.FormatInt(time.Now().Unix(), 10))
	req.Header.Set("svix-signature", "v1,invalid-signature")
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestHandler_UnhandledEventType(t *testing.T) {
	r, handler, rawSecret := setupWebhookHandlerTest(t)

	r.POST("/webhooks/clerk", handler.HandleClerkWebhook)

	event := ClerkWebhookEvent{}
	event.Type = "session.created"

	body, _ := json.Marshal(event)
	svixID, svixTs, svixSig := makeSvixHeaders(rawSecret, body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", svixID)
	req.Header.Set("svix-timestamp", svixTs)
	req.Header.Set("svix-signature", svixSig)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "unhandled event type")
}

func TestHandler_InvalidPayload(t *testing.T) {
	r, handler, rawSecret := setupWebhookHandlerTest(t)

	r.POST("/webhooks/clerk", handler.HandleClerkWebhook)

	body := []byte("not json")
	svixID, svixTs, svixSig := makeSvixHeaders(rawSecret, body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/webhooks/clerk", bytes.NewReader(body))
	req.Header.Set("svix-id", svixID)
	req.Header.Set("svix-timestamp", svixTs)
	req.Header.Set("svix-signature", svixSig)
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
