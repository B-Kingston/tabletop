package services

import (
	"context"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
	"tabletop/backend/internal/models"
	"tabletop/backend/internal/repositories"
)

type NightService struct {
	nightRepo  repositories.NightRepository
	wineRepo   repositories.WineRepository
	recipeRepo repositories.RecipeRepository
	mediaRepo  repositories.MediaRepository
}

func NewNightService(
	nightRepo repositories.NightRepository,
	wineRepo repositories.WineRepository,
	recipeRepo repositories.RecipeRepository,
	mediaRepo repositories.MediaRepository,
) *NightService {
	return &NightService{
		nightRepo:  nightRepo,
		wineRepo:   wineRepo,
		recipeRepo: recipeRepo,
		mediaRepo:  mediaRepo,
	}
}

func (s *NightService) Create(
	ctx context.Context,
	instanceID, userID uuid.UUID,
	name string,
	wineID, recipeID, mediaID *uuid.UUID,
) (*models.Night, error) {
	if err := s.validateFKs(ctx, instanceID, wineID, recipeID, mediaID); err != nil {
		return nil, err
	}

	if name == "" {
		name = s.generateName(ctx, instanceID, wineID, recipeID, mediaID)
	}

	night := &models.Night{
		InstanceID:  instanceID,
		Name:        name,
		WineID:      wineID,
		RecipeID:    recipeID,
		MediaID:     mediaID,
		CreatedByID: userID,
		UpdatedByID: userID,
	}
	if err := s.nightRepo.Create(ctx, night); err != nil {
		return nil, err
	}
	return s.nightRepo.GetByID(ctx, instanceID, night.ID)
}

func (s *NightService) GetByID(ctx context.Context, instanceID, id uuid.UUID) (*models.Night, error) {
	night, err := s.nightRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if night == nil {
		return nil, fmt.Errorf("night not found")
	}
	return night, nil
}

func (s *NightService) List(ctx context.Context, instanceID uuid.UUID) ([]models.Night, error) {
	return s.nightRepo.List(ctx, instanceID)
}

func (s *NightService) Update(
	ctx context.Context,
	instanceID, id, userID uuid.UUID,
	name *string,
	wineID, recipeID, mediaID *uuid.UUID,
	clearWine, clearRecipe, clearMedia *bool,
) (*models.Night, error) {
	night, err := s.nightRepo.GetByID(ctx, instanceID, id)
	if err != nil {
		return nil, err
	}
	if night == nil {
		return nil, fmt.Errorf("night not found")
	}

	if clearWine != nil && *clearWine {
		night.WineID = nil
		night.Wine = nil
	} else if wineID != nil {
		wine, err := s.wineRepo.GetByID(ctx, instanceID, *wineID)
		if err != nil {
			return nil, err
		}
		if wine == nil {
			return nil, fmt.Errorf("wine not found in this instance")
		}
		night.WineID = wineID
	}

	if clearRecipe != nil && *clearRecipe {
		night.RecipeID = nil
		night.Recipe = nil
	} else if recipeID != nil {
		recipe, err := s.recipeRepo.GetByID(ctx, instanceID, *recipeID)
		if err != nil {
			return nil, err
		}
		if recipe == nil {
			return nil, fmt.Errorf("recipe not found in this instance")
		}
		night.RecipeID = recipeID
	}

	if clearMedia != nil && *clearMedia {
		night.MediaID = nil
		night.Media = nil
	} else if mediaID != nil {
		media, err := s.mediaRepo.GetByID(ctx, instanceID, *mediaID)
		if err != nil {
			return nil, err
		}
		if media == nil {
			return nil, fmt.Errorf("media not found in this instance")
		}
		night.MediaID = mediaID
	}

	if name != nil {
		night.Name = *name
	}
	night.UpdatedByID = userID

	if err := s.nightRepo.Update(ctx, night); err != nil {
		return nil, err
	}
	return s.nightRepo.GetByID(ctx, instanceID, id)
}

func (s *NightService) Delete(ctx context.Context, instanceID, id uuid.UUID) error {
	return s.nightRepo.Delete(ctx, instanceID, id)
}

func (s *NightService) validateFKs(
	ctx context.Context,
	instanceID uuid.UUID,
	wineID, recipeID, mediaID *uuid.UUID,
) error {
	if wineID != nil {
		wine, err := s.wineRepo.GetByID(ctx, instanceID, *wineID)
		if err != nil {
			return err
		}
		if wine == nil {
			return fmt.Errorf("wine not found in this instance")
		}
	}
	if recipeID != nil {
		recipe, err := s.recipeRepo.GetByID(ctx, instanceID, *recipeID)
		if err != nil {
			return err
		}
		if recipe == nil {
			return fmt.Errorf("recipe not found in this instance")
		}
	}
	if mediaID != nil {
		media, err := s.mediaRepo.GetByID(ctx, instanceID, *mediaID)
		if err != nil {
			return err
		}
		if media == nil {
			return fmt.Errorf("media not found in this instance")
		}
	}
	return nil
}

func (s *NightService) generateName(
	ctx context.Context,
	instanceID uuid.UUID,
	wineID, recipeID, mediaID *uuid.UUID,
) string {
	var parts []string

	if wineID != nil {
		wine, err := s.wineRepo.GetByID(ctx, instanceID, *wineID)
		if err == nil && wine != nil {
			parts = append(parts, wine.Name)
		}
	}
	if recipeID != nil {
		recipe, err := s.recipeRepo.GetByID(ctx, instanceID, *recipeID)
		if err == nil && recipe != nil {
			parts = append(parts, recipe.Title)
		}
	}
	if mediaID != nil {
		media, err := s.mediaRepo.GetByID(ctx, instanceID, *mediaID)
		if err == nil && media != nil {
			parts = append(parts, media.Title)
		}
	}

	if len(parts) == 0 {
		return "New Night"
	}

	name := strings.Join(parts, " & ")
	if utf8.RuneCountInString(name) > 54 {
		runes := []rune(name)
		name = string(runes[:51]) + "..."
	}
	return name + " Night"
}
