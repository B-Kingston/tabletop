package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"tabletop/backend/internal/config"
	"tabletop/backend/internal/database"
	"tabletop/backend/internal/handlers/auth"
	"tabletop/backend/internal/handlers/instances"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/repositories"
	"tabletop/backend/internal/services"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	// Database
	db, err := database.New(cfg)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.AutoMigrate(); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("database connected and migrated")

	// Repositories
	userRepo := repositories.NewUserRepository(db.DB)
	instanceRepo := repositories.NewInstanceRepository(db.DB)

	// Services
	instanceService := services.NewInstanceService(instanceRepo, userRepo)

	// Handlers
	authHandler := auth.NewHandler(userRepo)
	instanceHandler := instances.NewHandler(instanceService, db.DB)

	// Router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(&middleware.CORSConfig{
		AllowOrigins: []string{cfg.FrontendURL},
	}))

	// Health check (no auth)
	r.GET("/health", func(c *gin.Context) {
		if err := db.Health(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy", "database": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// API v1
	v1 := r.Group("/v1")

	// Status (public)
	v1.GET("/status", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "1.0.0"})
	})

	// Authenticated routes
	authenticated := v1.Group("")
	authenticated.Use(middleware.RequireAuth(&middleware.AuthConfig{}))
	{
		// Auth
		authHandler.RegisterRoutes(authenticated)

		// Instance management (create, list, join)
		instanceHandler.RegisterRoutes(authenticated)
	}

	// Server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("forced shutdown", "error", err)
		os.Exit(1)
	}
	slog.Info("server exited")
}
