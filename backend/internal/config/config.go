package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// Server
	Port        string
	Environment string // development, production

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// Clerk Auth
	ClerkSecretKey      string
	ClerkPublishableKey string
	ClerkWebhookSecret  string
	ClerkJWKSURL        string
	ClerkIssuer         string
	ClerkAudience       string

	// External APIs
	TMDBAPIKey    string
	OpenAIAPIKey  string

	// CORS
	FrontendURL string

	// Dev bypass
	DevSkipAuth bool
}

// Load reads configuration from environment variables
func Load() *Config {
	// Only load .env in development
	if os.Getenv("ENVIRONMENT") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found, using environment variables")
		}
	}

	devSkipAuth := getEnv("DEV_SKIP_AUTH", "") == "true"

	cfg := &Config{
		Port:                getEnv("PORT", "8080"),
		Environment:         getEnv("ENVIRONMENT", "development"),
		DatabaseURL:         requireEnv("DATABASE_URL"),
		RedisURL:            getEnv("REDIS_URL", "redis://localhost:6379"),
		ClerkSecretKey:      getEnv("CLERK_SECRET_KEY", ""),
		ClerkPublishableKey: getEnv("CLERK_PUBLISHABLE_KEY", ""),
		ClerkWebhookSecret:  getEnv("CLERK_WEBHOOK_SECRET", ""),
		ClerkJWKSURL:        getEnv("CLERK_JWKS_URL", ""),
		ClerkIssuer:         getEnv("CLERK_ISSUER", ""),
		ClerkAudience:       getEnv("CLERK_AUDIENCE", ""),
		TMDBAPIKey:          getEnv("TMDB_API_KEY", ""),
		OpenAIAPIKey:        getEnv("OPENAI_API_KEY", ""),
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:3000"),
		DevSkipAuth:         devSkipAuth,
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func requireEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Required environment variable %s is not set", key)
	}
	return value
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// DSN returns the GORM-compatible database DSN
func (c *Config) DSN() string {
	// NeonDB URL is already in the correct format for pgx
	return c.DatabaseURL
}

// Validate checks that all required config is present
func (c *Config) Validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.DevSkipAuth {
		if c.Environment == "production" {
			return fmt.Errorf("DEV_SKIP_AUTH cannot be enabled in production")
		}
		return nil
	}
	if c.ClerkSecretKey == "" {
		return fmt.Errorf("CLERK_SECRET_KEY is required")
	}
	if c.ClerkJWKSURL == "" {
		return fmt.Errorf("CLERK_JWKS_URL is required")
	}
	if c.ClerkIssuer == "" {
		return fmt.Errorf("CLERK_ISSUER is required")
	}
	if c.ClerkAudience == "" {
		return fmt.Errorf("CLERK_AUDIENCE is required")
	}
	if c.TMDBAPIKey == "" {
		return fmt.Errorf("TMDB_API_KEY is required")
	}
	return nil
}
