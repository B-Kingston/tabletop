package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthConfig holds auth middleware dependencies
type AuthConfig struct {
	ClerkJWKSURL string
}

// UserContextKey is the key for user data in gin context
const UserContextKey = "user"

// UserContext holds authenticated user info
type UserContext struct {
	ClerkID string
	Email   string
}

// RequireAuth validates Clerk JWT and sets user context
func RequireAuth(cfg *AuthConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			return
		}

		tokenString := parts[1]

		// Parse token without verification for structure check
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Keyfunc will be implemented with Clerk JWKS fetching
			// For now, this is a scaffold that verifies algorithm
			if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return nil, nil // TODO: implement JWKS key fetching
		}, jwt.WithValidMethods([]string{"RS256"}))

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		// Verify expiration
		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token expired"})
				return
			}
		}

		// Extract user info from Clerk JWT claims
		// Clerk sub claim is the user ID
		clerkID, _ := claims["sub"].(string)
		email, _ := claims["email"].(string)

		if clerkID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token: missing user id"})
			return
		}

		c.Set(UserContextKey, UserContext{
			ClerkID: clerkID,
			Email:   email,
		})
		c.Next()
	}
}

// GetUserContext retrieves user from gin context
func GetUserContext(c *gin.Context) (UserContext, bool) {
	user, exists := c.Get(UserContextKey)
	if !exists {
		return UserContext{}, false
	}
	uc, ok := user.(UserContext)
	return uc, ok
}
