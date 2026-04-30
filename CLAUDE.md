# CLAUDE.md — AI Agent Reference

This document is for AI agents (Claude, etc.) working on this codebase. Follow it in addition to AGENTS.md.

## Database Migrations

Whenever you change anything that affects the database schema, you **must** create a Goose migration. Do not rely on GORM AutoMigrate in production.

### Trigger checklist — create a migration if you:

- [ ] Add a new field to any model in `backend/internal/models/`
- [ ] Remove a field from any model
- [ ] Change a field type, size, or nullability
- [ ] Add or remove a GORM `index` or `uniqueIndex` tag
- [ ] Add or remove a foreign key reference
- [ ] Create a new model (new table)
- [ ] Rename a model or table
- [ ] Change any `gorm:"..."` tag that affects DDL

### How to create a migration

```bash
cd /Users/bailee/Documents/Programming/tabletop
make migrate-create
# Enter a snake_case description, e.g. "add_recipe_cuisine_column"
```

This creates a numbered `.sql` file in `backend/migrations/`. Edit both blocks:

```sql
-- +goose Up
ALTER TABLE recipes ADD COLUMN cuisine VARCHAR(255);

-- +goose Down
ALTER TABLE recipes DROP COLUMN cuisine;
```

### Verify before finishing

1. Run `make migrate-up` with `DATABASE_URL` pointing to a local/test Postgres instance
2. Confirm the app still compiles: `cd backend && go build ./...`
3. Confirm tests pass: `cd backend && go test ./...`

### Rules

- Write the migration **before** writing the code that depends on the new schema.
- Every migration must have both `+goose Up` and `+goose Down`.
- Never edit a migration file after it has been merged to main.
- GORM models are for queries — the `.sql` migration is the schema source of truth.
