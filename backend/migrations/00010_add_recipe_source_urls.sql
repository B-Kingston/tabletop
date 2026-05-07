-- safety: destructive-change-approved
-- safety: data-backup-required
-- safety: rollback-reviewed

-- +goose Up
ALTER TABLE recipes ADD COLUMN source_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE recipes
SET source_urls = jsonb_build_array(source_url)
WHERE source_url IS NOT NULL AND source_url <> '';

-- +goose Down
ALTER TABLE recipes DROP COLUMN source_urls;
