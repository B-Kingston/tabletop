# Worker Task 2: Media Section — Warm Minimalist Design

## Implemented

Applied the warm minimalist design system to all 4 Media section files. Every `neutral-*`, `gray-*`, `zinc-*`, `slate-*`, `stone-*` Tailwind class was replaced with design system tokens. Sharp corners removed. No component logic, hooks, data flow, or TypeScript types were changed.

## Changed files

1. **`frontend/src/components/media/MediaCard.tsx`**
   - Container: `rounded-3xl bg-surface border border-border` + `hover:shadow-card hover:border-border-subtle`
   - Poster placeholder: `bg-surface-secondary`, icon `text-muted`
   - Status badges: planning → `bg-accent-surface text-accent`, watching → `bg-surface-secondary text-text-secondary`, completed → `bg-surface-secondary text-muted`, dropped → `bg-red-50 text-red-600`
   - IMDb rating: `text-accent`, value `text-text-secondary`

2. **`frontend/src/components/media/MediaSearchModal.tsx`**
   - Search icon / loader / empty copy: `text-muted`
   - Empty state copy: "Nothing found on the shelf"
   - Results items: `rounded-2xl hover:bg-surface-secondary/50`
   - Poster placeholder: `bg-surface-secondary`, icon `text-muted`
   - Title `text-text`, year `text-muted`, type `text-text-secondary`

3. **`frontend/src/pages/MediaList.tsx`**
   - Page title: "The Shelf" with `text-3xl font-semibold tracking-tight text-text`
   - Status/type tabs: `segmented-control` + `segmented-control-item` with `active` class
   - Error state: `rounded-2xl bg-red-50/80 border border-red-100`
   - Empty state: warm glow (`bg-accent/10 blur-xl` behind icon), copy "The shelf is empty", icon `text-muted`, heading `text-xl font-semibold text-text`, body `text-text-secondary`
   - Grid: `gap-5`

4. **`frontend/src/pages/MediaDetail.tsx`**
   - Back link: `text-text-secondary hover:text-text`
   - Poster: `rounded-3xl bg-surface-secondary`, icon `text-muted`
   - Meta sidebar: `bg-surface-secondary/50 border border-border rounded-3xl`
   - Rating badges: IMDb → `bg-accent-surface text-accent`, RT → `bg-red-50 text-red-700`, MC → `bg-surface-secondary text-text-secondary` (blue removed)
   - Title: `text-text`, type/rated labels `bg-surface-secondary text-text-secondary`, year `text-muted`
   - Plot: `text-text-secondary leading-relaxed`
   - Cast/crew card: `bg-surface-secondary/50 border border-border rounded-3xl`, labels `text-muted uppercase tracking-wide`, values `text-text`
   - User controls: `soft-card` class
   - Status buttons: `segmented-control` + `segmented-control-item` with `active`
   - Date input: `rounded-full bg-surface-secondary`, focus `ring-accent/30`
   - Review textarea: `rounded-2xl bg-surface-secondary`, focus `ring-accent/30`
   - Labels: `text-text-secondary`
   - Delete button: `hover:bg-red-50/50`
   - Genre pills: `bg-surface-secondary text-text-secondary border border-border`

## Validation

- **Vite production build**: ✅ passes (1.27s, 2154 modules)
- **Zero neutral/gray/zinc/slate/stone classes** remaining in all 4 files
- **No component logic, hooks, data flow, or TypeScript types changed**
- 2 pre-existing TS errors in unrelated files (ConfirmDialog.tsx, Dashboard.tsx) — not caused by these changes

## Open risks/questions

None. All changes are pure styling/copy replacements following the design system exactly.

## Recommended next step

Continue applying the warm minimalist design to remaining sections (Recipes, Chat, Layout/Dashboard) following the same pattern.
