package utils

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ForInstance returns a GORM scope that filters by instance_id.
// Every repository query MUST use this scope to enforce data isolation.
func ForInstance(instanceID uuid.UUID) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("instance_id = ?", instanceID)
	}
}
