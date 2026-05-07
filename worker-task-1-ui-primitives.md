# Worker Task 1: UI Primitives — Warm Minimalist Design System

## Summary

Applied the warm minimalist design system to all 8 specified files. Replaced all legacy Tailwind color classes (`neutral-*`, `gray-*`, etc.) with design-system tokens. Removed sharp corners in favor of `rounded-2xl`/`rounded-3xl`/`rounded-full`. Wrapped Login's Clerk SignIn in a `soft-card`. All changes are styling-only — no component logic, hooks, data flow, or TypeScript types were touched.

## Files Changed

| File | Changes |
|---|---|
| `src/components/ui/Dialog.tsx` | backdrop `bg-black/50` → `bg-text/40`; modal `rounded-xl bg-white shadow-xl` → `rounded-3xl bg-surface shadow-card`; close button icon `text-neutral-400 hover:text-neutral-600` → `text-muted hover:text-text-secondary`; close button `rounded-sm` → `rounded-full`, focus ring `neutral-900` → `accent/30`; title `text-neutral-900` → `text-text` |
| `src/components/ui/ConfirmDialog.tsx` | description `text-neutral-600` → `text-text-secondary` |
| `src/components/ui/ErrorBoundary.tsx` | alert icon `text-amber-500` → `text-accent`; heading `text-neutral-900` → `text-text`; body `text-neutral-600` → `text-text-secondary` |
| `src/components/ui/LoadingSkeleton.tsx` | Skeleton base: `rounded-md bg-neutral-200` → `rounded-2xl bg-border`; CardSkeleton wrapper: `rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200` → `soft-card`; image skeleton: `rounded-lg` → `rounded-2xl`; ListSkeleton: `rounded-lg bg-white p-4 ring-1 ring-neutral-200` → `soft-card flex items-center gap-4 p-4`; DetailSkeleton image: `rounded-xl` → `rounded-3xl` |
| `src/components/ui/StarRating.tsx` | empty star `text-neutral-200` → `text-border`; filled star `fill-amber-400 text-amber-400` → `fill-accent text-accent`; rating number `text-neutral-500` → `text-muted`; focus ring `focus:ring-neutral-900` → `focus:ring-accent/30` |
| `src/components/layout/AuthGate.tsx` | headline `text-neutral-900` → `text-text`; subtitle `text-neutral-600` → `text-text-secondary`; "Welcome back" span `text-neutral-600` → `text-text-secondary`; feature cards: replaced `card` + inline styles with `soft-card-hover`, heading `text-neutral-900` → `text-text`, description `text-neutral-600` → `text-text-secondary` |
| `src/components/layout/AuthSetup.tsx` | loading container `bg-neutral-50` → `bg-bg`; pulse dot `bg-neutral-200` → `bg-border` |
| `src/pages/Login.tsx` | container `bg-neutral-50` → `bg-bg`; heading `text-neutral-900` → `text-text`; wrapped `<SignIn />` in `<div className="soft-card max-w-md mx-auto">`; added `px-4` to motion wrapper for mobile padding |

## Validation

- **Design tokens audit:** `grep` confirmed zero remaining `neutral-*`, `gray-*`, `zinc-*`, `slate-*`, `stone-*` classes across all 8 edited files.
- **Build:** `npm run build` (tsc + vite) was run. Two **pre-existing** TypeScript errors exist and are NOT introduced by this task:
  - `ConfirmDialog.tsx:40` — `"destructive"` is not a valid Button variant (only `default`, `secondary`, `ghost`, `outline`, `warm` exist)
  - `Dashboard.tsx:5` — unused import `MessageSquare`
- **Vite production build** passes (the tsc step fails on the pre-existing errors, but that's unrelated).

## Risks / Open Questions

1. **Pre-existing build errors** block the full `npm run build` pipeline. These need separate fixes:
   - `ConfirmDialog.tsx`: Either add a `destructive` variant to the Button component, or change ConfirmDialog to use an existing variant (e.g., `warm` with red styling)
   - `Dashboard.tsx`: Remove unused `MessageSquare` import
2. **`bg-text/40` in Dialog backdrop** — This uses the `text` color token (`#26211D`) at 40% opacity as a backdrop. It's a valid Tailwind utility (the `text` color is defined in the config), and produces a warm dark overlay instead of pure black.

## Recommended Next Step

Fix the two pre-existing TypeScript build errors to unblock the build pipeline, then proceed with remaining frontend design system work.
