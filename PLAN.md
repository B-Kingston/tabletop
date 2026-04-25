# Tabletop — Implementation Plan

This document tracks what remains to build after the foundation commit (`82f5c73`).

---

## Current State

### Backend (29 Go source files)
- **Models:** All 11 models complete (User, Instance, InstanceMembership, MediaItem, Wine, Recipe, Ingredient, RecipeStep, RecipeTag, ChatSession, ChatMessage). All auto-migrated.
- **Repositories:** UserRepository and InstanceRepository complete with tests. **Missing:** Media, Wine, Recipe, Chat repositories.
- **Services:** InstanceService complete with tests. TMDBService and OpenAIService **exist but are not wired** into main.go (no handlers, no routes). **Missing:** Media, Wine, Recipe, Chat services.
- **Handlers:** AuthHandler (clerk-sync + /me) and InstanceHandler (CRUD + join/leave/members) complete. **Missing:** Media, Wine, Recipe, Chat, TMDB proxy, OpenAI proxy handlers.
- **Middleware:** CORS (complete), RequireAuth (**JWKS keyfunc returns nil — signature verification is a TODO**), RequireInstanceMembership (complete).
- **Utilities:** `utils/scopes.go` with `ForInstance` GORM scope — ready but unused by domain repos.
- **Infrastructure:** Config, Database (PostgreSQL + auto-migrate), Dockerfile — all complete.
- **NOT implemented:** Redis client, WebSocket, any domain handlers/routes.

### Frontend (11 source files — scaffold stage)
- **Config:** Vite, TypeScript (strict), Tailwind, PostCSS, Docker — all complete.
- **Auth:** ClerkProvider + AuthGate with sign-in/sign-out working.
- **API client:** Axios instance created, response interceptor dispatches `auth:unauthorized` event on 401. **Token injection is a TODO** (interceptor is empty).
- **State:** Zustand auth store exists but is unused (Clerk handles auth state directly).
- **Testing:** Vitest + RTL + jest-dom + MSW installed. Only 3 trivial tests exist.
- **NOT implemented:** TanStack Router (installed but unused), shadcn/ui, Plate editor, Radix primitives, any pages, any hooks, any types. Framer Motion and lucide-react are installed but unused.

### Known Bugs
1. **Auth middleware JWKS verification is bypassed** (`middleware/auth.go:50` returns `nil, nil`). Any structurally valid JWT passes — security vulnerability.
2. **Instance Create/List/Join handlers are broken** — they call `GetInternalUserID()` which requires `RequireInstanceMembership` middleware, but those routes don't use it. Always returns "user not identified".
3. **Repositories use concrete `*gorm.DB`** instead of interfaces — violates AGENTS.md DI requirement. Compounds with each new repo.

---

## Phase 0: Critical Bug Fixes (Prerequisite)

Goal: Fix blocking bugs before building new features on top.

### 0.1 Auth Middleware — JWKS Key Fetching
- [ ] Implement Clerk JWKS public key fetching in `middleware/auth.go`
- [ ] Cache JWKS keys with periodic refresh (Clerk rotates keys)
- [ ] Replace `return nil, nil` on line 50 with actual key resolution
- [ ] Test with valid and invalid tokens

### 0.2 Instance Handler — User ID Resolution
- [ ] Fix `Create`, `List`, `Join` handlers to resolve user ID from Clerk JWT claims (via `UserContext` set by `RequireAuth`) instead of calling `GetInternalUserID()` (which requires `RequireInstanceMembership` middleware)
- [ ] Add helper `GetUserIDFromAuth(c *gin.Context)` that reads `UserContext.ClerkID`, looks up internal user, returns UUID
- [ ] Test create instance, list instances, join instance flows end-to-end

### 0.3 Repository Interface Refactor
- [ ] Refactor `UserRepository` and `InstanceRepository` to accept interfaces instead of `*gorm.DB`
- [ ] All new repositories (Phase 1.2–1.5) must follow the interface pattern from the start

---

## Phase 1: Backend Core — Domain Handlers & Repositories

Goal: All CRUD endpoints for media, recipes, wines, and chat.

### 1.1 Redis Infrastructure
- [ ] Add `github.com/redis/go-redis/v9` to `go.mod`
- [ ] `backend/internal/redis/redis.go` — client wrapper with health check
- [ ] Wire Redis into `main.go` and config
- [ ] Update `docker-compose.yml` to ensure Redis is ready
- [ ] Redis will serve three purposes: rate limiting (1.7), TMDB caching (1.6), WebSocket pub/sub (1.8)

### 1.2 Media Module
- [ ] `backend/internal/repositories/media.go` — MediaRepository **interface** + GORM implementation (per AGENTS.md DI requirement)
- [ ] `backend/internal/services/media.go` — MediaService with TMDB integration
- [ ] `backend/internal/handlers/media/media.go` — HTTP handlers:
  - `POST /instances/:instance_id/media` — add from TMDB search result
  - `GET /instances/:instance_id/media` — list with filters (status, type)
  - `GET /instances/:instance_id/media/:media_id` — get detail
  - `PATCH /instances/:instance_id/media/:media_id` — update status, rating, review
  - `DELETE /instances/:instance_id/media/:media_id` — remove
- [ ] Use `utils.ForInstance` scope for all queries
- [ ] `backend/internal/handlers/media/media_test.go` — handler tests
- [ ] `backend/internal/services/media_test.go` — service tests

### 1.3 Recipe Module
- [ ] `backend/internal/repositories/recipe.go` — RecipeRepository **interface** (with ingredients, steps, tags) + GORM implementation
- [ ] `backend/internal/services/recipe.go` — RecipeService
- [ ] `backend/internal/handlers/recipes/recipes.go` — HTTP handlers:
  - `POST /instances/:instance_id/recipes` — create
  - `GET /instances/:instance_id/recipes` — list with tag filters
  - `GET /instances/:instance_id/recipes/:recipe_id` — get detail (preloads ingredients, steps, tags)
  - `PATCH /instances/:instance_id/recipes/:recipe_id` — update
  - `DELETE /instances/:instance_id/recipes/:recipe_id` — remove
- [ ] `backend/internal/handlers/recipes/recipes_test.go`
- [ ] `backend/internal/services/recipe_test.go`

### 1.4 Wine Module
- [ ] `backend/internal/repositories/wine.go` — WineRepository **interface** + GORM implementation
- [ ] `backend/internal/services/wine.go` — WineService
- [ ] `backend/internal/handlers/wines/wines.go` — HTTP handlers:
  - `POST /instances/:instance_id/wines`
  - `GET /instances/:instance_id/wines` — list with type filters
  - `GET /instances/:instance_id/wines/:wine_id`
  - `PATCH /instances/:instance_id/wines/:wine_id`
  - `DELETE /instances/:instance_id/wines/:wine_id`
- [ ] Tests for wine handler + service

### 1.5 Chat / AI Assistant Module
- [ ] `backend/internal/repositories/chat.go` — ChatSessionRepository + ChatMessageRepository **interfaces** + GORM implementations
- [ ] `backend/internal/services/chat.go` — ChatService (uses OpenAIService)
- [ ] `backend/internal/handlers/chat/chat.go` — HTTP handlers:
  - `POST /instances/:instance_id/chat/sessions` — create session
  - `GET /instances/:instance_id/chat/sessions` — list
  - `GET /instances/:instance_id/chat/sessions/:session_id` — get with messages
  - `POST /instances/:instance_id/chat/sessions/:session_id/messages` — send message, get AI response
  - `DELETE /instances/:instance_id/chat/sessions/:session_id` — delete
- [ ] `POST /instances/:instance_id/chat/generate-recipe` — special endpoint that calls OpenAI with RecipeSystemPrompt and returns structured recipe JSON
- [ ] Tests for chat handler + service

### 1.6 TMDB Proxy Endpoints
> **Note:** `services/tmdb.go` already implements SearchMulti, SearchMovies, SearchTV, and GetMovieDetails. Only handler wiring + caching + missing endpoint needed.

- [ ] Create TMDB handler to wire the existing TMDBService into routes
- [ ] `GET /instances/:instance_id/tmdb/search?q=...&page=...&type=...` — proxy search through backend
- [ ] `GET /instances/:instance_id/tmdb/movie/:tmdb_id` — get movie details
- [ ] `GET /instances/:instance_id/tmdb/tv/:tmdb_id` — get TV details (**missing: `GetTVDetails()` not implemented in existing service**)
- [ ] Add `GetTVDetails()` to `services/tmdb.go`
- [ ] Add Redis caching layer (1 hour TTL) for search and detail responses
- [ ] Instantiate TMDBService in `main.go` and inject into handler

### 1.7 OpenAI Proxy Endpoints
> **Note:** `services/openai.go` already implements ChatCompletion and ChatCompletionStream (SSE). Rate limiting is a stub (`CheckRateLimit` returns nil). Only handler wiring + Redis rate limiting needed.

- [ ] Implement `OpenAIService.CheckRateLimit` with Redis (key: `openai_rate:{userID}:{YYYY-MM-DD}`)
- [ ] Create OpenAI handler to wire the existing OpenAIService into routes
- [ ] `POST /instances/:instance_id/ai/chat` — chat completion with rate limiting
- [ ] `POST /instances/:instance_id/ai/chat/stream` — SSE streaming endpoint
- [ ] Daily limit: 20 requests per user (configurable)
- [ ] Instantiate OpenAIService in `main.go` and inject into handler
- [ ] Add tests for rate limiting logic

### 1.8 Clerk Webhook Handler
- [ ] `backend/internal/handlers/webhooks/clerk.go` — handle Clerk events:
  - `user.created` — create user in DB
  - `user.updated` — sync user profile
  - `user.deleted` — soft-delete or cleanup
- [ ] Verify webhook signature using `CLERK_WEBHOOK_SECRET` (already in config)
- [ ] Register route: `POST /v1/webhooks/clerk` (public, signature-verified)

### 1.9 WebSocket Foundation
- [ ] Add `github.com/gorilla/websocket` (or `nhooyr.io/websocket`) to `go.mod`
- [ ] `backend/internal/websocket/hub.go` — Hub managing client connections per instance
- [ ] `backend/internal/websocket/client.go` — Client read/write pumps
- [ ] `GET /ws/instances/:instance_id` — WebSocket upgrade endpoint (auth + membership check)
- [ ] Redis pub/sub integration for horizontal scaling
- [ ] Message types: `chat`, `presence`, `notification`

---

## Phase 2: Frontend Foundation — Routing, State, API

Goal: Functional navigation, auth flow, and typed API layer.

> **Note:** Many dependencies are already installed but unused: `@tanstack/react-router`, `@tanstack/router-devtools`, `framer-motion`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`. No install step needed — just start using them.

### 2.1 Router & Layout
- [ ] Set up TanStack Router with route tree (using already-installed package)
- [ ] Routes:
  - `/` — redirect to dashboard or login
  - `/login` — Clerk sign-in
  - `/dashboard` — instance list + create/join
  - `/instances/:instanceId` — instance shell (sidebar/tab nav)
  - `/instances/:instanceId/media` — media list
  - `/instances/:instanceId/media/:mediaId` — media detail
  - `/instances/:instanceId/recipes` — recipe list
  - `/instances/:instanceId/recipes/:recipeId` — recipe detail
  - `/instances/:instanceId/recipes/:recipeId/cook` — cooking view (fullscreen)
  - `/instances/:instanceId/recipes/new` — recipe create/edit
  - `/instances/:instanceId/wines` — wine list
  - `/instances/:instanceId/wines/:wineId` — wine detail
  - `/instances/:instanceId/chat` — AI assistant
- [ ] Nested layout under `/instances/:instanceId` with shared navigation

### 2.2 API Layer
- [ ] `frontend/src/types/api.ts` — shared API response types, pagination
- [ ] `frontend/src/types/models.ts` — TypeScript interfaces matching Go models (MediaItem, Recipe, Wine, ChatSession, etc.)
- [ ] `frontend/src/lib/auth.ts` — Clerk token integration: `getToken()` injected into axios interceptor (currently a TODO in `lib/api.ts`)
- [ ] `frontend/src/lib/queryClient.ts` — TanStack Query client config (already has provider in `main.tsx` with 5min staleTime, but no centralized config file)
- [ ] Handle `auth:unauthorized` event from axios response interceptor (currently dispatched but unhandled)

### 2.3 Custom Hooks (TanStack Query)
- [ ] `frontend/src/hooks/useAuth.ts` — Clerk session + token refresh
- [ ] `frontend/src/hooks/useInstances.ts` — list, create, join, leave mutations
- [ ] `frontend/src/hooks/useMedia.ts` — CRUD + search
- [ ] `frontend/src/hooks/useRecipes.ts` — CRUD
- [ ] `frontend/src/hooks/useWines.ts` — CRUD
- [ ] `frontend/src/hooks/useChat.ts` — sessions, messages, send message mutation
- [ ] `frontend/src/hooks/useTMDB.ts` — search, get details
- [ ] `frontend/src/hooks/useAI.ts` — generate recipe, chat stream

### 2.4 Global State (Zustand)
- [ ] `frontend/src/stores/instanceStore.ts` — current instance, member list, sidebar open/closed
- [ ] `frontend/src/stores/uiStore.ts` — theme, toasts, modals
- [ ] Clean up or repurpose existing unused `authStore.ts`

---

## Phase 3: Frontend Pages & Components

### 3.0 UI Foundation
- [ ] Initialize shadcn/ui (`npx shadcn-ui@latest init`) — `class-variance-authority`, `clsx`, `tailwind-merge` already installed
- [ ] Install Radix primitives via shadcn: Dialog, Dropdown, Tabs, Popover, Toast, Tooltip
- [ ] Install Plate editor for recipe editing (`@udecode/*` or `@plate/*` + `slate`, `slate-react`)

### 3.1 Auth & Onboarding
- [ ] `frontend/src/pages/Login.tsx` — Clerk SignIn component, redirect after auth
- [ ] `frontend/src/pages/Dashboard.tsx` — instance cards, create instance modal, join instance modal

### 3.2 Instance Shell
- [ ] `frontend/src/components/layout/InstanceLayout.tsx` — sidebar with instance nav (media, recipes, wines, chat), mobile drawer
- [ ] `frontend/src/components/layout/InstanceNav.tsx` — tab/sidebar links
- [ ] Instance context provider

### 3.3 Media Pages
- [ ] `frontend/src/pages/MediaList.tsx` — grid of media cards, status filter, type filter, search bar
- [ ] `frontend/src/components/media/MediaCard.tsx` — poster, title, status badge, rating
- [ ] `frontend/src/components/media/MediaSearchModal.tsx` — TMDB search with debounce, add-to-instance flow
- [ ] `frontend/src/pages/MediaDetail.tsx` — full info, edit status/rating/review

### 3.4 Recipe Pages (Hero Feature)
- [ ] `frontend/src/pages/RecipeList.tsx` — grid/list, tag filter, search
- [ ] `frontend/src/components/recipe/RecipeCard.tsx` — image, title, prep time, rating
- [ ] `frontend/src/pages/RecipeDetail.tsx` — ingredients list, steps, tags, edit button
- [ ] `frontend/src/pages/RecipeEdit.tsx` — Plate editor integration for description/steps, ingredient builder, tag selector
- [ ] `frontend/src/pages/CookingView.tsx` — **Priority:** full-screen, large text, step-by-step navigation, keep screen awake, timer support. (`.cook-view` CSS typography classes already prepared in `index.css`.)
- [ ] `frontend/src/components/recipe/IngredientList.tsx`
- [ ] `frontend/src/components/recipe/StepList.tsx`
- [ ] `frontend/src/components/recipe/RecipeGeneratorModal.tsx` — AI prompt input, streaming response preview, save to instance

### 3.5 Wine Pages
- [ ] `frontend/src/pages/WineList.tsx` — filter by type, sort by rating/date
- [ ] `frontend/src/components/wine/WineCard.tsx`
- [ ] `frontend/src/pages/WineDetail.tsx` — full journal entry, edit form

### 3.6 Chat / AI Assistant
- [ ] `frontend/src/pages/ChatPage.tsx` — session list sidebar, message thread, input
- [ ] `frontend/src/components/chat/ChatMessage.tsx` — user vs assistant bubbles
- [ ] `frontend/src/components/chat/ChatInput.tsx` — text area with submit
- [ ] `frontend/src/components/chat/RecipeSuggestionCard.tsx` — inline structured recipe preview in chat
- [ ] Streaming message support (SSE consumption)

### 3.7 Shared UI Components
- [ ] `frontend/src/components/ui/` — shadcn-style primitives: Button, Input, Dialog, Dropdown, Tabs, Skeleton, Toast
- [ ] `frontend/src/components/ui/ErrorBoundary.tsx`
- [ ] `frontend/src/components/ui/LoadingSkeleton.tsx` — skeletons for all list/card types
- [ ] `frontend/src/components/ui/ConfirmDialog.tsx`
- [ ] `frontend/src/components/ui/StarRating.tsx` — interactive 0.0–5.0 rating input

---

## Phase 4: Testing & Quality

### 4.1 Backend
- [ ] Table-driven tests for all new handlers, services, repositories
- [ ] Integration tests for cross-instance access (must return 403)
- [ ] Mock TMDB and OpenAI in tests (httptest)
- [ ] Add tests for existing TMDB service (currently has none)
- [ ] Add tests for existing OpenAI service (currently has none)
- [ ] Target: >70% coverage on business logic
- [ ] Add `make test` and `make test-coverage` to Makefile

### 4.2 Frontend
- [ ] Expand MSW setup in `frontend/src/__tests__/setup.ts` — add request handlers for all API routes (MSW already installed)
- [ ] Component tests for every page and major component
- [ ] Hook tests with `@testing-library/react-hooks` or component wrappers
- [ ] Target: all happy paths + error paths covered
- [ ] Add `npm run test:coverage` script

### 4.3 E2E / Integration
- [ ] `backend/tests/integration/` — full API integration tests with SQLite in-memory
- [ ] Test instance creation → joining → adding media → recipe generation flow

---

## Phase 5: DevOps & Deployment

- [ ] `.github/workflows/ci.yml` — run backend tests, frontend tests, lint, build on PR/push
- [ ] `backend/fly.toml` — Fly.io configuration
- [ ] `frontend/vercel.json` — Vercel configuration
- [ ] GitHub Action for Fly deploy on merge to main
- [ ] GitHub Action for Vercel deploy on merge to main
- [ ] Health check endpoint used in Fly.toml
- [ ] `.dockerignore` files for both modules

---

## Phase 6: Polish & Deferred Features (Post-MVP)

- [ ] Real-time updates via WebSocket (new items, chat messages)
- [ ] Presence indicators (who's online in instance)
- [ ] Push notifications (not in v1 per AGENTS.md)
- [ ] Offline support (not in v1)
- [ ] File uploads for recipe images (currently URL-only)
- [ ] Advanced recipe search (by ingredient, time)
- [ ] Wine cellar statistics / dashboards
- [ ] Media watchlist shared status
- [ ] Activity feed / audit log

---

## Immediate Next Steps (Suggested Order)

1. **Phase 0: Fix critical bugs** — JWKS key fetching, instance handler user ID resolution, repository interface refactor
2. **Backend repositories** for media, recipe, wine, chat (interfaces + GORM impl)
3. **Backend handlers** for media, recipe, wine (CRUD only — no AI yet)
4. **Wire existing TMDB + OpenAI services** into handlers/routes + Redis
5. **Frontend router + types + API wiring** (unblock page development)
6. **Frontend Dashboard + Instance pages** (auth flow end-to-end)
7. **Frontend Media pages + TMDB search** (first full feature vertical)
8. **Frontend Recipe pages + Cooking View** (hero feature)
9. **Backend chat + Frontend Chat page**
10. **WebSocket integration** for real-time chat
11. **Testing sweep** — backend coverage, frontend component tests, integration tests
12. **CI/CD + deployment config**
