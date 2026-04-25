package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tabletop/backend/internal/models"
)

// InstanceRepository handles instance data access
type GormInstanceRepository struct {
	db *gorm.DB
}

func NewInstanceRepository(db *gorm.DB) *GormInstanceRepository {
	return &GormInstanceRepository{db: db}
}

func (r *GormInstanceRepository) Create(ctx context.Context, instance *models.Instance) error {
	if err := r.db.WithContext(ctx).Create(instance).Error; err != nil {
		return fmt.Errorf("failed to create instance: %w", err)
	}
	return nil
}

// GetByID finds an instance by ID with associations
func (r *GormInstanceRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Instance, error) {
	var instance models.Instance
	if err := r.db.WithContext(ctx).
		Preload("Owner").
		Preload("Members").
		First(&instance, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get instance: %w", err)
	}
	return &instance, nil
}

// ListByUserID returns all instances a user belongs to
func (r *GormInstanceRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.Instance, error) {
	var instances []models.Instance
	if err := r.db.WithContext(ctx).
		Joins("JOIN instance_memberships ON instance_memberships.instance_id = instances.id").
		Where("instance_memberships.user_id = ?", userID).
		Preload("Owner").
		Find(&instances).Error; err != nil {
		return nil, fmt.Errorf("failed to list instances: %w", err)
	}
	return instances, nil
}

// Update modifies an instance
func (r *GormInstanceRepository) Update(ctx context.Context, instance *models.Instance) error {
	if err := r.db.WithContext(ctx).Save(instance).Error; err != nil {
		return fmt.Errorf("failed to update instance: %w", err)
	}
	return nil
}

// Delete removes an instance and all related data
func (r *GormInstanceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Instance{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete instance: %w", err)
	}
	return nil
}

// AddMember adds a user to an instance
func (r *GormInstanceRepository) AddMember(ctx context.Context, membership *models.InstanceMembership) error {
	if err := r.db.WithContext(ctx).Create(membership).Error; err != nil {
		return fmt.Errorf("failed to add member: %w", err)
	}
	return nil
}

// RemoveMember removes a user from an instance
func (r *GormInstanceRepository) RemoveMember(ctx context.Context, instanceID, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).
		Delete(&models.InstanceMembership{}, "instance_id = ? AND user_id = ?", instanceID, userID).Error; err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}
	return nil
}

// IsMember checks if a user is a member of an instance
func (r *GormInstanceRepository) IsMember(ctx context.Context, instanceID, userID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&models.InstanceMembership{}).
		Where("instance_id = ? AND user_id = ?", instanceID, userID).
		Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check membership: %w", err)
	}
	return count > 0, nil
}

// GetMemberRole returns the role of a user in an instance
func (r *GormInstanceRepository) GetMemberRole(ctx context.Context, instanceID, userID uuid.UUID) (string, error) {
	var membership models.InstanceMembership
	if err := r.db.WithContext(ctx).
		Where("instance_id = ? AND user_id = ?", instanceID, userID).
		First(&membership).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", nil
		}
		return "", fmt.Errorf("failed to get member role: %w", err)
	}
	return membership.Role, nil
}
