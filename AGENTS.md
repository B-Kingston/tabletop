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

## Data Decisions (Locked)

- **Wine cost:** Per bottle, stored as decimal (dollars.cents). Currency field default AUD.
- **Wine rating:** 0.0 – 5.0, decimal support (e.g., 4.7).
- **Recipe images:** URL only. No file uploads in v1.
- **Recipe content:** Plate editor in frontend, serialized to markdown for backend storage.
- **Offline:** Not supported in v1.
- **Notifications:** Not supported in v1.
- **Social:** Show `createdBy` on all items (name + avatar).
- **AI:** Server-side OpenAI proxy with per-user rate limiting. No BYOK.
