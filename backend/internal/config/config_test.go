package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoad_UsesDefaults(t *testing.T) {
	// Clear env to test defaults
	os.Clearenv()
	os.Setenv("DATABASE_URL", "postgres://test")
	os.Setenv("CLERK_SECRET_KEY", "sk_test")
	os.Setenv("OMDB_API_KEY", "omdb_test")

	cfg := Load()

	assert.Equal(t, "8080", cfg.Port)
	assert.Equal(t, "development", cfg.Environment)
	assert.Equal(t, "redis://localhost:6379", cfg.RedisURL)
	assert.True(t, cfg.IsDevelopment())
}

func TestLoad_OverridesWithEnv(t *testing.T) {
	os.Clearenv()
	os.Setenv("PORT", "9090")
	os.Setenv("ENVIRONMENT", "production")
	os.Setenv("DATABASE_URL", "postgres://test")
	os.Setenv("CLERK_SECRET_KEY", "sk_test")
	os.Setenv("OMDB_API_KEY", "omdb_test")
	os.Setenv("FRONTEND_URL", "https://app.example.com")

	cfg := Load()

	assert.Equal(t, "9090", cfg.Port)
	assert.Equal(t, "production", cfg.Environment)
	assert.Equal(t, "https://app.example.com", cfg.FrontendURL)
	assert.False(t, cfg.IsDevelopment())
}

func TestValidate_MissingDatabaseURL(t *testing.T) {
	cfg := &Config{
		ClerkSecretKey: "sk_test",
		OMDBAPIKey:     "omdb_test",
	}

	err := cfg.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "DATABASE_URL")
}

func TestValidate_MissingClerkSecretKey(t *testing.T) {
	cfg := &Config{
		DatabaseURL: "postgres://test",
		OMDBAPIKey:  "omdb_test",
	}

	err := cfg.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CLERK_SECRET_KEY")
}

func TestValidate_MissingOMDBAPIKey(t *testing.T) {
	cfg := &Config{
		DatabaseURL:    "postgres://test",
		ClerkSecretKey: "sk_test",
		ClerkJWKSURL:   "https://test.clerk.accounts.dev/.well-known/jwks.json",
		ClerkIssuer:    "https://clerk.test.com",
		ClerkAudience:  "test-audience",
	}

	err := cfg.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "OMDB_API_KEY")
}

func TestValidate_Success(t *testing.T) {
	cfg := &Config{
		DatabaseURL:    "postgres://test",
		ClerkSecretKey: "sk_test",
		ClerkJWKSURL:   "https://test.clerk.accounts.dev/.well-known/jwks.json",
		ClerkIssuer:    "https://clerk.test.com",
		ClerkAudience:  "test-audience",
		OMDBAPIKey:     "omdb_test",
	}

	err := cfg.Validate()
	assert.NoError(t, err)
}

func TestValidate_DevSkipAuthInProduction(t *testing.T) {
	cfg := &Config{
		DatabaseURL: "postgres://test",
		Environment: "production",
		DevSkipAuth: true,
	}

	err := cfg.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "DEV_SKIP_AUTH cannot be enabled in production")
}

func TestValidate_DevSkipAuthInDevelopment(t *testing.T) {
	cfg := &Config{
		DatabaseURL: "postgres://test",
		Environment: "development",
		DevSkipAuth: true,
	}

	err := cfg.Validate()
	assert.NoError(t, err)
}

func TestValidate_MissingClerkIssuer(t *testing.T) {
	cfg := &Config{
		DatabaseURL:    "postgres://test",
		ClerkSecretKey: "sk_test",
		ClerkJWKSURL:   "https://test.clerk.accounts.dev/.well-known/jwks.json",
		ClerkAudience:  "test-audience",
		OMDBAPIKey:     "omdb_test",
	}

	err := cfg.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CLERK_ISSUER is required")
}

func TestValidate_MissingClerkAudience(t *testing.T) {
	cfg := &Config{
		DatabaseURL:    "postgres://test",
		ClerkSecretKey: "sk_test",
		ClerkJWKSURL:   "https://test.clerk.accounts.dev/.well-known/jwks.json",
		ClerkIssuer:    "https://clerk.test.com",
		OMDBAPIKey:     "omdb_test",
	}

	err := cfg.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "CLERK_AUDIENCE is required")
}
