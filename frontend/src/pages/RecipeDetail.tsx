import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Pencil, ChefHat, Trash2 } from 'lucide-react'
import { useRecipe, useDeleteRecipe } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { IngredientList } from '@/components/recipe/IngredientList'
import { StepList } from '@/components/recipe/StepList'
import { useState } from 'react'

export function RecipeDetail() {
  const { instanceId, recipeId } = useParams({ strict: false }) as { instanceId: string; recipeId: string }
  const navigate = useNavigate()
  const { data: recipe, isLoading, error } = useRecipe(instanceId, recipeId)
  const deleteRecipe = useDeleteRecipe(instanceId)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) return <DetailSkeleton />

  if (error || !recipe) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load recipe. Please try again.
      </div>
    )
  }

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
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">{recipe.title}</h1>
                {recipe.description && (
                  <p className="mt-1 text-text-secondary">{recipe.description}</p>
                )}
              </div>
              <div className="flex gap-2">
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

            <Button
              variant="ghost"
              className="w-full text-accent hover:text-accent/80 hover:bg-accent-surface"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Recipe
            </Button>
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
      </motion.div>
    </ErrorBoundary>
  )
}
