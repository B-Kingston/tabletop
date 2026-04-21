package database

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	testDB := &DB{db}
	err = testDB.AutoMigrate()
	require.NoError(t, err)

	return testDB
}

func TestAutoMigrate(t *testing.T) {
	db := setupTestDB(t)

	// Verify tables exist by creating a record
	user := models.User{
		ClerkID: "test_clerk_123",
		Email:   "test@example.com",
		Name:    "Test User",
	}
	err := db.Create(&user).Error
	require.NoError(t, err)
	assert.NotEqual(t, 0, user.ID)
}

func TestHealth(t *testing.T) {
	db := setupTestDB(t)
	err := db.Health()
	assert.NoError(t, err)
}

func TestTransaction_Commit(t *testing.T) {
	db := setupTestDB(t)

	err := db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(&models.User{ClerkID: "tx_user", Email: "tx@test.com"}).Error
	})
	require.NoError(t, err)

	var count int64
	db.Model(&models.User{}).Where("clerk_id = ?", "tx_user").Count(&count)
	assert.Equal(t, int64(1), count)
}

func TestTransaction_Rollback(t *testing.T) {
	db := setupTestDB(t)

	err := db.Transaction(func(tx *gorm.DB) error {
		tx.Create(&models.User{ClerkID: "rollback_user", Email: "rb@test.com"})
		return assert.AnError // force rollback
	})
	assert.Error(t, err)

	var count int64
	db.Model(&models.User{}).Where("clerk_id = ?", "rollback_user").Count(&count)
	assert.Equal(t, int64(0), count)
}
