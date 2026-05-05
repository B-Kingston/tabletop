import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useCreateNight, useUpdateNight, useNight } from '@/hooks/useNights'
import { useWines } from '@/hooks/useWines'
import { useRecipes } from '@/hooks/useRecipes'
import { useMedia } from '@/hooks/useMedia'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function NightEdit() {
  const { instanceId, nightId } = useParams({ strict: false }) as {
    instanceId: string
    nightId?: string
  }
  const navigate = useNavigate()
  const isEdit = !!nightId

  const { data: existingNight, isLoading: nightLoading } = useNight(
    instanceId,
    nightId ?? ''
  )
  const createNight = useCreateNight(instanceId)
  const updateNight = useUpdateNight(instanceId)

  const { data: wines, isLoading: winesLoading } = useWines(instanceId)
  const { data: recipes, isLoading: recipesLoading } = useRecipes(instanceId)
  const { data: mediaItems, isLoading: mediaLoading } = useMedia(instanceId)

  const [name, setName] = useState('')
  const [wineId, setWineId] = useState('')
  const [recipeId, setRecipeId] = useState('')
  const [mediaId, setMediaId] = useState('')

  useEffect(() => {
    if (existingNight) {
      setName(existingNight.name)
      setWineId(existingNight.wineId ?? '')
      setRecipeId(existingNight.recipeId ?? '')
      setMediaId(existingNight.mediaId ?? '')
    }
  }, [existingNight])

  const isLoading = winesLoading || recipesLoading || mediaLoading || (isEdit && nightLoading)
  const isPending = createNight.isPending || updateNight.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isEdit && nightId) {
      updateNight.mutate(
        {
          nightId,
          name: name || undefined,
          wineId: wineId || null,
          recipeId: recipeId || null,
          mediaId: mediaId || null,
          clearWine: existingNight?.wineId && !wineId ? true : undefined,
          clearRecipe: existingNight?.recipeId && !recipeId ? true : undefined,
          clearMedia: existingNight?.mediaId && !mediaId ? true : undefined,
        },
        {
          onSuccess: (night) =>
            navigate({
              to: '/instances/$instanceId/nights/$nightId',
              params: { instanceId, nightId: night.id },
            }),
        }
      )
    } else {
      createNight.mutate(
        {
          name: name || undefined,
          wineId: wineId || null,
          recipeId: recipeId || null,
          mediaId: mediaId || null,
        },
        {
          onSuccess: (night) =>
          navigate({
            to: '/instances/$instanceId/nights/$nightId',
            params: { instanceId, nightId: night.id },
          }),
      })
    }
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
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

        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-6">
          {isEdit ? 'Edit Night' : 'New Night'}
        </h1>

        {isLoading ? (
          <div className="space-y-4 max-w-lg animate-pulse">
            <div className="h-10 bg-neutral-200 rounded-lg" />
            <div className="h-10 bg-neutral-200 rounded-lg" />
            <div className="h-10 bg-neutral-200 rounded-lg" />
            <div className="h-10 bg-neutral-200 rounded-lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="night-name" className="block text-sm font-medium text-neutral-700 mb-1">
                Name
              </label>
              <Input
                id="night-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Date Night"
              />
            </div>

            <div>
              <label htmlFor="night-wine" className="block text-sm font-medium text-neutral-700 mb-1">
                Wine
              </label>
              <select
                id="night-wine"
                value={wineId}
                onChange={(e) => setWineId(e.target.value)}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm"
              >
                <option value="">— None —</option>
                {wines?.map((wine) => (
                  <option key={wine.id} value={wine.id}>
                    {wine.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="night-recipe" className="block text-sm font-medium text-neutral-700 mb-1">
                Recipe
              </label>
              <select
                id="night-recipe"
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm"
              >
                <option value="">— None —</option>
                {recipes?.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="night-media" className="block text-sm font-medium text-neutral-700 mb-1">
                Media
              </label>
              <select
                id="night-media"
                value={mediaId}
                onChange={(e) => setMediaId(e.target.value)}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm"
              >
                <option value="">— None —</option>
                {mediaItems?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Night'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  navigate({ to: '/instances/$instanceId/nights', params: { instanceId } })
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </ErrorBoundary>
  )
}
