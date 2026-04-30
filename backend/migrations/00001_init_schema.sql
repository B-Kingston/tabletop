-- +goose Up
-- goose migration: init schema (generated from GORM model definitions)

-- Users table (synced from Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    clerk_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_users_clerk_id UNIQUE (clerk_id),
    CONSTRAINT uniq_users_email UNIQUE (email)
);

-- Instances table (shared workspaces)
CREATE TABLE instances (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    join_password VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Instance memberships (many-to-many with role)
CREATE TABLE instance_memberships (
    user_id UUID NOT NULL REFERENCES users(id),
    instance_id UUID NOT NULL REFERENCES instances(id),
    role VARCHAR(255) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, instance_id)
);

-- Media items (movies / TV shows tracked per instance)
CREATE TABLE media_items (
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES instances(id),
    tmdb_id INTEGER NOT NULL,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    overview TEXT,
    poster_path VARCHAR(255),
    release_date TIMESTAMPTZ,
    status VARCHAR(255) NOT NULL DEFAULT 'planning',
    rating REAL,
    review TEXT,
    created_by_id UUID NOT NULL REFERENCES users(id),
    updated_by_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_media_items_instance_id ON media_items(instance_id);

-- Wines table
CREATE TABLE wines (
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES instances(id),
    name VARCHAR(255) NOT NULL,
    producer VARCHAR(255),
    type VARCHAR(255) NOT NULL,
    vintage INTEGER,
    cost DOUBLE PRECISION,
    currency VARCHAR(255) NOT NULL DEFAULT 'AUD',
    rating REAL,
    notes TEXT,
    consumed_at TIMESTAMPTZ,
    created_by_id UUID NOT NULL REFERENCES users(id),
    updated_by_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wines_instance_id ON wines(instance_id);

-- Recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES instances(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_url VARCHAR(255),
    prep_time INTEGER NOT NULL DEFAULT 0,
    cook_time INTEGER NOT NULL DEFAULT 0,
    servings INTEGER NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    rating REAL,
    review TEXT,
    created_by_id UUID NOT NULL REFERENCES users(id),
    updated_by_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recipes_instance_id ON recipes(instance_id);

-- Ingredients (belongs to recipe)
CREATE TABLE ingredients (
    id UUID PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(255),
    unit VARCHAR(255),
    optional BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);

-- Recipe steps (ordered instructions, belongs to recipe)
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    order_index INTEGER NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    duration_min INTEGER
);
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);

-- Recipe tags (categorization labels)
CREATE TABLE recipe_tags (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT uniq_recipe_tags_name UNIQUE (name)
);

-- Recipe <-> RecipeTag many-to-many join table
CREATE TABLE recipe_recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    recipe_tag_id UUID NOT NULL REFERENCES recipe_tags(id),
    PRIMARY KEY (recipe_id, recipe_tag_id)
);

-- Chat sessions (AI conversations per instance)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES instances(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_sessions_instance_id ON chat_sessions(instance_id);

-- Chat messages (individual turns in a session)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES chat_sessions(id),
    role VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- +goose Down
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS recipe_recipe_tags CASCADE;
DROP TABLE IF EXISTS recipe_tags CASCADE;
DROP TABLE IF EXISTS recipe_steps CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS wines CASCADE;
DROP TABLE IF EXISTS media_items CASCADE;
DROP TABLE IF EXISTS instance_memberships CASCADE;
DROP TABLE IF EXISTS instances CASCADE;
DROP TABLE IF EXISTS users CASCADE;
