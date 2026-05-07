-- safety: destructive-change-approved
-- safety: data-backup-required
-- safety: rollback-reviewed

-- +goose Up
ALTER TABLE media_items DROP COLUMN tmdb_id;
ALTER TABLE media_items ADD COLUMN omdb_id VARCHAR(32) NOT NULL;
ALTER TABLE media_items DROP COLUMN poster_path;
ALTER TABLE media_items DROP COLUMN release_date;
ALTER TABLE media_items ADD COLUMN release_year VARCHAR(16);

-- +goose Down
ALTER TABLE media_items DROP COLUMN release_year;
ALTER TABLE media_items ADD COLUMN release_date DATE;
ALTER TABLE media_items ADD COLUMN poster_path VARCHAR(255);
ALTER TABLE media_items DROP COLUMN omdb_id;
ALTER TABLE media_items ADD COLUMN tmdb_id INTEGER NOT NULL;
