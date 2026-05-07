# Tabletop — Warm Minimalist Design Specification

## Design Philosophy
A beautifully designed shared home, not a productivity tool. Muji meets modern SaaS. A digital living room. Warm Scandinavian minimalism. Quiet luxury. Tactile interfaces. Emotionally intelligent UI.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F4F3EE` | Page background — warm cream/linen |
| `--surface` | `#FFFFFF` | Card surfaces |
| `--surface-secondary` | `#EDE9DF` | Secondary surfaces, hover states, subtle backgrounds |
| `--accent` | `#C15F3C` | Warm clay orange — active states, CTAs, highlights, focus rings |
| `--accent-surface` | `#FFF3EA` | Accent backgrounds, badges, glows |
| `--text` | `#26211D` | Primary text — warm near-black |
| `--text-secondary` | `#6B6560` | Secondary text — warm gray |
| `--text-muted` | `#B1ADA1` | Muted labels, placeholders, disabled |
| `--border` | `#E8E4DC` | Card borders, dividers — warm thin borders |
| `--border-subtle` | `#F0EDE6` | Very subtle dividers |

## No-Go Colors
- No harsh blacks (`#000000`)
- No pure grays (`#808080`, `#9CA3AF`)
- No blue accents
- No aggressive saturation
- No sterile monochrome

## Typography

- Font: Inter (already in project)
- Tight tracking on headlines (`tracking-tight`)
- Large bold hero typography
- Minimal font weights: 400, 500, 600, 700
- Editorial feeling

Scale:
- Hero: `text-5xl font-bold tracking-tight` (mobile: `text-3xl`)
- H1: `text-3xl font-semibold tracking-tight`
- H2: `text-xl font-semibold`
- H3: `text-lg font-medium`
- Body: `text-sm` or `text-base` with `leading-relaxed`
- Small/label: `text-xs font-medium uppercase tracking-wide`

## Spacing

- Generous breathing room. Default page padding: `px-6 py-8` (mobile: `px-4 py-6`)
- Card padding: `p-6` (large cards), `p-4` (compact)
- Section gap: `gap-6` to `gap-8`
- Card radius: `rounded-[20px]` to `rounded-[24px]`
- Button radius: `rounded-full` (pill)
- Input radius: `rounded-full` (pill)

## Component Style Rules

### Buttons
- Pill shape (`rounded-full`)
- Compact (`px-5 py-2.5 text-sm`)
- Primary: `bg-accent text-white` with subtle shadow
- Secondary: `bg-surface text-text border border-border`
- Ghost: `bg-transparent text-text-secondary hover:bg-surface-secondary`
- Hover: warm state transitions (`transition-colors duration-150`)
- Focus ring: `ring-2 ring-accent/30 ring-offset-2 ring-offset-bg`

### Cards
- Soft radius: `rounded-[20px]` to `rounded-[24px]`
- Thin warm border: `border border-border`
- Background: `bg-surface`
- Minimal shadow: `shadow-sm` or none (prefer border for depth)
- Layered but calm

### Inputs
- Pill shape (`rounded-full`)
- Soft background: `bg-surface-secondary`
- Warm focus ring: `focus:ring-2 focus:ring-accent/40`
- Subtle inset feel
- Placeholder: `text-muted`

### Segmented Controls / Tabs
- Rounded capsule container: `rounded-full bg-surface-secondary p-1`
- Active: `bg-surface text-text shadow-sm`
- Inactive: `text-text-muted hover:text-text`

### Navigation (Floating Pill)
- Fixed/sticky at top
- Capsule container: `rounded-full` with glassmorphism
- Background: `bg-surface/80 backdrop-blur-xl`
- Border: `border border-border/50`
- Active tab: accent color + small dot or underline
- Inactive: muted taupe
- Thin outline icons (Lucide, strokeWidth 1.5)
- Shadow: `shadow-sm shadow-black/5`

## Animation
- Subtle hover transitions: `150–200ms`
- Easing: `ease-out` or `cubic-bezier(0.4, 0, 0.2, 1)`
- Page transitions: gentle fade/slide
- Framer Motion for page-level animations

## Layout

### App Shell
- Floating centered container feel
- Max width: `max-w-6xl` or `max-w-7xl` centered
- Background: `--bg` on body/html
- Content cards float on this warm canvas

### Instance Layout
- Remove heavy top bar
- Replace with floating pill nav centered at top
- Remove sidebar entirely
- Content area has generous padding
- Mobile: pill nav becomes bottom sheet or stays as floating pill

## Section Design Notes

### Home/Dashboard
- Emotional hero: "This evening" or "Welcome home"
- Small ambient details (who's home, dinner status, episodes queued)
- Cards for tonight's plan, recent activity, quick actions
- No productivity language. Use: "shared rituals", "quiet evenings", "cozy planning"

### Media
- Curated shelf feel
- Poster cards with soft gradient overlays
- Emotional labels: "Movie night", "Rain outside", "Sunday sofa", "Comfort rewatch"
- Empty state: warm glow, inviting illustration

### Recipes
- Beautiful recipe cards with image, title, tags
- Cooking view: large, readable from 2 meters, warm tones

### Wines
- Elegant bottle cards
- Rating with warm stars
- Notes feel like a journal entry

### Nights
- Event cards with mood/ambiance
- Spin-the-night feature feels playful

### Messages
- Chat bubbles with soft rounded corners
- Warm message input area

### Assistant
- Calm, conversational interface
- Subtle accent on AI responses
