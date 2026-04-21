package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UUIDModel provides a reusable BeforeCreate hook for UUID generation
type UUIDModel struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
}

// BeforeCreate generates a UUID before insertion
func (u *UUIDModel) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
