package models

import (
	"time"

	"github.com/google/uuid"
)

// WineType represents the category of wine
type WineType string

const (
	WineTypeRed       WineType = "red"
	WineTypeWhite     WineType = "white"
	WineTypeRose      WineType = "rose"
	WineTypeSparkling WineType = "sparkling"
	WineTypePort      WineType = "port"
)

// Wine represents a wine entry in the journal
type Wine struct {
	UUIDModel
	InstanceID  uuid.UUID `gorm:"type:uuid;not null;index" json:"instanceId"`
	Name        string    `gorm:"not null" json:"name"`
	Type        WineType  `gorm:"not null" json:"type"`
	Cost        *float64  `json:"cost"`     // per bottle, in dollars with decimals
	Rating      *float32  `json:"rating"`   // 0.0 - 5.0, supports decimals
	Notes       string    `json:"notes"`
	ConsumedAt  *time.Time `gorm:"type:date" json:"consumedAt"`
	CreatedByID uuid.UUID `gorm:"type:uuid;not null" json:"createdById"`
	UpdatedByID uuid.UUID `gorm:"type:uuid" json:"updatedById"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Associations
	CreatedBy User `gorm:"foreignKey:CreatedByID" json:"createdBy,omitempty"`
}

// TableName specifies the table name
func (Wine) TableName() string {
	return "wines"
}
