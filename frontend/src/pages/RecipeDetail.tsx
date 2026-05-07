import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Pencil, ChefHat, Trash2, Sparkles, Loader2, History, RotateCcw, ExternalLink } from 'lucide-react'
import {
  useRecipe,
  useDeleteRecipe,
  useRecipeVersions,
  useRemixRecipe,
  useRestoreRecipeVersion,
} from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { IngredientList } from '@/components/recipe/IngredientList'
import { StepList } from '@/components/recipe/StepList'
import { getRecipeSourceLinks } from '@/lib/sourceUtils'
import { useState } from 'react'

export function RecipeDetail() {
  const { instanceId, recipeId } = useParams({ strict: false }) as { instanceId: string; recipeId: string }
  const navigate = useNavigate()
  const { data: recipe, isLoading, error } = useRecipe(instanceId, recipeId)
  const { data: versions = [] } = useRecipeVersions(instanceId, recipeId)
  const remixRecipe = useRemixRecipe(instanceId, recipeId)
  const restoreVersion = useRestoreRecipeVersion(instanceId, recipeId)
  const deleteRecipe = useDeleteRecipe(instanceId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [remixOpen, setRemixOpen] = useState(false)
  const [remixPrompt, setRemixPrompt] = useState('')
  const [remixSimplicity, setRemixSimplicity] = useState(3)
  const [remixError, setRemixError] = useState('')

  if (isLoading) return <DetailSkeleton />

  if (error || !recipe) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load recipe. Please try again.
      </div>
    )
  }

  const sourceLinks = getRecipeSourceLinks([...(recipe.sourceUrls ?? []), recipe.sourceUrl])

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => navigate({ to: '/instances/$instanceId/recipes', params: { instanceId } })}
          className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recipes
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">{recipe.title}</h1>
                {recipe.description && (
                  <p className="mt-1 text-text-secondary">{recipe.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRemixOpen(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Remix
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: '/instances/$instanceId/recipes/$recipeId/edit',
                      params: { instanceId, recipeId },
                    })
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: '/instances/$instanceId/recipes/$recipeId/cook',
                      params: { instanceId, recipeId },
                    })
                  }
                >
                  <ChefHat className="mr-2 h-4 w-4" />
                  Cook
                </Button>
              </div>
            </div>

            {recipe.imageUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-3xl bg-surface-secondary mb-6">
                <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
              </div>
            )}

            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-text mb-3">Ingredients</h2>
                <IngredientList ingredients={recipe.ingredients} />
              </div>
            )}

            {recipe.steps && recipe.steps.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text mb-3">Instructions</h2>
                <StepList steps={recipe.steps} />
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="soft-card space-y-4">
              {(recipe.prepTime > 0 || recipe.cookTime > 0) && (
                <div className="space-y-2 text-sm">
                  {recipe.prepTime > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">Prep time</span>
                      <span className="font-medium text-text">{recipe.prepTime} min</span>
                    </div>
                  )}
                  {recipe.cookTime > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">Cook time</span>
                      <span className="font-medium text-text">{recipe.cookTime} min</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted">Total</span>
                    <span className="font-medium text-text">{recipe.prepTime + recipe.cookTime} min</span>
                  </div>
                </div>
              )}
              {recipe.servings > 0 && (
                <div className="text-sm">
                  <span className="text-muted">Servings</span>
                  <span className="ml-2 font-medium text-text">{recipe.servings}</span>
                </div>
              )}
              {recipe.rating !== null && recipe.rating !== undefined && (
                <div>
                  <span className="text-sm text-muted">Rating</span>
                  <div className="mt-1">
                    <StarRating value={recipe.rating} readonly size="sm" />
                  </div>
                </div>
              )}
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {versions.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-text">
                  <History className="h-4 w-4 text-accent" />
                  Versions
                </div>
                <div className="space-y-2">
                  {versions.map((version) => {
                    const versionTitle = version.snapshot?.title || `Version ${version.versionNumber}`
                    return (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => {
                          if (!version.isCurrent) restoreVersion.mutate(version.id)
                        }}
                        disabled={version.isCurrent || restoreVersion.isPending}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-secondary px-3 py-2 text-left text-sm transition hover:bg-accent-surface disabled:cursor-default disabled:hover:bg-surface-secondary"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-text">{versionTitle}</span>
                          <span className="block truncate text-xs text-muted">
                            {version.remixPrompt || 'Original recipe'}
                          </span>
                        </span>
                        {version.isCurrent ? (
                          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            Current
                          </span>
                        ) : (
                          <RotateCcw className="h-4 w-4 shrink-0 text-muted" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <Button
              variant="ghost"
              className="w-full text-accent hover:text-accent/80 hover:bg-accent-surface"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Recipe
            </Button>

            {sourceLinks.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-text">Sources</h2>
                  <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                    {sourceLinks.length}
                  </span>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-border bg-surface px-2 py-2">
                  {sourceLinks.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-text-secondary transition hover:bg-surface-secondary hover:text-accent"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
                        <img src={source.faviconUrl} alt="" className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{source.host}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() =>
            deleteRecipe.mutate(recipeId, {
              onSuccess: () => navigate({ to: '/instances/$instanceId/recipes', params: { instanceId } }),
            })
          }
          title="Delete Recipe"
          description="Are you sure you want to delete this recipe? This action cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          loading={deleteRecipe.isPending}
        />

        <Dialog open={remixOpen} onClose={() => setRemixOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Remix Recipe
              </span>
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const prompt = remixPrompt.trim()
              if (!prompt) return
              setRemixError('')
              remixRecipe.mutate({ prompt, simplicity: remixSimplicity }, {
                onSuccess: () => {
                  setRemixOpen(false)
                  setRemixPrompt('')
                  setRemixSimplicity(3)
                },
                onError: (err: unknown) => {
                  const status = (err as { response?: { status?: number } })?.response?.status
                  if (status === 429) {
                    setRemixError('Daily AI limit reached. Try again tomorrow.')
                  } else if (status === 502 || status === 503) {
                    setRemixError('AI service temporarily unavailable.')
                  } else if (status === 422) {
                    setRemixError('AI returned an unexpected response. Please try again.')
                  } else {
                    setRemixError('Failed to remix recipe. Please try again.')
                  }
                },
              })
            }}
          >
            <DialogBody>
              <div>
                <label htmlFor="recipe-remix-prompt" className="block text-sm font-medium text-text-secondary mb-1">
                  What should change?
                </label>
                <textarea
                  id="recipe-remix-prompt"
                  value={remixPrompt}
                  onChange={(e) => setRemixPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g., Make it vegetarian, double the servings, turn it into a one-pot dinner..."
                  className="block w-full resize-none rounded-2xl bg-surface-secondary px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              </div>
              <div className="rounded-2xl bg-surface-secondary px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="recipe-remix-simplicity" className="text-sm font-medium text-text-secondary">
                    Recipe simplicity
                  </label>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-text">
                    {remixSimplicity}/5
                  </span>
                </div>
                <input
                  id="recipe-remix-simplicity"
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={remixSimplicity}
                  onChange={(e) => setRemixSimplicity(Number(e.target.value))}
                  className="mt-3 w-full accent-accent"
                />
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>Quick</span>
                  <span>Ambitious</span>
                </div>
              </div>
              {remixError && <p className="text-sm text-red-600">{remixError}</p>}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setRemixOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!remixPrompt.trim() || remixRecipe.isPending}>
                {remixRecipe.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Remixing...
                  </>
                ) : (
                  'Remix Recipe'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </motion.div>
    </ErrorBoundary>
  )
}
