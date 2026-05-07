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
	"tabletop/backend/internal/handlers/ai"
	"tabletop/backend/internal/handlers/auth"
	"tabletop/backend/internal/handlers/chat"
	"tabletop/backend/internal/handlers/instances"
	mediahandler "tabletop/backend/internal/handlers/media"
	messagehandler "tabletop/backend/internal/handlers/messages"
	nightshandler "tabletop/backend/internal/handlers/nights"
	"tabletop/backend/internal/handlers/omdb"
	recipehandler "tabletop/backend/internal/handlers/recipes"
	"tabletop/backend/internal/handlers/webhooks"
	winehandler "tabletop/backend/internal/handlers/wines"
	"tabletop/backend/internal/middleware"
	"tabletop/backend/internal/models"
	redisc "tabletop/backend/internal/redis"
	"tabletop/backend/internal/repositories"
	"tabletop/backend/internal/services"
	ws "tabletop/backend/internal/websocket"
	"tabletop/backend/migrations"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	db, err := database.New(cfg)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.Migrate(migrations.FS, "."); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("database connected and migrated")

	if cfg.DevSkipAuth {
		var devUser models.User
		if result := db.DB.FirstOrCreate(&devUser, models.User{ClerkID: "dev-user", Email: "dev@localhost", Name: "Dev User"}); result.Error != nil {
			slog.Warn("failed to seed dev user", "error", result.Error)
		}
	}

	var redisClient *redisc.Client
	if cfg.RedisURL != "" {
		rc, err := redisc.New(cfg.RedisURL)
		if err != nil {
			slog.Warn("failed to connect to redis, rate limiting disabled", "error", err)
		} else {
			redisClient = rc
			slog.Info("redis connected")
		}
	}

	userRepo := repositories.NewUserRepository(db.DB)
	instanceRepo := repositories.NewInstanceRepository(db.DB)
	mediaRepo := repositories.NewMediaRepository(db.DB)
	recipeRepo := repositories.NewRecipeRepository(db.DB)
	wineRepo := repositories.NewWineRepository(db.DB)
	chatSessionRepo := repositories.NewChatSessionRepository(db.DB)
	chatMessageRepo := repositories.NewChatMessageRepository(db.DB)
	memberMessageRepo := repositories.NewMemberMessageRepository(db.DB)

	instanceService := services.NewInstanceService(instanceRepo, userRepo)
	mediaService := services.NewMediaService(mediaRepo)
	recipeService := services.NewRecipeService(recipeRepo)
	wineService := services.NewWineService(wineRepo)

	nightRepo := repositories.NewNightRepository(db.DB)
	nightService := services.NewNightService(nightRepo, wineRepo, recipeRepo, mediaRepo)

	var openaiRateLimiter services.RateLimiter
	if redisClient != nil {
		openaiRateLimiter = redisClient.Client
	}
	openaiService := services.NewOpenAIService(cfg.OpenAIAPIKey, openaiRateLimiter, 20, cfg.Environment == "production")
	chatService := services.NewChatService(chatSessionRepo, chatMessageRepo, openaiService)
	memberMessageService := services.NewMemberMessageService(memberMessageRepo)
	omdbCacheRepo := repositories.NewOMDBCacheRepository(db.DB)
	omdbService := services.NewOMDBService(cfg.OMDBAPIKey, omdbCacheRepo)

	hub := ws.NewHub()
	go hub.Run()

	authHandler := auth.NewHandler(userRepo)
	instanceHandler := instances.NewHandler(instanceService, db.DB)
	mediaHandler := mediahandler.NewHandler(mediaService)
	recipeHandler := recipehandler.NewHandler(recipeService, db.DB)
	wineHandler := winehandler.NewHandler(wineService, db.DB)
	nightHandler := nightshandler.NewHandler(nightService, db.DB)
	chatHandler := chat.NewHandler(chatService)
	messageHandler := messagehandler.NewHandler(memberMessageService, hub)
	omdbHandler := omdb.NewHandler(omdbService)
	aiHandler := ai.NewHandler(openaiService)
	webhookHandler := webhooks.NewHandler(userRepo, cfg.ClerkWebhookSecret)

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(&middleware.CORSConfig{
		AllowOrigins: []string{cfg.FrontendURL},
	}))

	r.GET("/health", func(c *gin.Context) {
		if err := db.Health(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy", "database": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	v1 := r.Group("/v1")

	v1.GET("/status", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "1.0.0"})
	})

	webhookHandler.RegisterRoutes(v1)

	// Standard HTTP auth: reject query-token auth
	authCfg := &middleware.AuthConfig{
		ClerkJWKSURL:    cfg.ClerkJWKSURL,
		DevSkipAuth:     cfg.DevSkipAuth,
		Issuer:          cfg.ClerkIssuer,
		Audience:        cfg.ClerkAudience,
		AllowQueryToken: false,
	}

	authenticated := v1.Group("")
	authenticated.Use(middleware.RequireAuth(authCfg))
	{
		authHandler.RegisterRoutes(authenticated)
		instanceHandler.RegisterRoutes(authenticated)
	}

	instance := v1.Group("/instances/:instance_id")
	instance.Use(middleware.RequireAuth(authCfg))
	instance.Use(middleware.RequireInstanceMembership(db.DB))
	{
		mediaHandler.RegisterRoutes(instance)
		recipeHandler.RegisterRoutes(instance)
		wineHandler.RegisterRoutes(instance)
		nightHandler.RegisterRoutes(instance)
		messageHandler.RegisterRoutes(instance)
		chatHandler.RegisterRoutes(instance)
		omdbHandler.RegisterRoutes(instance)
		aiHandler.RegisterRoutes(instance)
	}

	// WebSocket route: allow query-token auth because browser WebSocket
	// constructors cannot set Authorization headers.
	wsAuthCfg := &middleware.AuthConfig{
		ClerkJWKSURL:    cfg.ClerkJWKSURL,
		DevSkipAuth:     cfg.DevSkipAuth,
		Issuer:          cfg.ClerkIssuer,
		Audience:        cfg.ClerkAudience,
		AllowQueryToken: true,
	}
	wsInstance := v1.Group("/instances/:instance_id")
	wsInstance.Use(middleware.RequireAuth(wsAuthCfg))
	wsInstance.Use(middleware.RequireInstanceMembership(db.DB))
	wsInstance.GET("/ws", ws.ServeWS(hub, db.DB, cfg.FrontendURL))

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

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
