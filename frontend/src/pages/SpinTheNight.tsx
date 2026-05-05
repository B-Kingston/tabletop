import { useState, useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Wine, ChefHat, Film, Save, Dices } from 'lucide-react'
import { useWines } from '@/hooks/useWines'
import { useRecipes } from '@/hooks/useRecipes'
import { useMedia } from '@/hooks/useMedia'
import { useCreateNight } from '@/hooks/useNights'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SlotMachine } from '@/components/night/SlotMachine'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'

type Category = 'wine' | 'recipe' | 'media'

const categories: { key: Category; label: string; icon: typeof Wine }[] = [
  { key: 'wine', label: 'Wine', icon: Wine },
  { key: 'recipe', label: 'Recipe', icon: ChefHat },
  { key: 'media', label: 'Media', icon: Film },
]

export function SpinTheNight() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const navigate = useNavigate()
  const createNight = useCreateNight(instanceId)
  const reducedMotion = useReducedMotion()

  const { data: wines, isLoading: winesLoading } = useWines(instanceId)
  const { data: recipes, isLoading: recipesLoading } = useRecipes(instanceId)
  const { data: mediaItems, isLoading: mediaLoading } = useMedia(instanceId)

  const [selected, setSelected] = useState<Set<Category>>(new Set(['wine', 'recipe', 'media']))
  const [spinResult, setSpinResult] = useState<{ wineId?: string; recipeId?: string; mediaId?: string } | null>(null)
  const [nightName, setNightName] = useState('')

  const isLoading = winesLoading || recipesLoading || mediaLoading

  const toggleCategory = useCallback((cat: Category) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
    setSpinResult(null)
  }, [])

  const handleSpinComplete = useCallback(
    (result: { wineId?: string; recipeId?: string; mediaId?: string }) => {
      setSpinResult(result)
      // Auto-generate name from selected items
      const parts: string[] = []
      if (result.wineId && wines) {
        const w = wines.find((x: { id: string; name: string }) => x.id === result.wineId)
        if (w) parts.push(w.name)
      }
      if (result.recipeId && recipes) {
        const r = recipes.find((x) => x.id === result.recipeId)
        if (r) parts.push(r.title)
      }
      if (result.mediaId && mediaItems) {
        const m = mediaItems.find((x) => x.id === result.mediaId)
        if (m) parts.push(m.title)
      }
      if (parts.length > 0) {
        let name = parts.join(' & ')
        if (name.length > 54) name = name.slice(0, 51) + '...'
        setNightName(name + ' Night')
      } else {
        setNightName('New Night')
      }
    },
    [wines, recipes, mediaItems]
  )

  function handleSave() {
    if (!spinResult) return
    createNight.mutate(
      {
        name: nightName,
        wineId: spinResult.wineId ?? null,
        recipeId: spinResult.recipeId ?? null,
        mediaId: spinResult.mediaId ?? null,
      },
      {
        onSuccess: (night) =>
          navigate({
            to: '/instances/$instanceId/nights/$nightId',
            params: { instanceId, nightId: night.id },
          }),
      }
    )
  }

  const allEmpty = !wines?.length && !recipes?.length && !mediaItems?.length

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.25 }}
        className="max-w-3xl mx-auto"
      >
        <button
          onClick={() =>
            navigate({ to: '/instances/$instanceId/nights', params: { instanceId } })
          }
          className="mb-6 flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Nights
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
            Spin the Night
          </h1>
          <p className="text-sm text-neutral-600">
            Select which categories to include, then spin for a random combination.
          </p>
        </div>

        {isLoading ? (
          <GridSkeleton count={3} />
        ) : allEmpty ? (
          <div className="text-center py-12">
            <Dices className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Nothing to spin yet</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Add some wines, recipes, or media items first.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate({ to: '/instances/$instanceId/wines/new', params: { instanceId } })}
              >
                Add Wine
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate({ to: '/instances/$instanceId/recipes/new', params: { instanceId } })}
              >
                Add Recipe
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate({ to: '/instances/$instanceId/media', params: { instanceId } })}
              >
                Add Media
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-3 mb-8">
              {categories.map(({ key, label, icon: Icon }) => {
                const isSelected = selected.has(key)
                const hasItems =
                  (key === 'wine' && !!wines?.length) ||
                  (key === 'recipe' && !!recipes?.length) ||
                  (key === 'media' && !!mediaItems?.length)

                return (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    disabled={!hasItems}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 text-white'
                        : hasItems
                        ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {!hasItems && ' (empty)'}
                  </button>
                )
              })}
            </div>

            <SlotMachine
              wines={wines ?? []}
              recipes={recipes ?? []}
              media={mediaItems ?? []}
              selectedCategories={Array.from(selected)}
              onComplete={handleSpinComplete}
            />

            <AnimatePresence>
              {spinResult && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  exit={reducedMotion ? {} : { opacity: 0, y: 20 }}
                  transition={{ duration: reducedMotion ? 0 : 0.3 }}
                  className="mt-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200"
                >
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">Your Night</h2>

                  <div className="space-y-3 mb-6">
                    {spinResult.wineId && wines && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                          <Wine className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="text-sm text-neutral-700">
                          {wines.find((w) => w.id === spinResult.wineId)?.name}
                        </span>
                      </div>
                    )}
                    {spinResult.recipeId && recipes && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                          <ChefHat className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="text-sm text-neutral-700">
                          {recipes.find((r) => r.id === spinResult.recipeId)?.title}
                        </span>
                      </div>
                    )}
                    {spinResult.mediaId && mediaItems && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                          <Film className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-neutral-700">
                          {mediaItems.find((m) => m.id === spinResult.mediaId)?.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="night-name" className="block text-sm font-medium text-neutral-700 mb-1">
                        Name
                      </label>
                      <Input
                        id="night-name"
                        value={nightName}
                        onChange={(e) => setNightName(e.target.value)}
                        placeholder="Give your night a name"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleSave} disabled={createNight.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {createNight.isPending ? 'Saving...' : 'Save Night'}
                      </Button>
                      <Button variant="secondary" onClick={() => setSpinResult(null)}>
                        <Dices className="mr-2 h-4 w-4" />
                        Spin Again
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </ErrorBoundary>
  )
}
