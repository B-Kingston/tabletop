-- +goose Up
-- Refactor wines (simplify schema), add media plan-to-watch date, add instance description + ingredient cost

-- 1. Instance description
ALTER TABLE instances ADD COLUMN description TEXT;

-- 2. Ingredient cost
ALTER TABLE ingredients ADD COLUMN cost DOUBLE PRECISION;

-- 3. Wine schema simplification
ALTER TABLE wines DROP COLUMN producer;
ALTER TABLE wines DROP COLUMN vintage;
ALTER TABLE wines DROP COLUMN currency;
ALTER TABLE wines ALTER COLUMN consumed_at TYPE DATE USING consumed_at::DATE;

-- 4. Media plan-to-watch + date-only release_date
ALTER TABLE media_items ALTER COLUMN release_date TYPE DATE USING release_date::DATE;
ALTER TABLE media_items ADD COLUMN plan_to_watch_date DATE;

-- +goose Down
-- Reverse the refactor

ALTER TABLE media_items DROP COLUMN plan_to_watch_date;
ALTER TABLE media_items ALTER COLUMN release_date TYPE TIMESTAMPTZ USING release_date::TIMESTAMPTZ;

ALTER TABLE wines ALTER COLUMN consumed_at TYPE TIMESTAMPTZ USING consumed_at::TIMESTAMPTZ;
ALTER TABLE wines ADD COLUMN producer VARCHAR(255);
ALTER TABLE wines ADD COLUMN vintage INTEGER;
ALTER TABLE wines ADD COLUMN currency VARCHAR(255) NOT NULL DEFAULT 'AUD';

ALTER TABLE ingredients DROP COLUMN cost;

ALTER TABLE instances DROP COLUMN description;
