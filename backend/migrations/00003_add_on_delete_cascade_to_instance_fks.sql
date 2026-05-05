-- +goose Up
-- Add ON DELETE CASCADE to all sub-resource instance_id foreign keys

-- Wines
ALTER TABLE wines DROP CONSTRAINT IF EXISTS wines_instance_id_fkey;
ALTER TABLE wines ADD CONSTRAINT wines_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE;

-- Media items
ALTER TABLE media_items DROP CONSTRAINT IF EXISTS media_items_instance_id_fkey;
ALTER TABLE media_items ADD CONSTRAINT media_items_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE;

-- Recipes
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_instance_id_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE;

-- Chat sessions
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_instance_id_fkey;
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE;

-- +goose Down
-- Restore bare foreign key references (no CASCADE)

ALTER TABLE wines DROP CONSTRAINT IF EXISTS wines_instance_id_fkey;
ALTER TABLE wines ADD CONSTRAINT wines_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id);

ALTER TABLE media_items DROP CONSTRAINT IF EXISTS media_items_instance_id_fkey;
ALTER TABLE media_items ADD CONSTRAINT media_items_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id);

ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_instance_id_fkey;
ALTER TABLE recipes ADD CONSTRAINT recipes_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id);

ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_instance_id_fkey;
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES instances(id);
