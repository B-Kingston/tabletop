-- safety: destructive-change-approved
-- safety: data-backup-required
-- safety: rollback-reviewed

-- +goose Up
CREATE TABLE recipe_versions (
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES instances(id),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    version_number INTEGER NOT NULL,
    remix_prompt TEXT,
    snapshot JSONB NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users(id),
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipe_versions_instance_id ON recipe_versions(instance_id);
CREATE INDEX idx_recipe_versions_recipe_id ON recipe_versions(recipe_id);
CREATE INDEX idx_recipe_versions_is_current ON recipe_versions(is_current);
CREATE UNIQUE INDEX idx_recipe_versions_recipe_number ON recipe_versions(recipe_id, version_number);

-- +goose Down
DROP TABLE IF EXISTS recipe_versions;
