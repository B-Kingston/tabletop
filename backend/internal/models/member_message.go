package models

import (
	"time"

	"github.com/google/uuid"
)

// MemberMessage is a human-authored message in an instance group chat.
type MemberMessage struct {
	UUIDModel
	InstanceID uuid.UUID `gorm:"type:uuid;not null;index" json:"instanceId"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
	Content    string    `gorm:"not null;type:text" json:"content"`
	CreatedAt  time.Time `json:"createdAt"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (MemberMessage) TableName() string {
	return "member_messages"
}
