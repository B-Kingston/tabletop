-- +goose Up
-- Create nights table for curated/generated evening plans

CREATE TABLE nights (
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    wine_id UUID REFERENCES wines(id) ON DELETE SET NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    media_id UUID REFERENCES media_items(id) ON DELETE SET NULL,
    created_by_id UUID NOT NULL REFERENCES users(id),
    updated_by_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nights_instance_id ON nights(instance_id);
CREATE INDEX idx_nights_wine_id ON nights(wine_id);
CREATE INDEX idx_nights_recipe_id ON nights(recipe_id);
CREATE INDEX idx_nights_media_id ON nights(media_id);

-- +goose Down
-- Remove nights table and indexes

DROP TABLE IF EXISTS nights CASCADE;
