# Worker Task 4 — Wines: Warm Minimalist Design System

## Status: Complete

## Changed Files

1. **`frontend/src/components/wine/WineCard.tsx`**
   - Container: `rounded-3xl bg-surface border border-border` with `hover:shadow-card hover:border-border-subtle`
   - Title: `text-text`
   - Type badges: warmer palette (rose-50/yellow-50/violet-50)
   - "Not rated": `text-muted`
   - Cost: `text-text font-medium`
   - Fallback badge: `bg-surface-secondary text-text-secondary`

2. **`frontend/src/pages/WineList.tsx`**
   - Title: `text-3xl font-semibold tracking-tight text-text`
   - Type filter: `segmented-control` component class
   - Sort select: `rounded-full bg-surface-secondary`, warm focus ring
   - Error: `rounded-2xl ... text-rose-700`
   - Empty state: "The cellar is empty", `text-muted`/`text-text-secondary`
   - Grid: `gap-5`

3. **`frontend/src/pages/WineDetail.tsx`**
   - Back link: `text-text-secondary hover:text-text`
   - Title: `text-text`
   - Form/read-only cards: `soft-card` class
   - Labels: `text-text-secondary font-medium`
   - Type pills: active `bg-accent text-white`, inactive `bg-surface-secondary text-text-secondary`
   - Textarea: `rounded-2xl bg-surface-secondary`, warm focus ring
   - Info labels: `text-muted`, values: `text-text`
   - Notes divider: `border-t border-border-subtle`
   - Delete button: warm red preserved

4. **`frontend/src/pages/WineEdit.tsx`**
   - Back link: `text-text-secondary hover:text-text`
   - Title: `text-text`
   - Labels: `text-text-secondary font-medium`
   - Type pills: same warm style as WineDetail
   - Textarea: `rounded-2xl bg-surface-secondary`, warm focus ring

## Validation
- All 4 files compile cleanly (no type errors from wine changes)
- Two pre-existing build errors exist in `ConfirmDialog.tsx` and `Dashboard.tsx` — unrelated to this task
- All `neutral-*`, `gray-*`, `zinc-*`, `slate-*`, `stone-*` Tailwind classes removed from wine section
- No component logic, hooks, data flow, or TypeScript types changed

## Risks / Open Questions
- None. The StarRating component still uses `amber-400` for filled stars and `neutral-200` for unfilled — these could be updated to `accent`/`muted` in a future pass if the amber doesn't feel warm enough. The task's "warm clay stars" suggestion would require editing `StarRating.tsx` which was outside the 4 specified files.
- The `segmented-control` CSS class renders as an inline flex container with subtle gap — this is intentional and matches the design system.
