-- safety: destructive-change-approved
-- safety: data-backup-required
-- safety: rollback-reviewed

-- +goose Up
CREATE TABLE omdb_cache (
    imdb_id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    data TEXT NOT NULL,
    is_full BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_omdb_cache_title ON omdb_cache (title);

-- +goose Down
DROP TABLE IF EXISTS omdb_cache;
