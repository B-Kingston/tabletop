package database

import (
	"fmt"

	"tabletop/backend/internal/config"
	"tabletop/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB holds the database connection
type DB struct {
	*gorm.DB
}

// New creates a new database connection
func New(cfg *config.Config) (*DB, error) {
	logLevel := logger.Silent
	if cfg.IsDevelopment() {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return &DB{db}, nil
}

// AutoMigrate runs database migrations for all models
func (db *DB) AutoMigrate() error {
	return db.DB.AutoMigrate(
		&models.User{},
		&models.Instance{},
		&models.InstanceMembership{},
		&models.MediaItem{},
		&models.Wine{},
		&models.Recipe{},
		&models.Ingredient{},
		&models.RecipeStep{},
		&models.RecipeTag{},
		&models.ChatSession{},
		&models.ChatMessage{},
	)
}

// Close closes the underlying database connection
func (db *DB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Health checks if the database is reachable
func (db *DB) Health() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// Transaction executes a function within a database transaction
func (db *DB) Transaction(fn func(*gorm.DB) error) error {
	return db.DB.Transaction(fn)
}
