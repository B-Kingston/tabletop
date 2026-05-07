package utils

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
)

func TestForInstance(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.MediaItem{}, &models.User{}))

	instA := uuid.MustParse("a0000000-0000-0000-0000-000000000001")
	instB := uuid.MustParse("b0000000-0000-0000-0000-000000000001")
	userID := uuid.MustParse("c0000000-0000-0000-0000-000000000001")

	// Seed data in two instances
	db.Create(&models.MediaItem{InstanceID: instA, OMDBID: "tt0000001", Type: "movie", Title: "A-Movie", CreatedByID: userID})
	db.Create(&models.MediaItem{InstanceID: instA, OMDBID: "tt0000002", Type: "tv", Title: "A-Show", CreatedByID: userID})
	db.Create(&models.MediaItem{InstanceID: instB, OMDBID: "tt0000003", Type: "movie", Title: "B-Movie", CreatedByID: userID})

	// Scope to instance A
	var itemsA []models.MediaItem
	err = db.Scopes(ForInstance(instA)).Find(&itemsA).Error
	require.NoError(t, err)
	assert.Len(t, itemsA, 2)

	// Scope to instance B
	var itemsB []models.MediaItem
	err = db.Scopes(ForInstance(instB)).Find(&itemsB).Error
	require.NoError(t, err)
	assert.Len(t, itemsB, 1)
	assert.Equal(t, "B-Movie", itemsB[0].Title)

	// No scope returns all
	var all []models.MediaItem
	err = db.Find(&all).Error
	require.NoError(t, err)
	assert.Len(t, all, 3)
}
