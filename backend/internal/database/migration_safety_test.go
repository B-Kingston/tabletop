package database

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrationSafetyFlagsFutureDestructiveMigrationWithoutApproval(t *testing.T) {
	result := assessMigrationSafety("00007_drop_recipe_review.sql", `
-- +goose Up
ALTER TABLE recipes DROP COLUMN review;

-- +goose Down
ALTER TABLE recipes ADD COLUMN review TEXT;
`)

	require.False(t, result.Safe)
	assert.Contains(t, result.Reasons, "DROP COLUMN")
	assert.Contains(t, result.Reasons, "missing safety approval block")
}

func TestMigrationSafetyAllowsFutureDestructiveMigrationWithApproval(t *testing.T) {
	result := assessMigrationSafety("00007_drop_recipe_review.sql", `
-- safety: destructive-change-approved
-- safety: data-backup-required
-- safety: rollback-reviewed
-- +goose Up
ALTER TABLE recipes DROP COLUMN review;

-- +goose Down
ALTER TABLE recipes ADD COLUMN review TEXT;
`)

	require.True(t, result.Safe)
	assert.Contains(t, result.Reasons, "DROP COLUMN")
}

func TestMigrationSafetyIgnoresCurrentBaselineHistory(t *testing.T) {
	result := assessMigrationSafety("00002_wine_media_refactor.sql", `
-- +goose Up
ALTER TABLE wines DROP COLUMN producer;
ALTER TABLE wines ALTER COLUMN consumed_at TYPE DATE USING consumed_at::DATE;
`)

	assert.True(t, result.Safe)
	assert.Empty(t, result.Reasons)
}

func TestAllFutureMigrationsHaveSafetyApprovalForDestructiveStatements(t *testing.T) {
	results, err := scanMigrationSafety("../../migrations")
	require.NoError(t, err)

	for _, result := range results {
		assert.Truef(t, result.Safe, "%s has unsafe migration statements: %v", result.FileName, result.Reasons)
	}
}
