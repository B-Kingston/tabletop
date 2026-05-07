import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2, Sparkles, Wine, ChefHat, Film, AlertCircle } from 'lucide-react'
import { useNight, useUpdateNight, useDeleteNight } from '@/hooks/useNights'
import { useWines } from '@/hooks/useWines'
import { useRecipes } from '@/hooks/useRecipes'
import { useMedia } from '@/hooks/useMedia'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Wine as WineType, Recipe as RecipeType, MediaItem } from '@/types/models'

type LinkedItem = WineType | RecipeType | MediaItem | null | undefined

function getItemLabel(item: NonNullable<LinkedItem>): string {
  if ('name' in item && item.name) return item.name
  if ('title' in item && item.title) return item.title
  return 'Unknown'
}

export function NightDetail() {
  const { instanceId, nightId } = useParams({ strict: false }) as {
    instanceId: string
    nightId: string
  }
  const navigate = useNavigate()
  const { data: night, isLoading, error } = useNight(instanceId, nightId)
  const updateNight = useUpdateNight(instanceId)
  const deleteNight = useDeleteNight(instanceId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  // Pre-warm linked-item caches for instant navigation
  useWines(instanceId)
  useRecipes(instanceId)
  useMedia(instanceId)

  useEffect(() => {
    if (night) {
      setName(night.name)
    }
  }, [night])

  if (isLoading) return <DetailSkeleton />

  if (error || !night) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load night. Please try again.
      </div>
    )
  }

  function handleSave() {
    updateNight.mutate(
      { nightId, name },
      { onSuccess: () => setEditing(false) }
    )
  }

  function handleDelete() {
    deleteNight.mutate(nightId, {
      onSuccess: () => navigate({ to: '/instances/$instanceId/nights', params: { instanceId } }),
    })
  }

  function handleRespin() {
    navigate({
      to: '/instances/$instanceId/nights/spin',
      params: { instanceId },
    })
  }

  const linkedItems = [
    {
      key: 'wine' as const,
      label: 'Wine',
      icon: Wine,
      item: night.wine,
      id: night.wineId,
      path: '/instances/$instanceId/wines/$wineId' as const,
      paramKey: 'wineId' as const,
    },
    {
      key: 'recipe' as const,
      label: 'Recipe',
      icon: ChefHat,
      item: night.recipe,
      id: night.recipeId,
      path: '/instances/$instanceId/recipes/$recipeId' as const,
      paramKey: 'recipeId' as const,
    },
    {
      key: 'media' as const,
      label: 'Media',
      icon: Film,
      item: night.media,
      id: night.mediaId,
      path: '/instances/$instanceId/media/$mediaId' as const,
      paramKey: 'mediaId' as const,
    },
  ]

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => navigate({ to: '/instances/$instanceId/nights', params: { instanceId } })}
          className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Nights
        </button>

        <div className="max-w-2xl space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xl font-bold"
                />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-text">{night.name}</h1>
              )}
              <p className="text-sm text-muted mt-1">
                Created {new Date(night.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <Button size="sm" onClick={handleSave} disabled={updateNight.isPending}>
                  {updateNight.isPending ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleRespin}>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Respin
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {linkedItems.map(({ key, label, icon: Icon, item, id, path, paramKey }) => {
              const wasDeleted = !item && !!id

              return (
                <div
                  key={key}
                  className={`${
                    item
                      ? 'soft-card-hover p-5 cursor-pointer'
                      : wasDeleted
                      ? 'rounded-xl p-5 shadow-sm bg-red-50 ring-1 ring-red-200'
                      : 'rounded-xl p-5 bg-surface-secondary/50 border border-border'
                  }`}
                  onClick={() => {
                    if (item) {
                      navigate({
                        to: path,
                        params: { instanceId, [paramKey]: item.id } as Record<string, string>,
                      })
                    }
                  }}
                  role={item ? 'button' : undefined}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary">
                      <Icon className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-medium text-muted uppercase tracking-wide">
                      {label}
                    </span>
                  </div>

                  {item ? (
                    <div>
                      <p className="font-medium text-text text-sm">{getItemLabel(item)}</p>
                      {'type' in item && typeof item.type === 'string' && (
                        <p className="text-xs text-muted capitalize mt-1">{item.type}</p>
                      )}
                    </div>
                  ) : wasDeleted ? (
                    <div className="flex items-center gap-1.5 text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="text-sm">Deleted item</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted">Not selected</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Night"
          description="Are you sure you want to delete this night plan?"
          confirmLabel="Delete"
          variant="destructive"
          loading={deleteNight.isPending}
        />
      </motion.div>
    </ErrorBoundary>
  )
}
