import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Plus, Search, Sparkles } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { Button } from '@/components/ui/Button'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeGeneratorModal } from '@/components/recipe/RecipeGeneratorModal'

export function RecipeList() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const navigate = useNavigate()
  const [tagFilter, setTagFilter] = useState('')
  const [search, setSearch] = useState('')
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const { data: recipes, isLoading, error } = useRecipes(instanceId, tagFilter || undefined)

  const filtered = recipes?.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  )

  const allTags = Array.from(new Set(recipes?.flatMap((r) => r.tags?.map((t) => t.name) ?? []) ?? []))

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Recipes</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setGeneratorOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Button>
            <Button
              size="sm"
              onClick={() =>
                navigate({
                  to: '/instances/$instanceId/recipes/new',
                  params: { instanceId },
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New Recipe
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm"
            />
          </div>
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-lg border-0 py-2.5 px-3 text-sm text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-inset focus:ring-neutral-900"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-4">
            Failed to load recipes. Please try again.
          </div>
        )}

        {isLoading && <GridSkeleton count={6} />}

        {filtered && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No recipes found</h3>
            <p className="text-sm text-neutral-600">
              {search || tagFilter ? 'Try adjusting your filters.' : 'Create your first recipe to get started.'}
            </p>
          </div>
        )}

        {filtered && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} instanceId={instanceId} />
            ))}
          </div>
        )}

        <RecipeGeneratorModal open={generatorOpen} onClose={() => setGeneratorOpen(false)} instanceId={instanceId} />
      </motion.div>
    </ErrorBoundary>
  )
}
