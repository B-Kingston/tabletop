package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Instance is a shared workspace ("group") containing media, wines, and recipes
type Instance struct {
	UUIDModel
	Name         string    `gorm:"not null" json:"name"`
	Description  string    `json:"description"`
	OwnerID      uuid.UUID `gorm:"type:uuid;not null" json:"ownerId"`
	JoinPassword string    `gorm:"not null" json:"-"` // bcrypt hashed, never serialized
	IsPublic     bool      `gorm:"default:false" json:"isPublic"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`

	// Associations
	Owner   User          `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Members []User        `gorm:"many2many:instance_memberships;" json:"members,omitempty"`
	Media   []MediaItem   `json:"media,omitempty"`
	Wines   []Wine        `json:"wines,omitempty"`
	Recipes []Recipe      `json:"recipes,omitempty"`
}

// TableName specifies the table name
func (Instance) TableName() string {
	return "instances"
}

// InstanceMembership links users to instances with roles
type InstanceMembership struct {
	UserID     uuid.UUID `gorm:"type:uuid;primaryKey" json:"userId"`
	InstanceID uuid.UUID `gorm:"type:uuid;primaryKey" json:"instanceId"`
	Role       string    `gorm:"default:'member'" json:"role"` // owner, admin, member
	JoinedAt   time.Time `json:"joinedAt"`
}

// TableName specifies the table name
func (InstanceMembership) TableName() string {
	return "instance_memberships"
}

// BeforeCreate hook to set default timestamps
func (im *InstanceMembership) BeforeCreate(tx *gorm.DB) error {
	if im.JoinedAt.IsZero() {
		im.JoinedAt = time.Now()
	}
	return nil
}
