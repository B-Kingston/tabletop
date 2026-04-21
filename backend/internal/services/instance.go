package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

// InstanceService handles business logic for instances
type InstanceService struct {
	instanceRepo *repositories.InstanceRepository
	userRepo     *repositories.UserRepository
}

// NewInstanceService creates a new instance service
func NewInstanceService(instanceRepo *repositories.InstanceRepository, userRepo *repositories.UserRepository) *InstanceService {
	return &InstanceService{
		instanceRepo: instanceRepo,
		userRepo:     userRepo,
	}
}

// CreateInstance creates a new instance with the user as owner
func (s *InstanceService) CreateInstance(ctx context.Context, userID uuid.UUID, name, password string) (*models.Instance, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	instance := &models.Instance{
		Name:         name,
		OwnerID:      userID,
		JoinPassword: string(hashedPassword),
	}

	if err := s.instanceRepo.Create(ctx, instance); err != nil {
		return nil, err
	}

	// Add owner as member with owner role
	membership := &models.InstanceMembership{
		UserID:     userID,
		InstanceID: instance.ID,
		Role:       "owner",
	}
	if err := s.instanceRepo.AddMember(ctx, membership); err != nil {
		return nil, fmt.Errorf("failed to add owner as member: %w", err)
	}

	return instance, nil
}

// GetInstance retrieves an instance by ID if the user is a member
func (s *InstanceService) GetInstance(ctx context.Context, instanceID, userID uuid.UUID) (*models.Instance, error) {
	isMember, err := s.instanceRepo.IsMember(ctx, instanceID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, fmt.Errorf("not a member of this instance")
	}

	return s.instanceRepo.GetByID(ctx, instanceID)
}

// ListUserInstances returns all instances the user belongs to
func (s *InstanceService) ListUserInstances(ctx context.Context, userID uuid.UUID) ([]models.Instance, error) {
	return s.instanceRepo.ListByUserID(ctx, userID)
}

// JoinInstance allows a user to join an instance with a password
func (s *InstanceService) JoinInstance(ctx context.Context, instanceID uuid.UUID, userID uuid.UUID, password string) error {
	instance, err := s.instanceRepo.GetByID(ctx, instanceID)
	if err != nil {
		return err
	}
	if instance == nil {
		return fmt.Errorf("instance not found")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(instance.JoinPassword), []byte(password)); err != nil {
		return fmt.Errorf("invalid password")
	}

	// Check if already a member
	isMember, err := s.instanceRepo.IsMember(ctx, instanceID, userID)
	if err != nil {
		return err
	}
	if isMember {
		return fmt.Errorf("already a member")
	}

	membership := &models.InstanceMembership{
		UserID:     userID,
		InstanceID: instanceID,
		Role:       "member",
	}
	return s.instanceRepo.AddMember(ctx, membership)
}

// UpdateInstance updates instance details (owner only)
func (s *InstanceService) UpdateInstance(ctx context.Context, instanceID, userID uuid.UUID, name string) (*models.Instance, error) {
	role, err := s.instanceRepo.GetMemberRole(ctx, instanceID, userID)
	if err != nil {
		return nil, err
	}
	if role != "owner" && role != "admin" {
		return nil, fmt.Errorf("insufficient permissions")
	}

	instance, err := s.instanceRepo.GetByID(ctx, instanceID)
	if err != nil {
		return nil, err
	}
	if instance == nil {
		return nil, fmt.Errorf("instance not found")
	}

	instance.Name = name
	if err := s.instanceRepo.Update(ctx, instance); err != nil {
		return nil, err
	}
	return instance, nil
}

// DeleteInstance removes an instance (owner only)
func (s *InstanceService) DeleteInstance(ctx context.Context, instanceID, userID uuid.UUID) error {
	role, err := s.instanceRepo.GetMemberRole(ctx, instanceID, userID)
	if err != nil {
		return err
	}
	if role != "owner" {
		return fmt.Errorf("only the owner can delete an instance")
	}

	return s.instanceRepo.Delete(ctx, instanceID)
}

// LeaveInstance allows a member to leave (owner cannot leave, must transfer or delete)
func (s *InstanceService) LeaveInstance(ctx context.Context, instanceID, userID uuid.UUID) error {
	role, err := s.instanceRepo.GetMemberRole(ctx, instanceID, userID)
	if err != nil {
		return err
	}
	if role == "" {
		return fmt.Errorf("not a member")
	}
	if role == "owner" {
		return fmt.Errorf("owner must transfer ownership or delete the instance")
	}

	return s.instanceRepo.RemoveMember(ctx, instanceID, userID)
}
