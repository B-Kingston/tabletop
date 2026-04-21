package models

import (
	"time"
)

// User represents a person in the system, synced from Clerk
type User struct {
	UUIDModel
	ClerkID   string    `gorm:"uniqueIndex;not null" json:"clerkId"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Name      string    `json:"name"`
	AvatarURL string    `json:"avatarUrl"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Associations
	Instances []Instance `gorm:"many2many:instance_memberships;" json:"instances,omitempty"`
}

// TableName specifies the table name
func (User) TableName() string {
	return "users"
}
