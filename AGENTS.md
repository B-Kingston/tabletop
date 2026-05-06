# AGENTS.md — Development Constitution

All AI agents and human developers must follow this document. It is non-negotiable.

## Tech Stack

- **Frontend:** React 18+, TypeScript (strict), Vite, Tailwind CSS, shadcn/ui primitives, TanStack Query, TanStack Router, Zustand, Framer Motion
- **Backend:** Go 1.22+, Gin, GORM, PostgreSQL (NeonDB), Redis
- **Auth:** Clerk (magic code email verification)
- **External:** TMDB API, OpenAI API (server-side proxy with rate limiting)
- **Editor:** Plate (Slate-based rich text) for recipe editing, serialized to markdown

## Project Directory Map (LIVING DOCUMENT — KEEP UPDATED)

All agents MUST consult this map before creating, moving, or deleting files. If your work changes the directory structure (new packages, renamed folders, new top-level files), update this section immediately.

### Root Level

```
tabletop/
├── .env                          # Production env (gitignored)
├── .env.dev                      # Dev env (gitignored)
├── .env.dev.example              # Dev env template
├── .env.example                  # Production env template
├── .gitignore
├── AGENTS.md                     # This document
├── Makefile                      # Shortcuts: dev, test, build, lint, migrate-*
├── README.md
├── SETUP.md
├── PLAN.md
├── CLAUDE.md
├── package.json                  # Root workspace config (npm workspaces)
├── docker-compose.yml            # Postgres 16 + Redis 7
├── run.sh                        # Frontend Docker build → Nginx on :3000
├── dev.sh                        # Native backend + frontend, Docker infra only
├── backend.sh                    # Fly.io deploy / logs / secrets / migrate
├── docs/                         # Design specs and implementation plans
│   ├── mobile/
│   │   └── local-development.md   # Mobile local dev guide (iOS Simulator + Android Emulator)
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── backend/
├── frontend/
├── mobile/                       # Expo React Native mobile app
└── packages/
    └── shared/                   # @tabletop/shared — shared TypeScript types, query keys, utils
```

### Shared Package (`packages/shared/`)

```
packages/shared/
├── src/
│   ├── index.ts                  # Barrel export (types, queryKeys, utils)
│   ├── types/
│   │   ├── models.ts             # Domain model interfaces (User, Instance, Recipe, Wine, etc.)
│   │   ├── api.ts                # ApiResponse<T>, PaginatedResponse<T>
│   │   └── index.ts              # Re-exports
│   ├── queryKeys/
│   │   └── index.ts              # TanStack Query key factories for all domains
│   └── utils/
│       ├── formatters.ts         # formatCurrency, formatRating, formatDate, formatDuration, getMediaLabel
│       ├── validators.ts         # isValidInstanceName, isValidPassword, isValidRating, etc.
│       └── index.ts              # Re-exports
├── package.json                  # @tabletop/shared, type: module, tsc build
├── tsconfig.json                 # Strict, declaration: true, output to dist/
└── .gitignore
```

### Mobile (`mobile/`)

```
mobile/
├── app/
│   ├── _layout.tsx               # Root layout (SafeAreaProvider, StatusBar, Slot)
│   └── index.tsx                 # Placeholder home screen
├── src/
│   ├── lib/
│   │   └── api.ts                # Placeholder native API adapter (axios)
│   ├── stores/                   # Zustand stores (auth, instance, ui)
│   ├── hooks/                    # Custom data-fetching hooks
│   ├── components/               # React Native UI components
│   ├── features/                 # Feature modules
│   ├── navigation/               # Navigation config
│   ├── theme/                    # Theme tokens
│   └── test/
│       └── setup.ts              # React Native Testing Library setup
├── assets/                       # Expo assets (icon, splash, etc.)
├── app.json                      # Expo config
├── eas.json                      # EAS Build profiles
├── package.json                  # tabletop-mobile, depends on @tabletop/shared
├── tsconfig.json                 # Strict, path alias @/* → src/*
├── babel.config.js               # Expo preset + module-resolver
├── jest.config.js                # jest-expo preset
└── .gitignore
```

### Backend (`backend/`)

```
backend/
├── cmd/
│   └── api/
│       └── main.go               # Entry point: config → DB → migrations → DI → routes → server
├── internal/
│   ├── config/                   # Env loader + validation
│   ├── database/                 # GORM + Postgres/SQLite init, migration runner
│   ├── handlers/                 # HTTP handlers (by domain)
│   │   ├── ai/                   # OpenAI proxy handler
│   │   ├── auth/                 # Auth routes
│   │   ├── chat/                 # Chat session/message handlers
│   │   ├── instances/            # Instance CRUD + membership
│   │   ├── media/                # Media (TMDB-linked) handlers
│   │   ├── messages/             # Persisted realtime instance member chat handlers
│   │   ├── nights/               # Game-night handlers
│   │   ├── recipes/              # Recipe handlers
│   │   ├── tmdb/                 # TMDB proxy/search handlers
│   │   ├── webhooks/             # Clerk webhook handler (user sync)
│   │   └── wines/                # Wine handlers
│   ├── middleware/               # Auth, CORS, instance membership
│   ├── models/                   # GORM models (base, user, instance, media, night, recipe, chat, wine)
│   ├── redis/                    # go-redis client wrapper
│   ├── repositories/             # Data access layer (interfaces + implementations)
│   ├── services/                 # Business logic layer
│   ├── utils/                    # GORM scopes (e.g. instance_id filter)
│   └── websocket/                # Real-time hub, client, handler
├── migrations/                   # Goose SQL migrations + embed.go
├── tests/
│   └── integration/              # Cross-instance security tests
├── .air.toml                     # Air hot-reload config
├── Dockerfile                    # Multi-stage Go build → Alpine
├── fly.toml                      # Fly.io app config
├── go.mod
└── go.sum
```

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── App.tsx                   # Router provider
│   ├── main.tsx                  # React 18 root render
│   ├── router.tsx                # TanStack Router route tree
│   ├── index.css                 # Tailwind entry + global styles
│   ├── __tests__/                # Vitest setup + MSW handlers
│   ├── components/               # UI components (by domain)
│   │   ├── chat/
│   │   ├── layout/
│   │   ├── media/
│   │   ├── night/
│   │   ├── recipe/
│   │   ├── ui/                   # shadcn/ui-style primitives
│   │   └── wine/
│   ├── hooks/                    # Custom data-fetching hooks (by domain)
│   ├── lib/                      # API client, auth, query client, utils
│   ├── pages/                    # Route-level page components
│   ├── stores/                   # Zustand stores (auth, instance, ui)
│   └── types/                    # Shared TypeScript types / DTOs
├── .env.local                    # Vite local env (gitignored)
├── .env.example
├── Dockerfile                    # Multi-stage Node → Nginx
├── nginx.conf
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json                 # Strict, path alias `@/*` → `src/*`
└── vite.config.ts
```

### When to Update This Map

- Adding, removing, or renaming any top-level directory or file.
- Creating a new domain package in `backend/internal/handlers/`, `services/`, or `repositories/`.
- Adding a new component domain folder in `frontend/src/components/` or `hooks/`.
- Changing the purpose of any existing folder.

> **Rule:** If a new developer reading AGENTS.md would be misled by this map, update it before finishing your task.

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
5. **Run migration safety checks.** Use `make migrate-check` before review. This catches risky future migrations that need explicit approval comments.
6. **Review the migration in PR.** The `.sql` file must be reviewed just like Go code.
7. **Deploy.** The app runs `goose.Up` automatically at startup — migrations apply before the server accepts traffic.

### Rules

- **No schema change ships without a migration file.** If a PR touches GORM model tags that affect DDL, it must include a migration.
- **Down migrations must be reversible.** Every `Up` has a corresponding `Down` that restores the prior state.
- **Migrations are immutable after merge.** If a merged migration is wrong, create a *new* migration that fixes it. Never edit a migration that has already been deployed.
- **No raw SQL in handlers.** If you need a migration, write it in the migrations directory, not inline in a repository or handler.
- **GORM models and migrations must stay in sync.** The GORM model tags are documentation and query-building metadata, not the schema source of truth. The `.sql` file is the source of truth.

### Data Safety Guardrails

The app auto-runs pending Goose migrations on startup. Treat every migration as a production data operation, not as ordinary application code.

- **Back up before production migration.** Before deploying any migration that can rewrite, delete, or cascade-delete data, take a verified database backup or Neon restore point and record it in the PR/deploy notes.
- **Prefer expand-contract changes.** Add nullable columns/tables first, deploy code that dual-writes or backfills, verify data, then remove old columns in a later migration. Do not combine add/copy/drop steps in one migration unless the table is disposable.
- **Avoid destructive DDL by default.** `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, broad `DELETE`, lossy `ALTER COLUMN ... TYPE`, `DROP CONSTRAINT`, and new `ON DELETE CASCADE` rules require explicit human approval.
- **Required approval block for future destructive migrations.** Any migration after `00006` containing a risky statement must include all three comments near the top of the file:
  ```sql
  -- safety: destructive-change-approved
  -- safety: data-backup-required
  -- safety: rollback-reviewed
  ```
- **Cascades require extra scrutiny.** `ON DELETE CASCADE` is allowed only when deleting the parent should intentionally delete every child row. For optional references, prefer `ON DELETE SET NULL`.
- **Lossy type conversions require a data plan.** Date/time truncation, numeric precision changes, string length reductions, enum narrowing, or nullable-to-not-null changes need a backfill/validation query and a rollback story.
- **Never rely on `Down` as the only recovery path.** Down migrations that recreate dropped columns or tables do not restore the lost data. Recovery must come from backup, restore point, or a reversible expand-contract path.
- **Test migrations against Postgres.** SQLite `AutoMigrate` tests are useful for unit tests only; they do not validate production DDL semantics.

## Post-Work Build Evaluation (ENFORCED)

After any work is completed — whether a bug fix, feature, refactor, or dependency change — evaluate whether the frontend, backend, or both need to be rebuilt.

1. **Determine what changed:**
   - Frontend code (React, TypeScript, CSS, HTML, assets, package.json in `/frontend` or equivalent) → rebuild frontend.
   - Backend code (Go, migrations, configs in `/backend` or equivalent) → rebuild backend.
   - Shared types, API contracts, or root-level config → rebuild both.
2. **Run the appropriate build / deploy script(s):**
   - **Frontend** — Verify the production build compiles successfully **without starting a server** (servers block indefinitely and hang the terminal):
     - **Docker build only:** `docker build --no-cache -t tabletop-web frontend/` — verifies the full Vite → Nginx Docker build succeeds. Do **not** run `docker run` afterwards.
     - **Native build (faster):** `cd frontend && npm run build` — verifies Vite production build succeeds without Docker. Do **not** run `npm run dev` afterwards.
   - **Backend** — Build and deploy to Fly.io: `./backend.sh` (covers `fly deploy`, logs, secrets, and migrations).
   - **Full local dev (backend + frontend):** `./dev.sh` — starts Docker infra (Postgres, Redis), native backend with Air hot-reload, and Vite dev server. Use this only for **interactive local development and smoke-testing** inside a dedicated terminal. Do **not** run this from the AI toolchain (it blocks indefinitely).
3. **Verify the build succeeds before declaring the task complete.** A failing build or deploy is a blocking issue — fix it immediately. Do not skip verification because the change "seems small."

## Debugging Network Traces (.har Files)

When a user provides a `.har` file for debugging, **do not read the entire file into context**. These files are often tens of thousands of lines and will exhaust the context window.

**Always** use a Python script to perform targeted JSON analysis:

```python
import json
with open('localhost.har') as f:
    data = json.load(f)
entries = data['log']['entries']
# Filter, summarize, or extract specific requests
for e in entries:
    req, resp = e['request'], e['response']
    print(f"{req['method']} {req['url']} -> {resp['status']}")
```

This preserves context for code changes and produces precise, actionable findings.

## Local Browser Login Credentials

For in-app browser testing that requires signing in, use the local ignored credentials file at `.tabletop-browser-login.env`.

- This file is intentionally excluded via `.git/info/exclude`; do not commit it or copy its secret values into tracked files.
- Load `TABLETOP_BROWSER_LOGIN_EMAIL` and `TABLETOP_BROWSER_LOGIN_PASSWORD` from that file when a browser test needs an authenticated session.
- If the file is missing, ask the user for credentials rather than inventing test values.

## Data Decisions (Locked)

- **Wine cost:** Per bottle, stored as decimal (dollars.cents). Currency field default AUD.
- **Wine rating:** 0.0 – 5.0, decimal support (e.g., 4.7).
- **Recipe images:** URL only. No file uploads in v1.
- **Recipe content:** Plate editor in frontend, serialized to markdown for backend storage.
- **Offline:** Not supported in v1.
- **Notifications:** Not supported in v1.
- **Social:** Show `createdBy` on all items (name + avatar).
- **AI:** Server-side OpenAI proxy with per-user rate limiting. No BYOK.
