package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

func TestRequireAuth_DevSkipAcceptsTokenQuery(t *testing.T) {
	r := setupTestRouter()
	r.Use(RequireAuth(&AuthConfig{DevSkipAuth: true, AllowQueryToken: true}))
	r.GET("/test", func(c *gin.Context) {
		uc, ok := GetUserContext(c)
		assert.True(t, ok)
		assert.Equal(t, "dev-user", uc.ClerkID)
		c.Status(200)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test?token=dev", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}

func TestRequireAuth_QueryTokenRejectedWhenDisabled(t *testing.T) {
	r := setupTestRouter()
	r.Use(RequireAuth(&AuthConfig{DevSkipAuth: true, AllowQueryToken: false}))
	r.GET("/test", func(c *gin.Context) {
		c.Status(200)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test?token=dev", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "missing authorization")
}

func TestValidateTokenClaims_RejectsMissingExpiration(t *testing.T) {
	claims := jwt.MapClaims{
		"sub": "user_123",
	}

	err := validateTokenClaims(claims, &AuthConfig{}, time.Now())

	require.Error(t, err)
	assert.Contains(t, err.Error(), "missing expiration")
}

func TestValidateTokenClaims_RejectsWrongIssuer(t *testing.T) {
	claims := jwt.MapClaims{
		"sub": "user_123",
		"exp": float64(time.Now().Add(time.Hour).Unix()),
		"iss": "https://wrong.example.com",
		"aud": "tabletop-api",
	}

	err := validateTokenClaims(claims, &AuthConfig{
		Issuer:   "https://clerk.example.com",
		Audience: "tabletop-api",
	}, time.Now())

	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid token issuer")
}

func TestValidateTokenClaims_RejectsWrongAudience(t *testing.T) {
	claims := jwt.MapClaims{
		"sub": "user_123",
		"exp": float64(time.Now().Add(time.Hour).Unix()),
		"iss": "https://clerk.example.com",
		"aud": "other-api",
	}

	err := validateTokenClaims(claims, &AuthConfig{
		Issuer:   "https://clerk.example.com",
		Audience: "tabletop-api",
	}, time.Now())

	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid token audience")
}

func TestValidateTokenClaims_AcceptsIssuerAndAudience(t *testing.T) {
	claims := jwt.MapClaims{
		"sub": "user_123",
		"exp": float64(time.Now().Add(time.Hour).Unix()),
		"iss": "https://clerk.example.com",
		"aud": []string{"tabletop-api", "other-api"},
	}

	err := validateTokenClaims(claims, &AuthConfig{
		Issuer:   "https://clerk.example.com",
		Audience: "tabletop-api",
	}, time.Now())

	assert.NoError(t, err)
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
