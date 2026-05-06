# React Native Mobile Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an iOS and Android React Native client for Tabletop that reaches full functional parity with the current web app while using the existing Go API, Clerk authentication, instance security model, and domain contracts.

**Architecture:** Add an Expo React Native app beside the existing web client and introduce a small shared TypeScript package for API contracts, domain types, query keys, and platform-neutral helpers. Keep the native UI separate from the web UI because the current web app depends on browser-specific libraries such as TanStack Router, shadcn/Radix primitives, Tailwind CSS, Framer Motion DOM animations, and Plate.

**Tech Stack:** Expo, React Native, TypeScript strict, Clerk Expo/React Native SDK, TanStack Query, Zustand, Expo Router or React Navigation, React Native Testing Library, MSW or API-level test mocks, EAS Build, existing Go/Gin backend, existing PostgreSQL/Redis services.

---

## Executive Summary

The mobile client is highly feasible because the backend is already API-first, instance-scoped, and token-authenticated. Most domain behavior is exposed through REST endpoints under `/v1`, and the web app already isolates much server state behind TanStack Query hooks. The main work is not backend invention; it is rebuilding the client shell, navigation, native UI, mobile auth, and platform-specific flows.

The safest path is staged parity:

1. Establish the mobile foundation and shared contracts.
2. Ship a narrow, useful MVP around login, groups, recipes, and cooking view.
3. Add the remaining CRUD domains: media, wines, and nights.
4. Add interactive and external-service features: TMDB search, spin animation, member chat, AI chat, and recipe generation.
5. Harden with native quality gates: accessibility, offline-tolerant cache behavior, push-safe backgrounding, release builds, and app store readiness.

The cooking view should be treated as the mobile hero feature. It maps naturally to phones and tablets: full-screen reading, keep-awake, timers, large tap targets, and low-clutter step navigation.

## Current Web App Feature Inventory

### Authentication and User Sync

Current web behavior:

- Clerk sign-in and sign-out.
- Development auth bypass through `VITE_DEV_SKIP_AUTH`.
- Bearer token injection into Axios requests.
- One retry on 401 when a fresh token is available.
- Clerk user sync through `POST /v1/auth/clerk-sync`.
- Unauthorized event handling in the browser.

Mobile parity:

- Clerk native sign-in/sign-out.
- Secure token retrieval through Clerk's native session.
- API client token injection.
- 401 handling that routes the user to the signed-out stack.
- User sync after successful sign-in.
- Development-mode auth strategy for simulators and local devices.

### Groups / Instances

Current web behavior:

- List user's groups.
- Create a group with name and password.
- Join a group by ID and password.
- Leave a group.
- Navigate into an instance-scoped app shell.
- Show owner/member metadata.

Mobile parity:

- Authenticated home screen with group list.
- Create group modal/screen.
- Join group modal/screen.
- Group detail context persisted in Zustand.
- Instance-scoped tab or drawer navigation.
- Membership errors surfaced as 403 states.

### Media

Current web behavior:

- List media items.
- Filter by status and type.
- Search TMDB through backend proxy.
- Add movie or TV item from TMDB result.
- View media details.
- Update status, rating, review, and planned watch date.
- Delete media.
- Show poster images and creator metadata.

Mobile parity:

- Native media list with filter controls.
- TMDB search flow optimized for mobile.
- Add from search result.
- Detail screen with poster, overview, status, rating, review, and dates.
- Edit/update actions.
- Delete confirmation.
- Image loading fallbacks for missing poster paths.

### Recipes

Current web behavior:

- List recipes, optionally filtered by tag.
- View recipe detail.
- Create recipe.
- Edit recipe.
- Delete recipe.
- Ingredients and steps.
- Tags.
- Ratings/reviews.
- Recipe image URL.
- AI recipe generation modal.
- Cooking view with wake lock, large text, step navigation, ingredients, and timers.

Mobile parity:

- Recipe list with tag/filter handling.
- Recipe detail screen.
- Create/edit form for metadata, ingredients, steps, tags, image URL, rating, and review.
- Delete confirmation.
- AI recipe generation.
- Full-screen cooking view with keep-awake, step navigation, timers, progress indicators, and tablet-friendly layout.

Important native decision:

- Do not attempt to port Plate directly. The current backend stores structured ingredients/steps and markdown-like content well enough for a native form-first editor. A WebView-based rich editor can be deferred unless mobile users truly need full rich-text editing.

### Wines

Current web behavior:

- List wines.
- Filter by type.
- View wine detail.
- Create wine.
- Edit wine.
- Delete wine.
- Track type, per-bottle cost, rating, notes, consumed date, and creator.

Mobile parity:

- Wine list with type filter.
- Detail screen.
- Create/edit form.
- Numeric currency and decimal rating inputs.
- Consumed date picker.
- Delete confirmation.

### Nights

Current web behavior:

- List nights.
- Create night manually.
- Edit night.
- View night detail with linked wine, recipe, and media.
- Delete night.
- Optimistic create/update/delete.
- Spin the Night randomizer with selectable categories, slot-machine animation, generated night name, and save.

Mobile parity:

- Nights list.
- Night detail screen with linked domain cards.
- Create/edit flow with searchable selectors for wine, recipe, and media.
- Optimistic mutations.
- Spin flow with reduced-motion support, haptics where appropriate, selectable categories, random selection, generated name, and save.

### AI Assistant and Recipe Generation

Current web behavior:

- Instance-scoped AI chat via `/instances/:instanceId/ai/chat`.
- Persisted chat sessions via `/instances/:instanceId/chat/sessions`.
- Chat messages per session.
- Delete chat sessions.
- Generate recipe via `/instances/:instanceId/chat/generate-recipe`.
- Backend rate limiting is server-side.

Mobile parity:

- AI assistant screen.
- Chat session list.
- Chat session detail.
- Send message.
- Delete session.
- Recipe generation entry point from recipes.
- Clear rate-limit and failure states.

### Member Messages

Current web behavior:

- Fetch instance member messages.
- Send a member message.
- Append message into TanStack Query cache.
- Backend has websocket support for realtime instance rooms.

Mobile parity:

- Instance chat screen.
- Message list.
- Send message.
- Realtime updates if the current backend websocket route is production-ready for mobile; otherwise polling can ship first and websocket can follow.
- Authenticated websocket connection that verifies instance membership before joining a room.

### Shared UX Requirements

Current web behavior:

- Loading skeletons.
- Error boundaries/errors.
- Confirm dialogs.
- Optimistic mutations where already implemented.
- Reduced-motion hook.
- Accessible keyboard interactions on web.

Mobile parity:

- Skeleton/loading placeholders.
- Error states with retry actions.
- Native confirmation dialogs or custom confirmation sheets.
- Optimistic mutations where useful.
- Reduced-motion support through platform accessibility APIs.
- Screen-reader labels, focus order, large touch targets, and dynamic type considerations.

## Target Repository Shape

Add only the directories needed for a native client and shared contracts.

```text
tabletop/
├── backend/
├── frontend/
├── mobile/
│   ├── app/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── navigation/
│   │   ├── stores/
│   │   ├── test/
│   │   └── theme/
│   ├── app.json
│   ├── babel.config.js
│   ├── eas.json
│   ├── package.json
│   └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── api/
│       │   ├── queryKeys/
│       │   ├── types/
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
└── docs/
```

Update `AGENTS.md` when the new top-level `mobile/` and `packages/` directories are created.

## Platform and Library Decisions

### Recommended Choices

- Use Expo for fastest iOS/Android iteration, device testing, and EAS releases.
- Use Expo Router if file-based routing is preferred; use React Navigation if explicit route objects feel closer to the existing web route map. Either is feasible.
- Use TanStack Query for server state because it already matches the web architecture.
- Use Zustand for local UI/session state because it works on React Native.
- Use Clerk's Expo/native package for auth.
- Use `expo-secure-store` for any persistent non-Clerk secrets or user preferences.
- Use `expo-keep-awake` for cooking view.
- Use `expo-haptics` for spin/timer/native tactile feedback.
- Use `expo-image` for resilient image loading and caching.
- Use React Native Testing Library for component tests.

### Avoid in Mobile v1

- Avoid trying to reuse shadcn/Radix components. Build native primitives instead.
- Avoid a WebView shell around the Vite app. It will produce a weaker kitchen/tablet experience and make auth, navigation, keyboard, and app store quality harder.
- Avoid full rich-text editing parity with Plate in the first release. Use structured native forms for recipes and step content.
- Avoid offline writes in the first release. Cache reads can be retained by TanStack Query, but conflict resolution is out of scope unless deliberately designed.

## Shared Package Plan

The shared package should stay small. Its job is to remove duplication without dragging web assumptions into mobile.

### Include

- Domain model types currently in `frontend/src/types/models.ts`.
- API envelope types currently in `frontend/src/types/api.ts`.
- Platform-neutral request/response DTOs.
- Query key factories such as `recipesKeys.list(instanceId, tag)`.
- Pure formatting helpers: currency, dates, ratings, duration labels.
- Pure validation helpers for user-entered forms.

### Exclude

- React hooks that depend on Axios instance wiring until the platform adapters exist.
- Clerk imports.
- Router imports.
- DOM APIs such as `window`, `navigator`, `URLSearchParams` if a mobile-safe alternative is not wrapped.
- UI components.

### Adapter Boundary

Use a platform-specific API adapter:

```text
packages/shared/src/api/contracts.ts
frontend/src/lib/api.ts       # browser Axios adapter
mobile/src/lib/api.ts         # native Axios/fetch adapter
```

This allows web to keep `window.dispatchEvent` style handling while mobile routes unauthorized responses through navigation/auth state.

## Staged Delivery Plan

## Stage 0: Product Scope, Parity Matrix, and Technical Spike

**Goal:** Lock the mobile strategy before writing production code.

**Deliverables:**

- Confirm the mobile client is native React Native, not WebView.
- Confirm Expo managed workflow unless a specific native dependency forces prebuild.
- Confirm MVP release scope.
- Create a parity matrix from current web routes and hooks.
- Test Clerk sign-in on simulator/device against the existing backend.
- Test API access from simulator/device to local and deployed backend.

**Tasks:**

- [ ] Document the exact web feature inventory in `docs/mobile/parity-matrix.md`.
- [ ] Decide on Expo Router vs React Navigation.
- [ ] Decide local development URL strategy for iOS simulator, Android emulator, and physical devices.
- [ ] Verify Clerk Expo SDK can obtain a backend-compatible JWT.
- [ ] Verify `POST /v1/auth/clerk-sync` succeeds from a mobile spike.
- [ ] Verify instance-scoped requests receive 401, 403, and success responses as expected.
- [ ] Define release stages: internal dev build, TestFlight, Google Play internal testing, production.

**Acceptance gate:**

- A throwaway spike can sign in, sync the user, list instances, and show expected auth errors.

## Stage 1: Monorepo and Shared Contract Foundation

**Goal:** Add the structural foundation for a mobile app without changing web behavior.

**Deliverables:**

- `mobile/` Expo app scaffold.
- `packages/shared/` package.
- Workspace package manager configuration if needed.
- Shared TypeScript types migrated or copied from the web app.
- Mobile lint/typecheck/test scripts.
- Updated `AGENTS.md` directory map.

**Tasks:**

- [ ] Create `mobile/` with Expo, React Native, TypeScript strict, test setup, and environment handling.
- [ ] Create `packages/shared/` with buildable TypeScript exports.
- [ ] Move or duplicate model/API types into `packages/shared/src/types`.
- [ ] Update web imports only if the change is low-risk; otherwise defer web migration until mobile is stable.
- [ ] Add query key factories in shared package.
- [ ] Add pure formatters for price, ratings, durations, dates, and media labels.
- [ ] Add pure validation helpers for group, wine, recipe, media, and night forms.
- [ ] Add tests for shared helpers.
- [ ] Add root scripts for mobile typecheck/test if the repo adopts workspaces.
- [ ] Update `AGENTS.md` to include `mobile/` and `packages/`.

**Acceptance gate:**

- `mobile` app boots to a placeholder screen.
- Shared package typechecks.
- Existing frontend build still passes.
- Existing backend tests are unaffected.

## Stage 2: Mobile App Shell, Theme, and Navigation

**Goal:** Build the native frame all later features live inside.

**Deliverables:**

- App providers.
- Navigation tree.
- Native design primitives.
- Loading, empty, error, and confirmation patterns.
- Basic accessibility conventions.

**Tasks:**

- [ ] Add `QueryClientProvider`.
- [ ] Add Clerk provider.
- [ ] Add native auth state bridge.
- [ ] Add Zustand stores for current instance and app UI state.
- [ ] Add root signed-out and signed-in navigation stacks.
- [ ] Add instance-scoped navigation with tabs or drawer entries for Media, Recipes, Wines, Nights, Chat, and AI.
- [ ] Build native primitives: Button, IconButton, TextField, Select/Picker, RatingInput, CurrencyInput, DateInput, Dialog/Sheet, Skeleton, ErrorState, EmptyState, Card, Screen.
- [ ] Implement reduced-motion detection.
- [ ] Implement global error fallback screen.
- [ ] Add component tests for primitives.

**Acceptance gate:**

- User can move through placeholder screens for every web route equivalent.
- Every placeholder screen has a header, loading state pattern, and error state pattern.
- Navigation works on iOS and Android simulators.

## Stage 3: Authentication and Groups MVP

**Goal:** Make the mobile app usable by real users and connect it to instance-scoped data.

**Deliverables:**

- Sign-in/sign-out.
- Clerk user sync.
- Group list.
- Create group.
- Join group.
- Leave group.
- Instance selection and persistence.

**Tasks:**

- [ ] Implement Clerk sign-in screen.
- [ ] Implement sign-out from account/settings area.
- [ ] Implement mobile API client with token injection.
- [ ] Implement 401 handling that clears app session and shows the auth stack.
- [ ] Implement `useCurrentUserSync` using `/auth/clerk-sync`.
- [ ] Implement `useInstances`, `useCreateInstance`, `useJoinInstance`, and `useLeaveInstance` in mobile.
- [ ] Build group list screen.
- [ ] Build create group flow with name/password validation.
- [ ] Build join group flow with instance ID/password validation.
- [ ] Build leave group confirmation.
- [ ] Persist last selected instance ID.
- [ ] Add tests for auth state routing, group list loading/error/empty states, create/join validation, and leave confirmation.

**Acceptance gate:**

- A signed-in user can create, join, open, and leave a group from mobile.
- A user cannot access an instance they do not belong to.
- Auth failures are recoverable without force-closing the app.

## Stage 4: Recipes and Cooking MVP

**Goal:** Ship the first high-value mobile experience around recipes and cooking.

**Deliverables:**

- Recipe list.
- Recipe detail.
- Create/edit/delete recipe.
- Ingredients, steps, tags, rating, review, image URL.
- Full-screen cooking mode.

**Tasks:**

- [ ] Implement recipe query and mutation hooks.
- [ ] Build recipe list with tag filtering.
- [ ] Build recipe card with title, description, image, timing, rating, and creator.
- [ ] Build recipe detail screen with ingredients and ordered steps.
- [ ] Build recipe create/edit form with repeatable ingredients.
- [ ] Build repeatable step editor with order, title, content, and optional duration.
- [ ] Build tag editor.
- [ ] Build image URL field with preview and failure fallback.
- [ ] Build rating/review controls.
- [ ] Build delete confirmation.
- [ ] Implement optimistic or immediate cache invalidation behavior matching mutation risk.
- [ ] Build full-screen cooking view with step paging.
- [ ] Add `expo-keep-awake` while cooking view is active.
- [ ] Add timer start/pause/resume/reset per timed step.
- [ ] Add visible progress indicator.
- [ ] Add ingredients panel on first step or as an always-available sheet.
- [ ] Add tablet layout with larger type and two-column ingredients/step treatment where space allows.
- [ ] Add tests for list, detail, form validation, mutation success/error, delete, timer behavior, and cooking step navigation.

**Acceptance gate:**

- A cook can open a recipe on phone or tablet from 2 meters away, keep the screen awake, step through instructions, and use timers.
- Recipe CRUD works end to end against the existing backend.

## Stage 5: Wines

**Goal:** Reach mobile parity for wine tracking.

**Deliverables:**

- Wine list.
- Type filter.
- Wine detail.
- Create/edit/delete.
- Rating, cost, notes, consumed date.

**Tasks:**

- [ ] Implement wine query and mutation hooks.
- [ ] Build wine list with type segmented control.
- [ ] Build wine card with name, type, cost, rating, consumed status, and creator.
- [ ] Build wine detail screen.
- [ ] Build create/edit form.
- [ ] Add decimal-safe cost input with AUD default display.
- [ ] Add 0.0-5.0 rating input.
- [ ] Add consumed date picker.
- [ ] Add delete confirmation.
- [ ] Add tests for filters, form validation, decimal values, date handling, and mutation states.

**Acceptance gate:**

- Wine CRUD works end to end.
- Cost and rating preserve decimal values correctly.

## Stage 6: Media and TMDB

**Goal:** Reach mobile parity for movie/TV tracking and TMDB search.

**Deliverables:**

- Media list.
- Status/type filtering.
- TMDB search.
- Add movie/TV from TMDB.
- Media detail.
- Update status, rating, review, planned watch date.
- Delete.

**Tasks:**

- [ ] Implement media query and mutation hooks.
- [ ] Implement TMDB search and detail hooks.
- [ ] Build media list with status and type controls.
- [ ] Build media cards with poster, title, type, status, rating, and creator.
- [ ] Build TMDB search screen or sheet with debounced search.
- [ ] Add movie/TV result normalization.
- [ ] Build add-from-result action.
- [ ] Build media detail screen.
- [ ] Build status picker.
- [ ] Build planned watch date picker.
- [ ] Build rating/review controls.
- [ ] Build delete confirmation.
- [ ] Add poster image fallbacks and loading placeholders.
- [ ] Add tests for search, filters, add flow, status updates, date updates, delete, and empty poster behavior.

**Acceptance gate:**

- A user can search TMDB, add a result, edit tracking fields, and delete the item on iOS and Android.

## Stage 7: Nights and Manual Planning

**Goal:** Reach mobile parity for saved game/movie/dinner nights.

**Deliverables:**

- Night list.
- Night detail.
- Manual create/edit/delete.
- Linked wine, recipe, and media selectors.
- Optimistic create/update/delete.

**Tasks:**

- [ ] Implement night query and mutation hooks with optimistic behavior matching the web app.
- [ ] Build night list.
- [ ] Build night card showing linked domain summary.
- [ ] Build night detail screen with deep links to wine, recipe, and media details.
- [ ] Build manual create/edit flow.
- [ ] Build searchable selectors for wine, recipe, and media.
- [ ] Add clear buttons for linked wine, recipe, and media.
- [ ] Build delete confirmation.
- [ ] Add tests for optimistic create, optimistic update, optimistic delete, rollback on error, selector behavior, and linked detail navigation.

**Acceptance gate:**

- A user can create a planned night manually, revise its linked items, open linked records, and recover from mutation failures.

## Stage 8: Spin the Night

**Goal:** Bring the playful randomizer to mobile with native interaction quality.

**Deliverables:**

- Category toggles.
- Random wine/recipe/media selection.
- Native animation.
- Generated night name.
- Save as night.
- Reduced-motion path.

**Tasks:**

- [ ] Build spin screen using existing wine, recipe, and media queries.
- [ ] Add category toggles that prevent selecting only empty categories.
- [ ] Add empty-state links to create wine, recipe, or media.
- [ ] Implement random selection helper as a pure tested function.
- [ ] Build slot/reel animation using React Native animation APIs.
- [ ] Add haptic feedback on spin completion where supported.
- [ ] Respect reduced-motion by replacing reel animation with a simple reveal.
- [ ] Generate a night name from selected item titles with length limits.
- [ ] Save result through `useCreateNight`.
- [ ] Add tests for category rules, random selection helper, generated name truncation, save payload, and reduced-motion behavior.

**Acceptance gate:**

- Spin feels native, works with any subset of non-empty categories, and saves a night reliably.

## Stage 9: Member Messages

**Goal:** Add group chat parity.

**Deliverables:**

- Member message list.
- Send message.
- Realtime updates or clearly defined polling fallback.
- Authenticated instance-scoped websocket if enabled.

**Tasks:**

- [ ] Implement member message query and send mutation.
- [ ] Build message list with sender names/avatars and timestamps.
- [ ] Build composer with send disabled for empty content.
- [ ] Add optimistic local append or cache append on success.
- [ ] Verify backend websocket auth and membership behavior from mobile.
- [ ] If websocket is ready, implement mobile websocket client with token refresh/reconnect.
- [ ] If websocket is not ready, implement polling with conservative interval and visible refresh behavior.
- [ ] Add tests for loading, empty, send, duplicate append prevention, and reconnect/poll refresh behavior.

**Acceptance gate:**

- Members can exchange messages inside an instance without cross-instance leakage.

## Stage 10: AI Assistant and Recipe Generation

**Goal:** Reach mobile parity for AI-assisted planning and recipe creation.

**Deliverables:**

- AI assistant screen.
- Persisted chat sessions.
- Chat message send.
- Delete chat session.
- Generate recipe flow.
- Rate-limit/error UI.

**Tasks:**

- [ ] Implement AI chat mutation.
- [ ] Implement chat session list/detail/create/delete hooks.
- [ ] Build AI assistant entry screen.
- [ ] Build chat session list.
- [ ] Build chat session detail with message bubbles.
- [ ] Build message composer.
- [ ] Add loading state while assistant response is pending.
- [ ] Build delete session confirmation.
- [ ] Build recipe generation entry point from recipes.
- [ ] Convert generated recipe response into the recipe create/edit form review flow.
- [ ] Show rate-limit responses distinctly from generic errors.
- [ ] Add tests for session list, send message, pending state, delete, recipe generation success, malformed generation response, and rate-limit UI.

**Acceptance gate:**

- A user can have an AI chat, manage sessions, generate a recipe, review it, and save it as a normal recipe.

## Stage 11: Cross-Domain Polish and Native Quality

**Goal:** Make the app feel finished rather than merely ported.

**Deliverables:**

- Consistent native visual system.
- Accessibility pass.
- Tablet layout pass.
- Performance pass.
- Error/retry consistency.
- Deep link policy.

**Tasks:**

- [ ] Audit every screen for loading skeletons.
- [ ] Audit every screen for empty states.
- [ ] Audit every mutation for pending, success, and error feedback.
- [ ] Add pull-to-refresh to major lists.
- [ ] Add sensible cache stale times per domain.
- [ ] Add dynamic type support for core text.
- [ ] Verify touch targets are at least platform-recommended size.
- [ ] Add screen-reader labels to icon-only controls.
- [ ] Add keyboard-safe layouts for forms and chats.
- [ ] Add tablet layouts for cooking, detail screens, and large lists.
- [ ] Add haptics only where they help: spin completion, timer completion, destructive confirmation.
- [ ] Add image caching/fallbacks.
- [ ] Add deep link handling if app links are needed for shared instance or detail URLs.
- [ ] Profile list rendering for large collections.
- [ ] Add crash/error reporting decision, such as Sentry, if desired before public release.

**Acceptance gate:**

- The app is comfortable on small phones, large phones, and tablets.
- Accessibility basics pass on iOS VoiceOver and Android TalkBack.
- Large lists remain responsive.

## Stage 12: Test, Release, and Operations

**Goal:** Prepare the app for ongoing development and app store distribution.

**Deliverables:**

- CI checks.
- EAS build profiles.
- Internal distribution.
- Store metadata.
- Release checklist.
- Regression test checklist.

**Tasks:**

- [ ] Add mobile typecheck to CI.
- [ ] Add mobile unit/component tests to CI.
- [ ] Add smoke tests for auth and instance list where practical.
- [ ] Configure EAS development, preview, and production profiles.
- [ ] Configure app icons, splash screen, bundle identifiers, package names, and versioning.
- [ ] Configure environment variables for dev/staging/prod API URLs and Clerk keys.
- [ ] Produce iOS development build.
- [ ] Produce Android development build.
- [ ] Test on at least one physical iOS device and one physical Android device.
- [ ] Prepare TestFlight internal release.
- [ ] Prepare Google Play internal testing release.
- [ ] Write mobile release notes.
- [ ] Add production rollback/recovery notes.

**Acceptance gate:**

- Internal testers can install the app from TestFlight and Google Play internal testing, sign in, and complete the MVP smoke test.

## Suggested Release Milestones

### Milestone A: Technical Alpha

Includes stages 0-3.

Purpose:

- Prove auth, API access, navigation, app shell, and group membership.

Exit criteria:

- Signed-in users can create/join/open groups on iOS and Android.

### Milestone B: Cooking Companion MVP

Includes stage 4.

Purpose:

- Ship the highest-value native use case quickly.

Exit criteria:

- Users can manage recipes and cook from mobile with keep-awake and timers.

### Milestone C: Collection Parity

Includes stages 5-7.

Purpose:

- Add wines, media, TMDB, and manual nights.

Exit criteria:

- Core collection management is functionally equivalent to web.

### Milestone D: Social and Playful Parity

Includes stages 8-10.

Purpose:

- Add spin, member chat, AI chat, and recipe generation.

Exit criteria:

- All major web routes have a mobile equivalent.

### Milestone E: Public Release Candidate

Includes stages 11-12.

Purpose:

- Prepare for real distribution.

Exit criteria:

- App store builds are available, tested, accessible, and stable enough for non-developer users.

## Backend Impact Assessment

No backend rewrite is required for mobile. Expected backend work is limited to verification and small compatibility fixes.

Potential backend follow-ups:

- Confirm CORS is irrelevant for native requests but still correct for web.
- Confirm Clerk JWT verification supports tokens issued by the mobile SDK.
- Confirm local development works from device IPs, not only `localhost`.
- Confirm websocket auth supports mobile token refresh and reconnect.
- Confirm API errors consistently use `{ "data": T, "error": string | null }`.
- Add any missing integration tests for cross-instance mobile-equivalent access patterns.
- Add rate-limit response shape documentation for AI mobile UI.

Schema migrations are not expected for the initial mobile client. If a mobile-specific feature later requires new persisted fields, create Goose migrations before app code references them.

## Testing Strategy

### Shared Package

- Unit-test pure validators, formatters, query key factories, and random selection helpers.
- Run TypeScript strict typecheck.

### Mobile Unit and Component Tests

- Use React Native Testing Library.
- Mock API hooks at component boundaries where the screen logic is the unit under test.
- Mock Clerk for auth routing tests.
- Verify loading, empty, success, and error states for every screen.
- Verify form validation before mutation calls.
- Verify destructive actions require confirmation.

### Integration and Smoke Testing

- Use local backend with Postgres/Redis for manual smoke tests.
- Use deployed backend for TestFlight/Play internal testing.
- Smoke path:
  1. Sign in.
  2. Sync user.
  3. Create group.
  4. Create recipe.
  5. Use cooking view timer.
  6. Add wine.
  7. Search/add media.
  8. Spin and save a night.
  9. Send member message.
  10. Send AI message or generate recipe.

### Security Testing

- Reuse backend cross-instance tests.
- Add mobile smoke cases that attempt to open stale or unauthorized instance IDs.
- Confirm 403 screens do not leak resource titles or details.

## Risks and Mitigations

### Clerk Mobile Token Compatibility

Risk:

- Mobile-issued Clerk tokens may differ from web assumptions.

Mitigation:

- Spike this in Stage 0 before building screens.

### Recipe Editing Parity

Risk:

- Plate cannot be directly reused in React Native.

Mitigation:

- Ship structured native recipe editing first. Defer rich text or isolate it behind a WebView only if users need it.

### Web and Mobile Type Drift

Risk:

- DTOs diverge as both clients evolve.

Mitigation:

- Keep shared model/API types small and maintained. Add typecheck gates for both clients.

### Realtime Chat Complexity

Risk:

- Mobile websocket lifecycle, auth refresh, and backgrounding can be fragile.

Mitigation:

- Ship polling first if needed, then upgrade to websocket once reconnect behavior is tested.

### Local Development Networking

Risk:

- Simulators and physical devices cannot reach `localhost` the same way the web app can.

Mitigation:

- Document API URL strategy for iOS simulator, Android emulator, and physical devices in Stage 0.

### Scope Creep

Risk:

- Full parity plus native polish can sprawl.

Mitigation:

- Release by milestones and keep Cooking Companion MVP as the first meaningful product slice.

## Build and Verification Commands

The exact commands will depend on the package manager selected during Stage 1. The intended verification gates are:

```bash
cd packages/shared
npm run typecheck
npm test
```

```bash
cd mobile
npm run typecheck
npm test
npx expo start
```

```bash
cd frontend
npm run build
```

```bash
cd backend
env GOCACHE=/Users/bailee/Documents/Programming/tabletop/backend/.cache/go-build go test ./...
```

Do not run long-lived development servers from unattended automation unless the task is explicitly interactive. For frontend production verification, run a build rather than a dev server.

## Documentation Updates Required

- Update `AGENTS.md` directory map when `mobile/` and `packages/` are created.
- Add `docs/mobile/local-development.md`.
- Add `docs/mobile/release-checklist.md`.
- Add `docs/mobile/parity-matrix.md`.
- Update `README.md` or `SETUP.md` with mobile setup after the app can boot.

## Definition of Full Mobile Parity

The mobile client reaches parity when:

- Users can sign in and sync through Clerk.
- Users can create, join, open, and leave groups.
- Users can manage media, recipes, wines, and nights.
- Users can search TMDB and add media.
- Users can use the full cooking view with keep-awake and timers.
- Users can spin and save a night.
- Users can send member messages.
- Users can use AI chat and generate recipes.
- All instance-scoped mobile API calls respect backend membership checks.
- Every screen has loading, empty, error, and retry states where applicable.
- iOS and Android release builds pass smoke testing on physical devices.

## Recommended First Implementation Batch

Start with these tasks only:

1. Stage 0 technical spike.
2. Stage 1 mobile/shared scaffold.
3. Stage 2 app shell.
4. Stage 3 auth/groups.
5. Stage 4 recipe/cooking MVP.

This produces a useful internal alpha before the project invests in full feature parity.
