import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Wine, ChefHat, Film } from 'lucide-react'
import { SpinReel } from './SpinReel'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Wine as WineType, Recipe, MediaItem } from '@/types/models'

interface SlotMachineProps {
  wines: WineType[]
  recipes: Recipe[]
  media: MediaItem[]
  selectedCategories: ('wine' | 'recipe' | 'media')[]
  onComplete: (result: { wineId?: string; recipeId?: string; mediaId?: string }) => void
  spinDurationMs?: number
}

const DEFAULT_SPIN_DURATION = 5000
const REEL_STAGGER_MS = 600

export function SlotMachine({ wines, recipes, media, selectedCategories, onComplete, spinDurationMs = DEFAULT_SPIN_DURATION }: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [, setSettledCount] = useState(0)
  // Use ref for final selections so handleSettled always reads the latest values
  // (avoids stale closure when reduced-motion path updates state asynchronously)
  const finalSelections = useRef<{
    wine?: { id: string; name: string }
    recipe?: { id: string; name: string }
    media?: { id: string; name: string }
  }>({})
  const reducedMotion = useReducedMotion()

  const categoryConfig = {
    wine: { label: 'Wine', icon: Wine, items: wines.map((w) => ({ id: w.id, name: w.name })) },
    recipe: { label: 'Recipe', icon: ChefHat, items: recipes.map((r) => ({ id: r.id, name: r.title })) },
    media: { label: 'Media', icon: Film, items: media.map((m) => ({ id: m.id, name: m.title })) },
  }

  const activeCategories = selectedCategories.filter((cat) => {
    const config = categoryConfig[cat]
    return config.items.length > 0
  })

  const canSpin = activeCategories.length > 0 && !isSpinning

  const handleSpin = useCallback(() => {
    if (!canSpin) return

    const selections: typeof finalSelections.current = {}
    selectedCategories.forEach((cat) => {
      const items = categoryConfig[cat].items
      if (items.length > 0) {
        const pick = items[Math.floor(Math.random() * items.length)]
        selections[cat] = pick
      }
    })
    finalSelections.current = selections

    if (reducedMotion) {
      // Skip animation entirely, call onComplete immediately with fresh selections
      onComplete({
        wineId: selections.wine?.id,
        recipeId: selections.recipe?.id,
        mediaId: selections.media?.id,
      })
      return
    }

    setIsSpinning(true)
    setSettledCount(0)
  }, [canSpin, selectedCategories, reducedMotion, onComplete])

  const handleSettled = useCallback(() => {
    setSettledCount((prev) => {
      const next = prev + 1
      if (next >= activeCategories.length) {
        setIsSpinning(false)
        const s = finalSelections.current
        onComplete({
          wineId: s.wine?.id,
          recipeId: s.recipe?.id,
          mediaId: s.media?.id,
        })
      }
      return next
    })
  }, [activeCategories.length, onComplete])

  const hasEmptyCategories = selectedCategories.some((cat) => categoryConfig[cat].items.length === 0)

  return (
    <div className="flex flex-col items-center gap-8">
      {hasEmptyCategories && (
        <div className="rounded-lg bg-accent-surface px-4 py-3 text-sm text-accent">
          Some selected categories have no items yet. Only categories with items will spin.
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        {selectedCategories.map((cat, index) => {
          const config = categoryConfig[cat]
          const isActive = config.items.length > 0
          const stopDelay = spinDurationMs - (activeCategories.length - 1 - index) * REEL_STAGGER_MS

          return (
            <SpinReel
              key={cat}
              icon={config.icon}
              label={config.label}
              items={config.items}
              finalItem={isActive ? finalSelections.current[cat] ?? null : null}
              isSpinning={isSpinning && isActive}
              stopDelayMs={stopDelay}
              onSettled={handleSettled}
            />
          )
        })}
      </div>

      <motion.button
        whileHover={canSpin ? { scale: 1.03 } : {}}
        whileTap={canSpin ? { scale: 0.97 } : {}}
        onClick={handleSpin}
        disabled={!canSpin}
        className={`rounded-full px-8 py-3 text-base font-semibold transition-colors ${
          canSpin
            ? 'bg-accent text-white shadow-soft hover:bg-accent/90'
            : 'bg-surface-secondary text-muted cursor-not-allowed'
        }`}
      >
        {isSpinning ? 'Spinning...' : 'Spin the Night'}
      </motion.button>
    </div>
  )
}
