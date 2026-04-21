package models

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestUser_TableName(t *testing.T) {
	u := User{}
	assert.Equal(t, "users", u.TableName())
}

func TestInstance_TableName(t *testing.T) {
	i := Instance{}
	assert.Equal(t, "instances", i.TableName())
}

func TestInstanceMembership_TableName(t *testing.T) {
	im := InstanceMembership{}
	assert.Equal(t, "instance_memberships", im.TableName())
}

func TestMediaItem_TableName(t *testing.T) {
	m := MediaItem{}
	assert.Equal(t, "media_items", m.TableName())
}

func TestWine_TableName(t *testing.T) {
	w := Wine{}
	assert.Equal(t, "wines", w.TableName())
}

func TestWineType_Constants(t *testing.T) {
	assert.Equal(t, WineType("red"), WineTypeRed)
	assert.Equal(t, WineType("white"), WineTypeWhite)
	assert.Equal(t, WineType("rose"), WineTypeRose)
	assert.Equal(t, WineType("sparkling"), WineTypeSparkling)
	assert.Equal(t, WineType("port"), WineTypePort)
}

func TestRecipe_TableName(t *testing.T) {
	r := Recipe{}
	assert.Equal(t, "recipes", r.TableName())
}

func TestIngredient_TableName(t *testing.T) {
	i := Ingredient{}
	assert.Equal(t, "ingredients", i.TableName())
}

func TestRecipeStep_TableName(t *testing.T) {
	rs := RecipeStep{}
	assert.Equal(t, "recipe_steps", rs.TableName())
}

func TestRecipeTag_TableName(t *testing.T) {
	rt := RecipeTag{}
	assert.Equal(t, "recipe_tags", rt.TableName())
}

func TestChatSession_TableName(t *testing.T) {
	cs := ChatSession{}
	assert.Equal(t, "chat_sessions", cs.TableName())
}

func TestChatMessage_TableName(t *testing.T) {
	cm := ChatMessage{}
	assert.Equal(t, "chat_messages", cm.TableName())
}

func TestMediaItem_AuditFields(t *testing.T) {
	uid := uuid.MustParse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
	m := MediaItem{
		InstanceID:  uid,
		TMDBID:      123,
		Type:        "movie",
		Title:       "Test Movie",
		CreatedByID: uid,
	}
	assert.Equal(t, uid, m.InstanceID)
	assert.Equal(t, uid, m.CreatedByID)
	assert.Nil(t, m.Rating)
}

func TestRecipe_StepAssociation(t *testing.T) {
	rid := uuid.MustParse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
	r := Recipe{
		UUIDModel: UUIDModel{ID: rid},
		Title:     "Pasta",
		Steps: []RecipeStep{
			{UUIDModel: UUIDModel{ID: uuid.MustParse("b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")}, RecipeID: rid, OrderIndex: 0, Content: "Boil water"},
			{UUIDModel: UUIDModel{ID: uuid.MustParse("c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")}, RecipeID: rid, OrderIndex: 1, Content: "Add pasta"},
		},
	}
	assert.Len(t, r.Steps, 2)
	assert.Equal(t, 0, r.Steps[0].OrderIndex)
	assert.Equal(t, 1, r.Steps[1].OrderIndex)
}
