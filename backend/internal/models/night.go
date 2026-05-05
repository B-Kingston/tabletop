package models

import (
	"time"

	"github.com/google/uuid"
)

// Night represents a curated or randomly generated evening plan
type Night struct {
	UUIDModel
	InstanceID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"instanceId"`
	Name        string     `gorm:"not null" json:"name"`
	WineID      *uuid.UUID `gorm:"type:uuid;index" json:"wineId"`
	RecipeID    *uuid.UUID `gorm:"type:uuid;index" json:"recipeId"`
	MediaID     *uuid.UUID `gorm:"type:uuid;index" json:"mediaId"`
	CreatedByID uuid.UUID  `gorm:"type:uuid;not null" json:"createdById"`
	UpdatedByID uuid.UUID  `gorm:"type:uuid" json:"updatedById,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Associations (nullable FKs — use pointer types so GORM sets nil when FK is null)
	Wine      *Wine      `gorm:"foreignKey:WineID" json:"wine,omitempty"`
	Recipe    *Recipe    `gorm:"foreignKey:RecipeID" json:"recipe,omitempty"`
	Media     *MediaItem `gorm:"foreignKey:MediaID" json:"media,omitempty"`
	CreatedBy User       `gorm:"foreignKey:CreatedByID" json:"createdBy,omitempty"`
}

// TableName specifies the table name
func (Night) TableName() string {
	return "nights"
}
