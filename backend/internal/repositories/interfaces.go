package repositories

import (
	"context"

	"github.com/google/uuid"
	"tabletop/backend/internal/models"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByClerkID(ctx context.Context, clerkID string) (*models.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type InstanceRepository interface {
	Create(ctx context.Context, instance *models.Instance) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Instance, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.Instance, error)
	Update(ctx context.Context, instance *models.Instance) error
	Delete(ctx context.Context, id uuid.UUID) error
	AddMember(ctx context.Context, membership *models.InstanceMembership) error
	RemoveMember(ctx context.Context, instanceID, userID uuid.UUID) error
	IsMember(ctx context.Context, instanceID, userID uuid.UUID) (bool, error)
	GetMemberRole(ctx context.Context, instanceID, userID uuid.UUID) (string, error)
}
