-- +goose Up
-- Add ON DELETE CASCADE to all child foreign keys referencing recipes(id)

-- Ingredients
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_recipe_id_fkey;
ALTER TABLE ingredients ADD CONSTRAINT ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

-- Recipe steps
ALTER TABLE recipe_steps DROP CONSTRAINT IF EXISTS recipe_steps_recipe_id_fkey;
ALTER TABLE recipe_steps ADD CONSTRAINT recipe_steps_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

-- Recipe <-> RecipeTag join table
ALTER TABLE recipe_recipe_tags DROP CONSTRAINT IF EXISTS recipe_recipe_tags_recipe_id_fkey;
ALTER TABLE recipe_recipe_tags ADD CONSTRAINT recipe_recipe_tags_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

-- Recipe versions
ALTER TABLE recipe_versions DROP CONSTRAINT IF EXISTS recipe_versions_recipe_id_fkey;
ALTER TABLE recipe_versions ADD CONSTRAINT recipe_versions_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

-- +goose Down
-- Restore bare foreign key references (no CASCADE)

ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_recipe_id_fkey;
ALTER TABLE ingredients ADD CONSTRAINT ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE recipe_steps DROP CONSTRAINT IF EXISTS recipe_steps_recipe_id_fkey;
ALTER TABLE recipe_steps ADD CONSTRAINT recipe_steps_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE recipe_recipe_tags DROP CONSTRAINT IF EXISTS recipe_recipe_tags_recipe_id_fkey;
ALTER TABLE recipe_recipe_tags ADD CONSTRAINT recipe_recipe_tags_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id);

ALTER TABLE recipe_versions DROP CONSTRAINT IF EXISTS recipe_versions_recipe_id_fkey;
ALTER TABLE recipe_versions ADD CONSTRAINT recipe_versions_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id);
