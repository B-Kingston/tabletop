package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	return r
}

func generateTestToken(clerkID string, email string, expired bool) string {
	claims := jwt.MapClaims{
		"sub":   clerkID,
		"email": email,
	}
	if expired {
		claims["exp"] = time.Now().Add(-time.Hour).Unix()
	} else {
		claims["exp"] = time.Now().Add(time.Hour).Unix()
	}
	// Note: This creates an unsigned token. In real tests, we'd use a test key.
	// For unit testing the middleware scaffold, we test the header parsing logic.
	token := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
	ss, _ := token.SignedString(jwt.UnsafeAllowNoneSignatureType)
	return ss
}

func TestRequireAuth_MissingHeader(t *testing.T) {
	r := setupTestRouter()
	r.Use(RequireAuth(&AuthConfig{}))
	r.GET("/test", func(c *gin.Context) {
		c.Status(200)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 401, w.Code)
	assert.Contains(t, w.Body.String(), "missing authorization")
}

func TestRequireAuth_InvalidFormat(t *testing.T) {
	r := setupTestRouter()
	r.Use(RequireAuth(&AuthConfig{}))
	r.GET("/test", func(c *gin.Context) {
		c.Status(200)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Basic abc123")
	r.ServeHTTP(w, req)

	assert.Equal(t, 401, w.Code)
	assert.Contains(t, w.Body.String(), "invalid authorization")
}

func TestGetUserContext(t *testing.T) {
	r := setupTestRouter()
	r.GET("/test", func(c *gin.Context) {
		c.Set(UserContextKey, UserContext{ClerkID: "user_123", Email: "a@b.com"})
		
		uc, ok := GetUserContext(c)
		assert.True(t, ok)
		assert.Equal(t, "user_123", uc.ClerkID)
		assert.Equal(t, "a@b.com", uc.Email)
		c.Status(200)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestGetUserContext_Missing(t *testing.T) {
	r := setupTestRouter()
	r.GET("/test", func(c *gin.Context) {
		uc, ok := GetUserContext(c)
		assert.False(t, ok)
		assert.Empty(t, uc.ClerkID)
		c.Status(200)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}
