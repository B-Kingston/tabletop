# Task 5: Warm Minimalist Design — Chat, Messages & Nights

## Summary

Applied the warm minimalist design system to all 12 Chat, Messages & Nights files. Replaced all neutral/gray/zinc/slate/stone Tailwind classes with the warm design tokens (`bg-surface`, `text-text`, `text-muted`, `bg-accent`, `bg-accent-surface`, `bg-border`, etc.).

## Changed Files (12 target + 3 side-effect)

### Chat Section
1. **`src/components/chat/ChatInput.tsx`** — border-t border-border, rounded-2xl bg-surface-secondary textarea, accent/30 focus ring, placeholder:text-muted
2. **`src/components/chat/ChatMessage.tsx`** — bg-accent user bubble, bg-surface text-text assistant bubble, text-muted AI label
3. **`src/components/chat/RecipeSuggestionCard.tsx`** — rounded-3xl bg-surface card, bg-accent-surface icon container, bg-surface-secondary ingredient tags, strokeWidth={1.5}
4. **`src/pages/ChatPage.tsx`** — border-r border-border sidebar, bg-surface-secondary/text-text active sessions, text-muted hover:text-red-600 delete, "Start a new conversation" empty state
5. **`src/pages/MemberMessagesPage.tsx`** — bg-accent-surface text-accent header icon, soft-card p-4 messages, text-text sender, text-muted timestamps, "The conversation hasn't started"

### Nights Section
6. **`src/components/night/NightCard.tsx`** — rounded-3xl bg-surface border-border, hover:shadow-card, bg-surface-secondary has-item pills, bg-border avatar placeholder, text-muted creator
7. **`src/components/night/SlotMachine.tsx`** — bg-accent-surface text-accent warning, bg-accent text-white shadow-soft spin button, bg-surface-secondary text-muted disabled
8. **`src/components/night/SpinReel.tsx`** — rounded-3xl bg-surface border-border container, bg-surface-secondary icon circles, text-text settled name, text-muted labels, strokeWidth={1.5} icons
9. **`src/pages/NightDetail.tsx`** — text-text-secondary hover:text-accent back link, soft-card-hover p-5 linked items, bg-surface-secondary/50 border-border empty, text-text item names, text-muted meta
10. **`src/pages/NightEdit.tsx`** — rounded-full bg-surface-secondary selects with accent/30 focus ring, text-text-secondary font-medium labels, bg-border rounded-2xl skeletons
11. **`src/pages/NightList.tsx`** — text-3xl font-semibold title, text-muted Moon icon, "No evenings planned yet", gap-5 grid, rounded-full bg-surface-secondary sort select
12. **`src/pages/SpinTheNight.tsx`** — bg-accent text-white selected toggle, bg-surface-secondary hover:bg-surface unselected, bg-surface-secondary/50 text-muted disabled, soft-card result card, bg-accent-surface text-accent wine/recipe icons

### Side-effect fixes (pre-existing TS errors)
- **`src/components/ui/ConfirmDialog.tsx`** — fixed `'destructive'` variant not in Button types
- **`src/pages/Dashboard.tsx`** — removed unused `MessageSquare` import

## Validation

```
npm run build → tsc + vite build: ✓ SUCCESS
```

## Open Risks / Questions

- None. All neutral-* classes were replaced; no logic, hooks, or types modified.
- The SlotMachine spin button keeps the `motion.button` wrapper for Framer Motion while-tap/while-hover but uses the warm Button design tokens (bg-accent, shadow-soft, hover:bg-accent/90).

## Recommended Next Step

Continue with any remaining sections that need the warm minimalist design system applied (e.g., Recipe section, Instance/Dashboard pages, or UI primitives).
