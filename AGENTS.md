# AGENTS.md — Development Constitution

All AI agents and human developers must follow this document. It is non-negotiable.

## Tech Stack

- **Frontend:** React 18+, TypeScript (strict), Vite, Tailwind CSS, shadcn/ui primitives, TanStack Query, TanStack Router, Zustand, Framer Motion
- **Backend:** Go 1.22+, Gin, GORM, PostgreSQL (NeonDB), Redis
- **Auth:** Clerk (magic code email verification)
- **External:** TMDB API, OpenAI API (server-side proxy with rate limiting)
- **Editor:** Plate (Slate-based rich text) for recipe editing, serialized to markdown

## React Best Practices (ENFORCED)

1. **Composition over Inheritance** — Always prefer component composition. No class components.
2. **Custom Hooks** — Extract data fetching and logic into custom hooks. No data fetching in presentational components.
3. **Colocation** — Keep components, tests, and styles close together in the file tree.
4. **TypeScript Strict** — `strict: true` in tsconfig. No `any`. Use `unknown` with type guards.
5. **Performance** — Do NOT use `React.memo` unless profiling proves re-render is expensive.
6. **UX Perfection** — Every loading state must have a skeleton. Every error must have a boundary. Every mutation must have optimistic updates where possible. Use Framer Motion for page transitions (0.2-0.3s durations).
7. **Accessibility** — All interactive elements must be keyboard accessible. Use Radix primitives (via shadcn) for complex UI (dialogs, dropdowns, tabs).
8. **State Discipline** — Server state → TanStack Query. Client state → Zustand. URL state → TanStack Router. Never lift state unnecessarily.
9. **Testing** — Every component and hook must have a test using React Testing Library + Vitest. Mock API calls with MSW.
10. **Cooking View Priority** — This is the hero feature. It must be readable from 2 meters away, work in full-screen, keep screen awake, and have zero-clutter UI.

## Go Best Practices (ENFORCED)

1. **Layered Architecture** — Handler → Service → Repository. No DB calls in handlers. No HTTP in services.
2. **Dependency Injection** — Pass interfaces, not concrete types. Mock interfaces in tests.
3. **Context Propagation** — Always accept `context.Context` as first param. Respect cancellation and timeouts.
4. **Structured Logging** — Use `log/slog`. No `fmt.Println` anywhere in production code.
5. **Error Handling** — Wrap errors with context using `fmt.Errorf("...: %w", err)`. Return 500 only for unexpected errors; 400/403/404/409 for expected domain errors.
6. **Security** — EVERY database query MUST be scoped by `instance_id`. Use GORM scopes. Never trust user input. Validate all UUIDs before querying.
7. **Testing** — Table-driven tests for all services, repositories, and handlers. Use testify/assert. SQLite in-memory for unit tests. Aim for >70% coverage on business logic.
8. **API Design** — RESTful where possible. Consistent JSON envelope: `{ "data": T, "error": string | null }`. Use correct HTTP status codes.
9. **Rate Limiting** — The OpenAI proxy must have per-user daily limits. Redis counters.
10. **No Panics** — Never panic in request handlers. Always return errors.

## Multiplayer Security (NON-NEGOTIABLE)

- Every API route under `/instances/:instance_id/*` must verify instance membership via middleware.
- `instance_id` comes from URL params, NEVER from the request body.
- WebSocket connections must authenticate AND verify membership before joining an instance room.
- Instance join passwords stored with bcrypt (cost 12+).
- Audit fields (`created_by_id`, `updated_by_id`) must be populated on every create/update.
- Write integration tests that deliberately attempt cross-instance access and MUST receive HTTP 403.

## Design Philosophy

- **Beauty is a feature.** If it looks "good enough," it isn't. Polish animations, spacing, and typography.
- **Mobile-first.** The cooking view is used in kitchens — it must be flawless on tablets and phones.
- **Performance is UX.** Target <100ms API responses, <2s initial page load.
- **Testability first.** If code is hard to test, the design is wrong. Refactor until it's testable.

## Database Migrations (ENFORCED)

We use **Goose** for versioned SQL migrations. GORM `AutoMigrate` is deprecated for production schema changes — it is kept only for SQLite in-memory unit tests.

### When a migration is MANDATORY

Create a new `.sql` migration file **before any code that depends on the new schema ships** when you:

- Add, drop, or rename a column
- Add, drop, or rename a table
- Add or remove an index
- Add or modify a constraint (UNIQUE, CHECK, FK)
- Change a column type or default value
- Add a new enum value that requires DB-level enforcement
- Any DDL change that the existing schema does not satisfy

### Workflow

1. **Write the migration first.** Never let application code reference columns/tables that do not exist yet.
2. **Create the file:**
   ```bash
   make migrate-create
   # Enter descriptive name, e.g. "add_wine_vineyard_column"
   ```
3. **Edit the generated `.sql` file.** Both `+goose Up` and `+goose Down` blocks must be present:
   ```sql
   -- +goose Up
   ALTER TABLE wines ADD COLUMN vineyard VARCHAR(255);

   -- +goose Down
   ALTER TABLE wines DROP COLUMN vineyard;
   ```
4. **Test locally against a real PostgreSQL database.** SQLite is not a substitute for Postgres DDL validation. Use `make migrate-up` with your local `DATABASE_URL`.
5. **Review the migration in PR.** The `.sql` file must be reviewed just like Go code.
6. **Deploy.** The app runs `goose.Up` automatically at startup — migrations apply before the server accepts traffic.

### Rules

- **No schema change ships without a migration file.** If a PR touches GORM model tags that affect DDL, it must include a migration.
- **Down migrations must be reversible.** Every `Up` has a corresponding `Down` that restores the prior state.
- **Migrations are immutable after merge.** If a merged migration is wrong, create a *new* migration that fixes it. Never edit a migration that has already been deployed.
- **No raw SQL in handlers.** If you need a migration, write it in the migrations directory, not inline in a repository or handler.
- **GORM models and migrations must stay in sync.** The GORM model tags are documentation and query-building metadata, not the schema source of truth. The `.sql` file is the source of truth.

## Data Decisions (Locked)

- **Wine cost:** Per bottle, stored as decimal (dollars.cents). Currency field default AUD.
- **Wine rating:** 0.0 – 5.0, decimal support (e.g., 4.7).
- **Recipe images:** URL only. No file uploads in v1.
- **Recipe content:** Plate editor in frontend, serialized to markdown for backend storage.
- **Offline:** Not supported in v1.
- **Notifications:** Not supported in v1.
- **Social:** Show `createdBy` on all items (name + avatar).
- **AI:** Server-side OpenAI proxy with per-user rate limiting. No BYOK.
