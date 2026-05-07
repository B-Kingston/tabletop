# Tabletop Warm Minimalist Redesign — Division Plan

## Overview

The foundational design system has been established in the following files (already complete — do not modify):
- `tailwind.config.js` — warm color tokens, custom shadows, border-radius, animations
- `src/index.css` — utility classes: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.soft-card`, `.soft-card-hover`, `.pill-input`, `.segmented-control`, `.floating-nav`, `.warm-focus`
- `src/components/ui/Button.tsx` — warm pill button variants
- `src/components/ui/Input.tsx` — warm pill input
- `src/components/layout/InstanceNav.tsx` — floating pill navigation with accent active state
- `src/components/layout/InstanceLayout.tsx` — floating nav layout with warm bg
- `src/components/layout/AppShell.tsx` — warm-centered app shell
- `src/pages/Dashboard.tsx` — already redesigned as warm home page

All **remaining** files in `src/components/` and `src/pages/` must be updated to adopt the warm design system.

---

## Global Design Rules (apply to every task)

### Colors — MANDATORY replacements
Replace these Tailwind classes everywhere:

| Old | New |
|-----|-----|
| `bg-neutral-50` | `bg-bg` |
| `bg-neutral-100` | `bg-surface-secondary` |
| `bg-neutral-200` | `bg-surface-secondary` or `bg-border` |
| `bg-neutral-800` | `bg-text` |
| `bg-neutral-900` | `bg-text` |
| `text-neutral-900` | `text-text` |
| `text-neutral-800` | `text-text` |
| `text-neutral-700` | `text-text-secondary` |
| `text-neutral-600` | `text-text-secondary` |
| `text-neutral-500` | `text-muted` |
| `text-neutral-400` | `text-muted` |
| `text-neutral-300` | `text-muted` |
| `ring-neutral-200` | `ring-border` |
| `border-neutral-200` | `border-border` |
| `border-neutral-100` | `border-border-subtle` |
| `shadow-sm` where used for card depth | keep `shadow-sm` or remove (prefer thin border for depth) |

**Never use:** `neutral-*`, `gray-*`, `zinc-*`, `stone-*`, `slate-*`, `blue-*`, `black` (except `bg-black/50` in Dialog backdrop — change to `bg-text/40`), `amber-500` (change icons to `accent`), `red-600` for destructive text (use `text-red-700` or `text-accent` if it fits), `yellow-600`/`yellow-50` (use warm accent tones).

### Shape
- All cards: `rounded-xl` → `rounded-3xl` (or `rounded-[24px]`)
- All buttons: already handled by `Button.tsx`, but inline buttons must use `rounded-full`
- All inputs: already handled by `Input.tsx`, but inline inputs/textarea/select must use `rounded-full` for single-line, `rounded-2xl` for textareas
- All badges/pills: `rounded-full`
- All avatars: `rounded-full`

### Icons
- Every Lucide icon must have `strokeWidth={1.5}`
- Icon container backgrounds: use `bg-surface-secondary` or `bg-accent-surface` with `text-accent` or `text-text-secondary`

### Shadows
- Prefer `shadow-soft` or `shadow-card` from tailwind config
- Remove heavy `shadow-xl`, `shadow-md` on cards — use `shadow-sm` or none
- Dialog can keep a slightly stronger shadow but warm it up

### Language / Copy
- Avoid: "manage", "track", "database", "filters", "items", "collection", "groups"
- Prefer: "share", "moments", "spaces", "evenings", "shelf", "journal", "plan", "queue"
- Empty states: warm glow behind icon, emotional CTA copy, inviting tone

---

## Task 1: UI Primitives, Auth & Login

**Scope:** Foundational shared components and authentication surfaces.

### Files to modify
1. `src/components/ui/Dialog.tsx`
2. `src/components/ui/ConfirmDialog.tsx`
3. `src/components/ui/ErrorBoundary.tsx`
4. `src/components/ui/LoadingSkeleton.tsx`
5. `src/components/ui/StarRating.tsx`
6. `src/components/layout/AuthGate.tsx`
7. `src/components/layout/AuthSetup.tsx`
8. `src/pages/Login.tsx`

### Specific instructions per file

**Dialog.tsx**
- Backdrop: `bg-black/50` → `bg-text/40`
- Modal container: `rounded-xl bg-white` → `rounded-3xl bg-surface`
- Close button: `text-neutral-400` → `text-muted`, hover `text-text`, focus ring `accent`
- DialogTitle: `text-neutral-900` → `text-text`

**ConfirmDialog.tsx**
- Inherits Dialog styles automatically once Dialog is updated
- Description: `text-neutral-600` → `text-text-secondary`
- Ensure `destructive` variant on Button still works (Button.tsx already supports it via variant map)

**ErrorBoundary.tsx**
- Background: remove `bg-neutral-50` → `bg-bg`
- AlertTriangle icon: `text-amber-500` → `text-accent`
- Heading: `text-neutral-900` → `text-text`
- Body: `text-neutral-600` → `text-text-secondary`
- Centering container should feel warm, not sterile

**LoadingSkeleton.tsx**
- All skeleton bars: `bg-neutral-200` → `bg-border`
- Card skeleton container: `bg-white ring-1 ring-neutral-200` → `soft-card`
- List skeleton items: same warm card treatment
- Rounded values: `rounded-md` → `rounded-2xl`, `rounded-lg` → `rounded-2xl`, `rounded-full` stays

**StarRating.tsx**
- Empty star color: `text-neutral-200` → `text-border`
- Filled star color: `fill-amber-400 text-amber-400` → `fill-accent text-accent` (warm clay stars)
- Rating number: `text-neutral-500` → `text-muted`
- Focus ring: `focus:ring-neutral-900` → `focus:ring-accent/30`

**AuthGate.tsx**
- Background: `bg-neutral-50` already handled by parent but ensure text colors are warm
- Headline: `text-neutral-900` → `text-text`
- Subtitle: `text-neutral-600` → `text-text-secondary`
- Feature cards: `card` class → `soft-card-hover`
- Use emotional copy: "Welcome home" feel

**AuthSetup.tsx**
- Loading background: `bg-neutral-50` → `bg-bg`
- Loading pulse dot: `bg-neutral-200` → `bg-border`
- Make dot slightly larger and softer

**Login.tsx**
- Background: `bg-neutral-50` → `bg-bg`
- Heading: `text-neutral-900` → `text-text`
- Add a small warm accent mark or logo above the Clerk form
- Keep the Clerk `<SignIn />` component as-is (we can't style its internals), but wrap it in a warm card container: `soft-card max-w-md mx-auto`

### Acceptance criteria
- [ ] No `neutral-*`, `gray-*`, `zinc-*` classes remain in any of these files
- [ ] Dialog renders with warm cream backdrop and rounded-3xl white surface
- [ ] StarRating shows clay-orange filled stars
- [ ] All skeletons use warm border color instead of gray
- [ ] Login page has warm bg and centered card wrapper
- [ ] ErrorBoundary feels emotional, not corporate

---

## Task 2: Media Section — Shelf & Collection

**Scope:** Media cards, search modal, list page, detail page. Should feel like a curated living-room shelf.

### Files to modify
1. `src/components/media/MediaCard.tsx`
2. `src/components/media/MediaSearchModal.tsx`
3. `src/pages/MediaList.tsx`
4. `src/pages/MediaDetail.tsx`

### Specific instructions per file

**MediaCard.tsx**
- Container: `rounded-xl bg-white shadow-sm ring-1 ring-neutral-200` → `rounded-3xl bg-surface border border-border overflow-hidden` (remove shadow, use border)
- Poster placeholder bg: `bg-neutral-100` → `bg-surface-secondary`
- Poster placeholder icon: `text-neutral-300` → `text-muted`
- Title: `text-neutral-900` → `text-text`
- Type label: `text-neutral-400` → `text-muted`
- Status badge: replace `statusColors` map with warm tones:
  - planning → `bg-accent-surface text-accent`
  - watching → `bg-surface-secondary text-text-secondary`
  - completed → `bg-surface-secondary text-muted`
  - dropped → `bg-red-50 text-red-600`
- IMDb rating: `text-yellow-600` → `text-accent`, `text-neutral-600` → `text-text-secondary`
- Add a subtle gradient overlay at bottom of poster area for text legibility if needed
- Hover: `hover:shadow-md` → `hover:shadow-card hover:border-border-subtle`

**MediaSearchModal.tsx**
- Search input: already uses `Input` component (will be warm automatically), but the wrapper `pl-10` input should also be pill-shaped — if using inline input styling, make it `rounded-full bg-surface-secondary`
- Search icon: `text-neutral-400` → `text-muted`
- Results list item: `hover:bg-neutral-50` → `hover:bg-surface-secondary/50`, `rounded-lg` → `rounded-2xl`
- Poster placeholder in results: same warm treatment
- Title in results: `text-neutral-900` → `text-text`
- Year: `text-neutral-400` → `text-muted`
- Type: `text-neutral-500` → `text-text-secondary`
- Loader: `text-neutral-400` → `text-muted`
- "No results" copy: warm muted text, emotionally rephrase to "Nothing found on the shelf"

**MediaList.tsx**
- Page title: `text-neutral-900` → `text-text`, make it `text-3xl font-semibold tracking-tight`
- Copy rephrase: "Media" → "The Shelf"
- Status tabs & type tabs: replace inline pill logic with `segmented-control` / `segmented-control-item` classes from index.css
  - Active: `bg-neutral-900 text-white` → `bg-surface text-text shadow-soft`
  - Inactive: `bg-neutral-100 text-neutral-600` → `text-muted hover:text-text`
- Error state: `bg-red-50` → `rounded-2xl bg-red-50/80 border border-red-100`
- Empty state:
  - `Search` icon → wrap in warm glow container (`relative` with `bg-accent/10 blur-2xl` behind)
  - Icon color: `text-neutral-300` → `text-muted`
  - Heading: `text-lg font-medium text-neutral-900` → `text-xl font-semibold text-text`
  - Body: `text-neutral-600` → `text-text-secondary`
  - Copy: "No media found" → "The shelf is empty" / "Add your first movie or show to the shelf"
- Grid: `gap-4` → `gap-5`

**MediaDetail.tsx**
- Back link: `text-neutral-600` → `text-text-secondary`, hover `text-text`
- Poster container: `rounded-xl bg-neutral-100` → `rounded-3xl bg-surface-secondary`
- Placeholder icon: `text-neutral-300` → `text-muted`
- Meta sidebar: `bg-neutral-50 ring-1 ring-neutral-200` → `bg-surface-secondary/50 border border-border rounded-3xl`
- OMDb rating badges: keep IMDb/RT/MC but remove blue (`bg-blue-50 text-blue-800`) — use warm neutral or accent tones
- Title: `text-3xl font-bold text-neutral-900` → `text-text`
- Type label: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`
- Plot: `text-neutral-700` → `text-text-secondary leading-relaxed`
- Cast/Crew grid: `bg-neutral-50 ring-1 ring-neutral-200` → `bg-surface-secondary/50 border border-border rounded-3xl`
- Section labels (Director, Writers, Starring): `text-neutral-400` → `text-muted uppercase tracking-wide`
- Values: `text-neutral-800` → `text-text`
- User controls card: `bg-white shadow-sm ring-1 ring-neutral-200` → `soft-card`
- Status buttons: segmented control style (rounded-full bg-surface-secondary, active = bg-surface text-text shadow-soft)
- Date input: inline styled input → make `rounded-full bg-surface-secondary`
- Review textarea: `rounded-lg` → `rounded-2xl bg-surface-secondary`
- Delete button: keep red but make it `text-red-600 hover:text-red-700 hover:bg-red-50/50`
- Genre pills: `bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200` → `bg-surface-secondary text-text-secondary border border-border`

### Acceptance criteria
- [ ] No neutral/gray/zinc classes in any media file
- [ ] Media cards feel like shelf items with thin warm borders, no harsh shadows
- [ ] Status badges use accent-surface / accent color for "planning"
- [ ] MediaList uses segmented-control pattern for filters
- [ ] Empty state has warm glow behind icon and emotional copy
- [ ] MediaDetail meta sidebar uses surface-secondary with rounded-3xl
- [ ] StarRating in detail shows warm clay stars

---

## Task 3: Recipe Section — Kitchen & Cooking

**Scope:** Recipe cards, ingredient list, step list, generator modal, list page, detail page, edit page, cooking view.

### Files to modify
1. `src/components/recipe/IngredientList.tsx`
2. `src/components/recipe/RecipeCard.tsx`
3. `src/components/recipe/RecipeGeneratorModal.tsx`
4. `src/components/recipe/StepList.tsx`
5. `src/pages/RecipeList.tsx`
6. `src/pages/RecipeDetail.tsx`
7. `src/pages/RecipeEdit.tsx`
8. `src/pages/CookingView.tsx`

### Specific instructions per file

**IngredientList.tsx**
- Checkbox circle: `border-neutral-300` → `border-border`
- Quantity: `font-medium text-neutral-900` → `font-medium text-text`
- Unit: `text-neutral-500` → `text-text-secondary`
- Name: `text-neutral-900` → `text-text`
- Optional label: `text-neutral-400` → `text-muted`

**RecipeCard.tsx**
- Container: `rounded-xl bg-white shadow-sm ring-1 ring-neutral-200` → `rounded-3xl bg-surface border border-border overflow-hidden`
- Image placeholder: `bg-neutral-100` → `bg-surface-secondary`
- Title: `text-neutral-900` → `text-text`
- Description: `text-neutral-500` → `text-text-secondary`
- Meta (clock, users): `text-neutral-500` → `text-muted`
- Tags: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`
- Hover: `hover:shadow-md` → `hover:shadow-card hover:border-border-subtle`

**RecipeGeneratorModal.tsx**
- Sparkles icon: `text-amber-500` → `text-accent`
- Title: "AI Recipe Generator" → "Recipe Inspiration" (warmer, less corporate)
- Textarea: inline styled → `rounded-2xl bg-surface-secondary border-0 focus:ring-2 focus:ring-accent/30`
- Loading state: `text-neutral-500` → `text-muted`
- Generated title: `text-lg font-semibold text-neutral-900` → `text-text`
- Generated description: `text-neutral-600` → `text-text-secondary`
- Ingredient list items: `text-neutral-600` → `text-text-secondary`
- Step list: `text-neutral-900` for numbers → `text-text`, `text-neutral-600` for content → `text-text-secondary`
- Tags in preview: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`
- Error text: keep red

**StepList.tsx**
- Step number circle: `bg-neutral-900 text-white` → `bg-accent text-white` (warm accent!)
- Connector line: `bg-neutral-200` → `bg-border`
- Step title: `text-neutral-900` → `text-text`
- Step content: `text-neutral-600` → `text-text-secondary`
- Timer: `text-neutral-400` → `text-muted`

**RecipeList.tsx**
- Page title: "Recipes" → keep but style as `text-3xl font-semibold tracking-tight text-text`
- Search input: inline styled → `rounded-full bg-surface-secondary pl-10`
- Search icon: `text-neutral-400` → `text-muted`
- Tag filter select: inline styled → `rounded-full bg-surface-secondary border-0`
- AI Generate button: keep secondary variant
- Error state: warm red treatment
- Empty state: warm glow, emotional copy — "No recipes yet" → "The kitchen is quiet"
- Grid: `gap-4` → `gap-5`

**RecipeDetail.tsx**
- Back link: warm text-secondary/hover text
- Title: `text-2xl font-bold text-neutral-900` → `text-text`
- Description: `text-neutral-600` → `text-text-secondary`
- Image container: `rounded-xl bg-neutral-100` → `rounded-3xl bg-surface-secondary`
- Section headings (Ingredients, Instructions): `text-lg font-semibold text-neutral-900` → `text-xl font-semibold text-text`
- Sidebar info card: `bg-white shadow-sm ring-1 ring-neutral-200` → `soft-card`
- Sidebar labels: `text-neutral-500` → `text-muted`
- Sidebar values: `text-neutral-900` → `text-text`
- Tags: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`
- Delete button: warm red treatment

**RecipeEdit.tsx**
- Back link: warm
- Title: warm text
- All inline inputs/textareas/selects: `rounded-lg` → `rounded-2xl` (or `rounded-full` for single line), `bg-surface-secondary`, `focus:ring-accent/30`
- Labels: `text-neutral-700` → `text-text-secondary font-medium`
- Ingredient rows: remove `shadow-sm ring-1 ring-inset ring-neutral-200` → `bg-surface-secondary rounded-2xl`
- Step cards: `bg-neutral-50` → `bg-surface-secondary rounded-2xl`
- Tag chips: `bg-neutral-100 text-neutral-700` → `bg-surface-secondary text-text`
- Remove X button: `text-neutral-400 hover:text-red-500` → `text-muted hover:text-red-600`

**CookingView.tsx**
- This is the hero feature — must feel warm and readable from 2 meters
- Background: `bg-neutral-900` → `bg-text` (warm near-black `#26211D` is already the design's text color — this is intentional for full-screen contrast)
- Header border: `border-neutral-800` → `border-border-subtle` at low opacity
- Title: keep white
- Step counter: `text-neutral-400` → `text-muted`
- Exit button: `text-neutral-400` → `text-muted`
- Step content area: `text-neutral-200` → `text-surface-secondary` or keep warm off-white
- Step title: `text-white` → `text-surface`
- Timer card: `bg-neutral-800` → `bg-surface-secondary/10` with `border border-border-subtle/30`
- Timer label: `text-neutral-400` → `text-muted`
- Timer display: `text-white` → `text-surface`
- Footer border: `border-neutral-800` → `border-border-subtle/30`
- Nav buttons: `text-neutral-400` → `text-muted`, hover `text-surface`
- Step dots: `bg-neutral-700` → `bg-muted/30`, active `bg-white` → `bg-surface`
- Ingredients panel: `bg-neutral-800` → `bg-surface-secondary/10 border border-border-subtle/30`

### Acceptance criteria
- [ ] No neutral/gray/zinc classes remain in any recipe file
- [ ] Step numbers use `bg-accent` (warm clay) instead of dark neutral
- [ ] Cooking view uses warm near-black bg (`bg-text`) with warm off-white text
- [ ] Recipe cards have rounded-3xl and thin warm borders
- [ ] Empty state feels like a quiet kitchen, not a missing database
- [ ] Recipe edit form uses warm pill/rounded-2xl inputs with accent focus rings
- [ ] AI generator modal feels inspiring, not transactional

---

## Task 4: Wine Section — Cellar & Journal

**Scope:** Wine cards, list page, detail page, edit page. Should feel like an elegant wine journal.

### Files to modify
1. `src/components/wine/WineCard.tsx`
2. `src/pages/WineList.tsx`
3. `src/pages/WineDetail.tsx`
4. `src/pages/WineEdit.tsx`

### Specific instructions per file

**WineCard.tsx**
- Container: `rounded-xl bg-white shadow-sm ring-1 ring-neutral-200` → `rounded-3xl bg-surface border border-border`
- Title: `text-neutral-900` → `text-text`
- Type badge: replace `typeColors` with warmer, more muted palette:
  - red → `bg-red-50 text-red-700` → keep or soften to `bg-rose-50 text-rose-700`
  - white → `bg-amber-50 text-amber-700` → `bg-yellow-50 text-yellow-700` (keep warm)
  - rose → `bg-pink-100 text-pink-700` → `bg-rose-50 text-rose-600`
  - sparkling → `bg-yellow-50 text-yellow-700` → keep
  - port → `bg-purple-100 text-purple-700` → `bg-violet-50 text-violet-700`
  - fallback → `bg-surface-secondary text-text-secondary`
- Rating: "Not rated" → `text-muted`
- Cost: `text-neutral-900` → `text-text font-medium`
- Hover: `hover:shadow-card hover:border-border-subtle`

**WineList.tsx**
- Page title: "Wines" → `text-3xl font-semibold tracking-tight text-text`
- Type filter tabs: segmented control pattern (`segmented-control`, `segmented-control-item`)
- Sort select: `rounded-full bg-surface-secondary border-0`
- Error state: warm red
- Empty state: warm glow, emotional copy — "No wines found" → "The cellar is empty"
- Grid: `gap-4` → `gap-5`

**WineDetail.tsx**
- Back link: warm
- Title: warm text
- Edit/Cancel buttons: use updated Button variants
- Form card (editing): `bg-white shadow-sm ring-1 ring-neutral-200` → `soft-card`
- Labels: `text-neutral-700` → `text-text-secondary font-medium`
- Type selector pills: `bg-neutral-100 text-neutral-600` inactive → `bg-surface-secondary text-text-secondary`; active → `bg-accent text-white` (use accent for active!)
- Inputs: use `pill-input` style or `rounded-full bg-surface-secondary`
- Notes textarea: `rounded-2xl bg-surface-secondary`
- Read-only info card: `soft-card`
- Info labels: `text-neutral-500` → `text-muted`
- Info values: `text-neutral-900` → `text-text`
- Rating display: warm clay stars
- Notes block: `border-t border-neutral-100` → `border-t border-border-subtle`
- Delete button: warm red treatment

**WineEdit.tsx**
- Same warm input treatments as WineDetail editing form
- Back link warm
- Title warm
- All inputs: `rounded-full bg-surface-secondary focus:ring-accent/30`
- Textarea: `rounded-2xl bg-surface-secondary`
- Type pills: same as WineDetail

### Acceptance criteria
- [ ] No neutral/gray/zinc classes remain in any wine file
- [ ] Wine cards are elegant with rounded-3xl and thin warm borders
- [ ] Type badges use softer warm palette (no harsh neons)
- [ ] Wine detail form uses accent for active type selector
- [ ] Empty state feels like an inviting cellar, not a database query
- [ ] Notes textarea feels like a journal entry

---

## Task 5: Chat, Messages & Nights — Social & Evenings

**Scope:** Chat components, AI assistant page, member messages page, night cards, slot machine, spin reel, night pages, spin-the-night page. Should feel playful, social, and warm.

### Files to modify
1. `src/components/chat/ChatInput.tsx`
2. `src/components/chat/ChatMessage.tsx`
3. `src/components/chat/RecipeSuggestionCard.tsx`
4. `src/pages/ChatPage.tsx`
5. `src/pages/MemberMessagesPage.tsx`
6. `src/components/night/NightCard.tsx`
7. `src/components/night/SlotMachine.tsx`
8. `src/components/night/SpinReel.tsx`
9. `src/pages/NightDetail.tsx`
10. `src/pages/NightEdit.tsx`
11. `src/pages/NightList.tsx`
12. `src/pages/SpinTheNight.tsx`

### Specific instructions per file

**ChatInput.tsx**
- Container border: `border-t border-neutral-200` → `border-t border-border`
- Textarea: inline styled → `rounded-2xl bg-surface-secondary border-0 focus:ring-2 focus:ring-accent/30`
- Placeholder: `placeholder:text-neutral-400` → `placeholder:text-muted`
- Send button: use `Button` component (already warm)

**ChatMessage.tsx**
- User bubble: `bg-neutral-900 text-white` → `bg-accent text-white` (warm clay user messages!)
- Assistant bubble: `bg-white text-neutral-900 ring-1 ring-neutral-200` → `bg-surface text-text border border-border`
- "AI Assistant" label: `text-neutral-500` → `text-muted`
- Content: `text-neutral-900` → `text-text`
- Rounded: keep `rounded-2xl` but user could be `rounded-3xl rounded-br-sm` for personality

**RecipeSuggestionCard.tsx**
- Container: `rounded-xl border border-neutral-200 bg-white` → `rounded-3xl bg-surface border border-border`
- Icon container: `bg-amber-50 text-amber-600` → `bg-accent-surface text-accent`
- Title: `text-neutral-900` → `text-text`
- Description: `text-neutral-500` → `text-text-secondary`
- Meta (clock, users): `text-neutral-400` → `text-muted`
- Ingredient tags: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`
- "+N more": `text-neutral-400` → `text-muted`

**ChatPage.tsx**
- Sidebar: `border-r border-neutral-200` → `border-r border-border`
- Sidebar header: `text-sm font-semibold text-neutral-900` → `text-text`
- Session list items:
  - Active: `bg-neutral-100 text-neutral-900` → `bg-surface-secondary text-text`
  - Inactive: `text-neutral-600 hover:bg-neutral-50` → `text-text-secondary hover:bg-surface-secondary/50`
- Delete icon: `text-neutral-400 hover:text-red-500` → `text-muted hover:text-red-600`
- Empty state: `text-neutral-400` → `text-muted`, rephrase to "Start a new conversation"
- Main area: ensure messages have comfortable spacing

**MemberMessagesPage.tsx**
- Header: remove `border-b border-neutral-200` or make `border-border`
- Header icon container: `bg-neutral-900 text-white` → `bg-accent-surface text-accent` (or `bg-text text-surface`)
- Title: `text-xl font-semibold text-neutral-900` → `text-text`
- Subtitle: `text-sm text-neutral-500` → `text-text-secondary`
- Message cards: `bg-white ring-1 ring-neutral-200` → `soft-card` but more compact (`p-4`)
- Sender name: `text-neutral-900` → `text-text font-medium`
- Timestamp: `text-neutral-400` → `text-muted`
- Content: `text-neutral-700` → `text-text-secondary`
- Empty state: warm glow, "No messages yet" → "The conversation hasn't started"
- ChatInput at bottom: inherits ChatInput updates

**NightCard.tsx**
- Container: `rounded-xl bg-white shadow-sm ring-1 ring-neutral-200` → `rounded-3xl bg-surface border border-border`
- Title: `text-neutral-900` → `text-text`
- Item pills:
  - Has item: `bg-neutral-100 text-neutral-700` → `bg-surface-secondary text-text-secondary`
  - Deleted: `bg-red-50 text-red-600` → keep but soften border
  - No item: `bg-neutral-50 text-neutral-400` → `bg-surface-secondary/50 text-muted`
- Created by avatar placeholder: `bg-neutral-200` → `bg-border`
- Created by name: `text-neutral-500` → `text-muted`
- Hover: `hover:shadow-card hover:border-border-subtle`

**SlotMachine.tsx**
- Warning banner: `bg-amber-50 text-amber-800` → `bg-accent-surface text-accent` (warmer)
- Spin button: `bg-neutral-900 text-white` → `btn-primary` style (or use Button component)
  - Disabled: `bg-neutral-200 text-neutral-400` → `bg-surface-secondary text-muted cursor-not-allowed`

**SpinReel.tsx**
- Container: `rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200` → `rounded-3xl bg-surface border border-border`
- Icon circle: `bg-neutral-100 text-neutral-700` → `bg-surface-secondary text-text-secondary`
- Spinning icon: `text-neutral-400` → `text-muted`
- Settled item name: `text-neutral-900` → `text-text`
- Settled label: `text-neutral-500` → `text-muted`
- Blur effect during spin: keep but ensure colors don't clash

**NightDetail.tsx**
- Back link: warm
- Title: warm
- Created date: `text-neutral-500` → `text-muted`
- Action buttons: use warm Button variants
- Linked item cards:
  - Has item: `bg-white ring-neutral-200` → `soft-card-hover`
  - Deleted: `bg-red-50 ring-red-200` → keep
  - Empty: `bg-neutral-50 ring-neutral-200` → `bg-surface-secondary/50 border border-border`
- Icon circles in linked cards: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`
- Labels: `text-neutral-500` → `text-muted uppercase tracking-wide`
- Item name: `text-neutral-900` → `text-text`
- Item type: `text-neutral-500` → `text-muted`

**NightEdit.tsx**
- Back link warm
- Title warm
- Loading skeleton: replace neutral grays with `bg-border` and `rounded-2xl`
- Labels: `text-neutral-700` → `text-text-secondary font-medium`
- Inputs: `rounded-full bg-surface-secondary focus:ring-accent/30`
- Selects: `rounded-full bg-surface-secondary border-0 focus:ring-accent/30`

**NightList.tsx**
- Page title: "Nights" → `text-3xl font-semibold tracking-tight text-text`
- Subtitle count: `text-neutral-600` → `text-text-secondary`
- Sort select: `rounded-full bg-surface-secondary border-0`
- Error state: warm red
- Empty state:
  - Moon icon in warm glow container
  - `text-neutral-300` → `text-muted`
  - "No nights yet" → "No evenings planned yet"
  - Body: "Spin the slot machine..." → keep but warmer tone
  - CTA button: use primary Button
- Grid: `gap-4` → `gap-5`

**SpinTheNight.tsx**
- Back link warm
- Title: `text-2xl font-bold text-neutral-900` → `text-text`
- Subtitle: `text-sm text-neutral-600` → `text-text-secondary`
- Empty state: `text-neutral-300` → `text-muted`, warm glow
- Category toggle buttons:
  - Selected: `bg-neutral-900 text-white` → `bg-accent text-white`
  - Unselected with items: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary hover:bg-surface`
  - Disabled (empty): `bg-neutral-50 text-neutral-300` → `bg-surface-secondary/50 text-muted`
- Result card: `bg-white shadow-sm ring-1 ring-neutral-200` → `soft-card`
- Result item icons:
  - Wine: `bg-red-50 text-red-600` → `bg-accent-surface text-accent`
  - Recipe: `bg-amber-50 text-amber-600` → `bg-accent-surface text-accent`
  - Media: `bg-blue-50 text-blue-600` → `bg-surface-secondary text-text-secondary` (no blue!)
- Result item text: `text-neutral-700` → `text-text-secondary`
- Name input: `rounded-full bg-surface-secondary`
- Save/Spin Again buttons: use warm Button variants

### Acceptance criteria
- [ ] No neutral/gray/zinc classes remain in any chat/night file
- [ ] Chat user bubbles use `bg-accent` (warm clay)
- [ ] Assistant bubbles use `bg-surface` with warm border
- [ ] Member message cards use `soft-card`
- [ ] Night cards have rounded-3xl and warm borders
- [ ] SpinReel containers are warm and tactile
- [ ] Spin-the-night category toggles use accent for selected state
- [ ] Empty states feel inviting with warm glows
- [ ] Night edit form uses warm pill inputs and selects

---

## Cross-Task Dependencies

| Dependency | Consumer tasks |
|------------|---------------|
| `Button.tsx` (already updated) | All tasks |
| `Input.tsx` (already updated) | Tasks 2, 3, 4, 5 |
| `Dialog.tsx` (Task 1) | Tasks 2, 3, 4, 5 (ConfirmDialog, modals) |
| `LoadingSkeleton.tsx` (Task 1) | Tasks 2, 3, 4, 5 |
| `StarRating.tsx` (Task 1) | Tasks 2, 3, 4 |
| `ChatInput.tsx` (Task 5) | Tasks 5 (ChatPage, MemberMessagesPage) |

**Important:** Task 1 (UI Primitives) should ideally complete first or concurrently with awareness that other tasks may reference Dialog/StarRating/LoadingSkeleton. However, because the changes are purely stylistic (className swaps) and do not change component APIs, all 5 tasks can run in parallel. Workers should apply the warm class names directly in their assigned files even if the shared primitive hasn't been updated yet — the class names exist in Tailwind config and CSS.

---

## Verification Checklist (for each worker)

Before marking a task complete, verify:
1. `grep -r "neutral-\|gray-\|zinc-\|slate-\|stone-" src/` returns nothing in your assigned files
2. `grep -r "rounded-lg" src/` in your files — replace with `rounded-2xl` or `rounded-3xl` or `rounded-full` as appropriate
3. `grep -r "strokeWidth" src/` in your files — ensure all Lucide icons have `strokeWidth={1.5}` (or add it where missing)
4. Build check: `cd frontend && npm run build` compiles without errors
5. Visual consistency: cards use `bg-surface border border-border`, buttons are pill-shaped, text uses `text`/`text-secondary`/`muted` tokens

---

## Meta-Prompt for Workers

Each worker should receive a prompt like:

> You are a UI implementation specialist. Apply the warm minimalist design system to the following files: [file list].
>
> Design system reference:
> - Colors: `bg-bg` (#F4F3EE), `bg-surface` (#FFFFFF), `bg-surface-secondary` (#EDE9DF), `text-accent` (#C15F3C), `bg-accent-surface` (#FFF3EA), `text-text` (#26211D), `text-text-secondary` (#6B6560), `text-muted` (#B1ADA1), `border-border` (#E8E4DC)
> - Shape: cards `rounded-3xl`, buttons `rounded-full`, inputs `rounded-full` or `rounded-2xl`
> - Shadows: use `shadow-soft` or `shadow-card` from tailwind config; avoid heavy shadows
> - Icons: Lucide icons must have `strokeWidth={1.5}`
> - CSS utilities available in `src/index.css`: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.soft-card`, `.soft-card-hover`, `.pill-input`, `.segmented-control`, `.segmented-control-item`
>
> Rules:
> - Replace ALL `neutral-*`, `gray-*`, `zinc-*`, `slate-*`, `stone-*` Tailwind classes with warm equivalents
> - Remove sharp corners (`rounded-lg` → `rounded-2xl`/`rounded-3xl`/`rounded-full`)
> - Use emotional, home-like language in user-facing copy (avoid productivity/corporate terms)
> - Empty states must have a warm glow effect (absolute blurred accent circle behind icon) and inviting copy
> - Do not change component logic, hooks, data flow, or TypeScript types
> - Only change styling, copy, and spacing
>
> Files: [exact paths]
>
> Acceptance criteria: [from this plan]
