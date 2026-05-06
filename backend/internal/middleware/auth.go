package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
)

type AuthConfig struct {
	ClerkJWKSURL    string
	DevSkipAuth     bool
	Issuer          string
	Audience        string
	AllowQueryToken bool
}

const UserContextKey = "user"

type UserContext struct {
	ClerkID string
	Email   string
}

type jwksKeyProvider struct {
	cache   *jwk.Cache
	jwksURL string
}

func newJWKSKeyProvider(ctx context.Context, jwksURL string) (*jwksKeyProvider, error) {
	client := httprc.NewClient()
	cache, err := jwk.NewCache(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("failed to create jwks cache: %w", err)
	}
	if err := cache.Register(ctx, jwksURL, jwk.WithConstantInterval(time.Hour)); err != nil {
		return nil, fmt.Errorf("failed to register jwks url: %w", err)
	}
	if _, err := cache.Refresh(ctx, jwksURL); err != nil {
		return nil, fmt.Errorf("failed to initial fetch jwks: %w", err)
	}
	return &jwksKeyProvider{cache: cache, jwksURL: jwksURL}, nil
}

func (p *jwksKeyProvider) keyFunc(token *jwt.Token) (interface{}, error) {
	if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
		return nil, jwt.ErrSignatureInvalid
	}

	kid, ok := token.Header["kid"].(string)
	if !ok {
		return nil, fmt.Errorf("missing kid in token header")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	keyset, err := p.cache.Lookup(ctx, p.jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to lookup jwks: %w", err)
	}

	for i := range keyset.Len() {
		key, ok := keyset.Key(i)
		if !ok {
			continue
		}
		if keyID, exists := key.KeyID(); exists && keyID == kid {
			var raw interface{}
			if err := jwk.Export(key, &raw); err != nil {
				continue
			}
			return raw, nil
		}
	}

	return nil, fmt.Errorf("unable to find key for kid: %s", kid)
}

func validateTokenClaims(claims jwt.MapClaims, cfg *AuthConfig, now time.Time) error {
	exp, err := claims.GetExpirationTime()
	if err != nil || exp == nil {
		return fmt.Errorf("token missing expiration")
	}
	if now.After(exp.Time) {
		return fmt.Errorf("token expired")
	}

	if cfg.Issuer != "" {
		issuer, err := claims.GetIssuer()
		if err != nil || issuer != cfg.Issuer {
			return fmt.Errorf("invalid token issuer")
		}
	}

	if cfg.Audience != "" {
		audience, err := claims.GetAudience()
		if err != nil {
			return fmt.Errorf("invalid token audience")
		}
		for _, aud := range audience {
			if aud == cfg.Audience {
				return nil
			}
		}
		return fmt.Errorf("invalid token audience")
	}

	return nil
}

func RequireAuth(cfg *AuthConfig) gin.HandlerFunc {
	var provider *jwksKeyProvider
	if cfg.ClerkJWKSURL != "" && !cfg.DevSkipAuth {
		var err error
		provider, err = newJWKSKeyProvider(context.Background(), cfg.ClerkJWKSURL)
		if err != nil {
			panic(fmt.Sprintf("failed to initialize JWKS provider: %v", err))
		}
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" && cfg.AllowQueryToken {
			if token := c.Query("token"); token != "" {
				authHeader = "Bearer " + token
			}
		}
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

		// Dev bypass: accept "dev" token in development
		if cfg.DevSkipAuth && tokenString == "dev" {
			c.Set(UserContextKey, UserContext{
				ClerkID: "dev-user",
				Email:   "dev@localhost",
			})
			c.Next()
			return
		}

		if provider == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "auth not configured"})
			return
		}

		token, err := jwt.Parse(tokenString, provider.keyFunc, jwt.WithValidMethods([]string{"RS256"}))
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		if err := validateTokenClaims(claims, cfg, time.Now()); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

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

func GetUserContext(c *gin.Context) (UserContext, bool) {
	user, exists := c.Get(UserContextKey)
	if !exists {
		return UserContext{}, false
	}
	uc, ok := user.(UserContext)
	return uc, ok
}

func ResolveUserID(c *gin.Context, db *gorm.DB) (uuid.UUID, bool) {
	userCtx, ok := GetUserContext(c)
	if !ok {
		return uuid.Nil, false
	}
	var user models.User
	if err := db.Where("clerk_id = ?", userCtx.ClerkID).First(&user).Error; err != nil {
		return uuid.Nil, false
	}
	return user.ID, true
}
