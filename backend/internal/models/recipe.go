package models

import (
	"time"

	"github.com/google/uuid"
)

// Recipe represents a cooking recipe belonging to an instance
type Recipe struct {
	UUIDModel
	InstanceID  uuid.UUID `gorm:"type:uuid;not null;index" json:"instanceId"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	SourceURL   string    `json:"sourceUrl"`
	PrepTime    int       `json:"prepTime"`    // minutes
	CookTime    int       `json:"cookTime"`    // minutes
	Servings    int       `json:"servings"`
	ImageURL    string    `json:"imageUrl"`    // URL only, no uploads
	Rating      *float32  `json:"rating"`      // 0.0 - 5.0
	Review      string    `json:"review"`
	CreatedByID uuid.UUID `gorm:"type:uuid;not null" json:"createdById"`
	UpdatedByID uuid.UUID `gorm:"type:uuid" json:"updatedById"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Associations
	Ingredients []Ingredient `json:"ingredients,omitempty"`
	Steps       []RecipeStep `json:"steps,omitempty"`
	Tags        []RecipeTag  `gorm:"many2many:recipe_recipe_tags;" json:"tags,omitempty"`
	CreatedBy   User         `gorm:"foreignKey:CreatedByID" json:"createdBy,omitempty"`
}

// TableName specifies the table name
func (Recipe) TableName() string {
	return "recipes"
}

// Ingredient is a component of a recipe
type Ingredient struct {
	UUIDModel
	RecipeID uuid.UUID `gorm:"type:uuid;not null;index" json:"recipeId"`
	Name     string    `gorm:"not null" json:"name"`
	Quantity string    `json:"quantity"`
	Unit     string    `json:"unit"`
	Optional bool      `gorm:"default:false" json:"optional"`
}

// TableName specifies the table name
func (Ingredient) TableName() string {
	return "ingredients"
}

// RecipeStep is an ordered instruction for cooking
type RecipeStep struct {
	UUIDModel
	RecipeID    uuid.UUID `gorm:"type:uuid;not null;index" json:"recipeId"`
	OrderIndex  int       `gorm:"not null" json:"orderIndex"`
	Title       string    `json:"title"`       // optional step title
	Content     string    `gorm:"not null;type:text" json:"content"` // markdown / plate serialized
	DurationMin *int      `json:"durationMin"` // optional timer
}

// TableName specifies the table name
func (RecipeStep) TableName() string {
	return "recipe_steps"
}

// RecipeTag is a categorization label
type RecipeTag struct {
	UUIDModel
	Name string `gorm:"uniqueIndex;not null" json:"name"`
}

// TableName specifies the table name
func (RecipeTag) TableName() string {
	return "recipe_tags"
}
