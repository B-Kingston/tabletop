package models

import (
	"time"

	"github.com/google/uuid"
)

// MediaItem represents a movie or TV show tracked by an instance
type MediaItem struct {
	UUIDModel
	InstanceID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"instanceId"`
	TMDBID      int        `gorm:"not null" json:"tmdbId"`
	Type        string     `gorm:"not null" json:"type"` // movie, tv
	Title       string     `gorm:"not null" json:"title"`
	Overview    string     `json:"overview"`
	PosterPath  string     `json:"posterPath"`
	ReleaseDate     *time.Time `gorm:"type:date" json:"releaseDate"`
	PlanToWatchDate *time.Time `gorm:"type:date" json:"planToWatchDate"`
	Status          string     `gorm:"default:'planning'" json:"status"` // planning, watching, completed, dropped
	Rating          *float32   `json:"rating"`                           // 0.0 - 5.0
	Review      string     `json:"review"`
	CreatedByID uuid.UUID  `gorm:"type:uuid;not null" json:"createdById"`
	UpdatedByID uuid.UUID  `gorm:"type:uuid" json:"updatedById"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Associations
	CreatedBy User `gorm:"foreignKey:CreatedByID" json:"createdBy,omitempty"`
}

// TableName specifies the table name
func (MediaItem) TableName() string {
	return "media_items"
}
