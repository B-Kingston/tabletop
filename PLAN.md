# Tabletop — Implementation Plan

This document tracks what remains to build after the foundation commit (`82f5c73`).

---

## Current State

**Backend:** Go API with Gin, GORM, Clerk JWT auth, instance management (CRUD + join/leave), TMDB service, OpenAI service, and layered architecture.
**Frontend:** React 18 + Vite + Tailwind scaffold with Clerk, basic AppShell/AuthGate, axios API client, and Zustand auth store.

---

## Phase 1: Backend Core — Domain Handlers & Repositories

Goal: All CRUD endpoints for media, recipes, wines, and chat.

### 1.1 Redis Infrastructure
- [ ] `backend/internal/redis/redis.go` — client wrapper with health check
- [ ] Wire Redis into `main.go` and config
- [ ] Update `docker-compose.yml` to ensure Redis is ready

### 1.2 Media Module
- [ ] `backend/internal/repositories/media.go` — MediaRepository interface + GORM impl
- [ ] `backend/internal/services/media.go` — MediaService with TMDB integration
- [ ] `backend/internal/handlers/media/media.go` — HTTP handlers:
  - `POST /instances/:instance_id/media` — add from TMDB search result
  - `GET /instances/:instance_id/media` — list with filters (status, type)
  - `GET /instances/:instance_id/media/:media_id` — get detail
  - `PATCH /instances/:instance_id/media/:media_id` — update status, rating, review
  - `DELETE /instances/:instance_id/media/:media_id` — remove
- [ ] `backend/internal/handlers/media/media_test.go` — handler tests
- [ ] `backend/internal/services/media_test.go` — service tests

### 1.3 Recipe Module
- [ ] `backend/internal/repositories/recipe.go` — RecipeRepository (with ingredients, steps, tags)
- [ ] `backend/internal/services/recipe.go` — RecipeService
- [ ] `backend/internal/handlers/recipes/recipes.go` — HTTP handlers:
  - `POST /instances/:instance_id/recipes` — create
  - `GET /instances/:instance_id/recipes` — list with tag filters
  - `GET /instances/:instance_id/recipes/:recipe_id` — get detail
  - `PATCH /instances/:instance_id/recipes/:recipe_id` — update
  - `DELETE /instances/:instance_id/recipes/:recipe_id` — remove
- [ ] `backend/internal/handlers/recipes/recipes_test.go`
- [ ] `backend/internal/services/recipe_test.go`

### 1.4 Wine Module
- [ ] `backend/internal/repositories/wine.go` — WineRepository
- [ ] `backend/internal/services/wine.go` — WineService
- [ ] `backend/internal/handlers/wines/wines.go` — HTTP handlers:
  - `POST /instances/:instance_id/wines`
  - `GET /instances/:instance_id/wines` — list with type filters
  - `GET /instances/:instance_id/wines/:wine_id`
  - `PATCH /instances/:instance_id/wines/:wine_id`
  - `DELETE /instances/:instance_id/wines/:wine_id`
- [ ] Tests for wine handler + service

### 1.5 Chat / AI Assistant Module
- [ ] `backend/internal/repositories/chat.go` — ChatSessionRepository + ChatMessageRepository
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
- [ ] `GET /instances/:instance_id/tmdb/search?q=...&page=...&type=...` — proxy search through backend
- [ ] `GET /instances/:instance_id/tmdb/movie/:tmdb_id` — get movie details
- [ ] Wire TMDBService into handler, add caching layer (Redis, 1 hour)

### 1.7 OpenAI Proxy Endpoints
- [ ] Implement `OpenAIService.CheckRateLimit` with Redis (key: `openai_rate:{userID}:{YYYY-MM-DD}`)
- [ ] `POST /instances/:instance_id/ai/chat` — chat completion with rate limiting
- [ ] `POST /instances/:instance_id/ai/chat/stream` — SSE streaming endpoint
- [ ] Daily limit: 20 requests per user (configurable)

### 1.8 WebSocket Foundation
- [ ] `backend/internal/websocket/hub.go` — Hub managing client connections per instance
- [ ] `backend/internal/websocket/client.go` — Client read/write pumps
- [ ] `GET /ws/instances/:instance_id` — WebSocket upgrade endpoint (auth + membership check)
- [ ] Redis pub/sub integration for horizontal scaling
- [ ] Message types: `chat`, `presence`, `notification`

---

## Phase 2: Frontend Foundation — Routing, State, API

Goal: Functional navigation, auth flow, and typed API layer.

### 2.1 Router & Layout
- [ ] Set up TanStack Router with route tree
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
- [ ] `frontend/src/lib/auth.ts` — Clerk token integration: `getToken()` injected into axios interceptor
- [ ] `frontend/src/lib/queryClient.ts` — TanStack Query client with default staleTime, error handling

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

---

## Phase 3: Frontend Pages & Components

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
- [ ] `frontend/src/pages/CookingView.tsx` — **Priority:** full-screen, large text, step-by-step navigation, keep screen awake, timer support
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
- [ ] Target: >70% coverage on business logic
- [ ] Add `make test` and `make test-coverage` to Makefile

### 4.2 Frontend
- [ ] MSW setup in `frontend/src/__tests__/setup.ts` — mock all API routes
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

1. **Backend repositories** for media, recipe, wine, chat (interfaces + GORM impl)
2. **Backend handlers** for media, recipe, wine (CRUD only — no AI yet)
3. **Frontend router + types + API wiring** (unblock page development)
4. **Frontend Dashboard + Instance pages** (auth flow end-to-end)
5. **Frontend Media pages + TMDB search** (first full feature vertical)
6. **Backend OpenAI proxy + recipe generation endpoint**
7. **Frontend Recipe pages + Cooking View** (hero feature)
8. **Backend chat + Frontend Chat page**
9. **WebSocket integration** for real-time chat
10. **Testing sweep** — backend coverage, frontend component tests, integration tests
11. **CI/CD + deployment config**
