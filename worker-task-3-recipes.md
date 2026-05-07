# Worker Task 3: Recipe Section — Warm Minimalist Design System

## Summary
Applied the warm minimalist design system to all 8 recipe section files. Replaced every `neutral-*`, `gray-*`, `zinc-*`, `slate-*`, `stone-*` Tailwind class with the custom design tokens. Changed sharp corners to soft rounded shapes, neutral colors to warm tones, heavy shadows to soft ones.

## Files Changed

### 1. `src/components/recipe/IngredientList.tsx`
- Checkbox border: `border-neutral-300` → `border-border`
- Quantity text: `text-neutral-900` → `text-text`
- Unit text: `text-neutral-500` → `text-text-secondary`
- Optional text: `text-neutral-400` → `text-muted`

### 2. `src/components/recipe/RecipeCard.tsx`
- Container: `rounded-xl bg-white shadow-sm ring-1 ring-neutral-200` → `rounded-3xl bg-surface border border-border overflow-hidden`
- Hover: `hover:shadow-md` → `hover:shadow-card`
- Image placeholder: `bg-neutral-100` → `bg-surface-secondary`
- Title: `text-neutral-900` → `text-text`
- Description: `text-neutral-500` → `text-text-secondary`
- Meta: `text-neutral-500` → `text-muted`
- Tags: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`

### 3. `src/components/recipe/RecipeGeneratorModal.tsx`
- Sparkles icon: `text-amber-500` → `text-accent`
- Title: "AI Recipe Generator" → "Recipe Inspiration"
- Textarea: sharp `rounded-lg` with ring/shadow → `rounded-2xl bg-surface-secondary` with `focus:ring-accent/30`
- Loading: `text-neutral-500` → `text-muted`
- Generated title: `text-neutral-900` → `text-text`
- Generated description/ingredients/steps: `text-neutral-600` → `text-text-secondary`
- Step numbers: `text-neutral-900` → `text-text`
- Tags: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`

### 4. `src/components/recipe/StepList.tsx`
- Step numbers: `bg-neutral-900` → `bg-accent` (warm accent color)
- Connector line: `bg-neutral-200` → `bg-border`
- Title: `text-neutral-900` → `text-text`
- Content: `text-neutral-600` → `text-text-secondary`
- Timer: `text-neutral-400` → `text-muted`

### 5. `src/pages/RecipeList.tsx`
- Title: `text-2xl font-bold` → `text-3xl font-semibold tracking-tight text-text`
- Search input: full pill style — `rounded-full bg-surface-secondary` with `focus:ring-accent/30`
- Search icon: `text-neutral-400` → `text-muted`
- Tag filter: `rounded-full bg-surface-secondary border-0`
- Error: cold red box → `bg-accent-surface border-accent/20 text-accent` (warm)
- Empty state: "No recipes found" → "The kitchen is quiet", icon `text-muted`
- Grid: `gap-4` → `gap-5`

### 6. `src/pages/RecipeDetail.tsx`
- Back link: `text-neutral-600 hover:text-neutral-900` → `text-text-secondary hover:text-accent`
- Title: `text-neutral-900` → `text-text`
- Description: `text-neutral-600` → `text-text-secondary`
- Image container: `rounded-xl bg-neutral-100` → `rounded-3xl bg-surface-secondary`
- Section headings: `text-neutral-900` → `text-text`
- Sidebar: ring/shadow card → `soft-card` CSS utility
- Sidebar labels: `text-neutral-500` → `text-muted`
- Sidebar values: `text-neutral-900` → `text-text`
- Separator border: `border-neutral-100` → `border-border`
- Tags: `bg-neutral-100 text-neutral-600` → `bg-surface-secondary text-text-secondary`
- Delete button: cold red → warm `text-accent hover:text-accent/80 hover:bg-accent-surface`

### 7. `src/pages/RecipeEdit.tsx`
- Back link: `text-text-secondary hover:text-accent`
- Title: `text-text`
- All labels: `text-neutral-700` → `text-text-secondary font-medium`
- Description textarea: `rounded-2xl bg-surface-secondary` with accent focus ring
- Custom inputs (ingredient rows, step fields): `rounded-2xl bg-surface-secondary border-0` with `focus:ring-accent/30`
- Ingredient rows: removed shadow/ring → `bg-surface-secondary rounded-2xl`
- Step cards: `bg-neutral-50` → `bg-surface-secondary rounded-2xl`
- Step labels: `text-neutral-500` → `text-muted`
- Tag chips: `bg-neutral-100 text-neutral-700` → `bg-surface-secondary text-text`
- Remove X buttons: `text-neutral-400 hover:text-red-500` → `text-muted hover:text-red-600`
- Checkbox border: `border-neutral-300` → `border-border`
- Optional label: `text-neutral-500` → `text-muted`

### 8. `src/pages/CookingView.tsx`
- Background: `bg-neutral-900 text-white` → `bg-text text-surface`
- Header border: `border-neutral-800` → `border-border-subtle/10`
- Step counter: `text-neutral-400` → `text-muted`
- Exit button: `text-neutral-400 hover:text-white` → `text-muted hover:text-surface`
- Step title: `text-white` → `text-surface`
- Step content: `text-neutral-200` → `text-surface/80`
- Timer card: `bg-neutral-800` → `bg-surface-secondary/10 border border-border-subtle/30`
- Timer icon/label: `text-neutral-400` → `text-muted`
- Timer display: `text-white` → `text-surface`
- Footer border: `border-neutral-800` → `border-border-subtle/30`
- Nav buttons: `text-neutral-400 hover:text-white` → `text-muted hover:text-surface`
- Step dots: `bg-neutral-700` / `bg-white` → `bg-muted/30` / `bg-surface`
- Ingredients panel: `bg-neutral-800` → `bg-surface-secondary/10 border border-border-subtle/30`
- Ingredients text: `text-neutral-300` / `text-neutral-500` → `text-surface/70` / `text-muted`
- No-steps heading: `text-white` → `text-surface`, description: `text-neutral-400` → `text-muted`

## Validation
- ✅ `npm run build` (TypeScript + Vite) compiles cleanly
- ✅ Zero remaining `neutral-*`, `gray-*`, `zinc-*`, `slate-*`, `stone-*` classes in all 8 recipe files
- ✅ No component logic, hooks, data flow, or TypeScript types were changed
- ✅ Only styling, copy (one label), and spacing were modified

## Open Risks / Questions
- The `soft-card` utility adds `p-6` (24px) instead of the old `p-5` (20px) on the recipe detail sidebar — a slight layout shift. This is consistent with the design system.
- The cooking view timer "Reset" button uses `variant="ghost"` with a `text-muted` override. The ghost variant's hover state may apply `hover:text-text` (which is `#26211D` — dark), conflicting with the dark background. The `className` override should take precedence in most CSS specificity scenarios, but it's worth visual testing.

## Recommended Next Step
Continue design system application to remaining sections (Media, Wine, Chat) following the same pattern.
