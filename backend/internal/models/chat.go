package models

import (
	"time"

	"github.com/google/uuid"
)

// ChatSession is an AI conversation within an instance
type ChatSession struct {
	UUIDModel
	InstanceID uuid.UUID `gorm:"type:uuid;not null;index" json:"instanceId"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	Title      string    `gorm:"default:'New Chat'" json:"title"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`

	// Associations
	Messages []ChatMessage `gorm:"foreignKey:SessionID" json:"messages,omitempty"`
	User     User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (ChatSession) TableName() string {
	return "chat_sessions"
}

// ChatMessage is a single turn in a chat
type ChatMessage struct {
	UUIDModel
	SessionID uuid.UUID `gorm:"type:uuid;not null;index" json:"sessionId"`
	Role      string    `gorm:"not null" json:"role"` // user, assistant, system
	Content   string    `gorm:"not null;type:text" json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

// TableName specifies the table name
func (ChatMessage) TableName() string {
	return "chat_messages"
}
