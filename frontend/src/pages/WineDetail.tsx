import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useWine, useUpdateWine, useDeleteWine } from '@/hooks/useWines'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StarRating } from '@/components/ui/StarRating'
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const wineTypes = ['red', 'white', 'rose', 'sparkling', 'port'] as const

export function WineDetail() {
  const { instanceId, wineId } = useParams({ strict: false }) as { instanceId: string; wineId: string }
  const navigate = useNavigate()
  const { data: wine, isLoading, error } = useWine(instanceId, wineId)
  const updateWine = useUpdateWine(instanceId)
  const deleteWine = useDeleteWine(instanceId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('red')
  const [cost, setCost] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [consumedAt, setConsumedAt] = useState('')

  useEffect(() => {
    if (wine) {
      setName(wine.name)
      setType(wine.type)
      setCost(wine.cost?.toString() ?? '')
      setRating(wine.rating ?? 0)
      setNotes(wine.notes ?? '')
      setConsumedAt(wine.consumedAt ? wine.consumedAt.split('T')[0] : '')
    }
  }, [wine])

  if (isLoading) return <DetailSkeleton />

  if (error || !wine) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-rose-700">
        Failed to load wine. Please try again.
      </div>
    )
  }

  function handleSave() {
    updateWine.mutate(
      {
        wineId,
        name,
        type,
        cost: cost ? Number(cost) : null,
        rating: rating || null,
        notes: notes || undefined,
        consumedAt: consumedAt || null,
      },
      {
        onSuccess: () => setEditing(false),
      }
    )
  }

  function handleDelete() {
    deleteWine.mutate(wineId, {
      onSuccess: () => navigate({ to: '/instances/$instanceId/wines', params: { instanceId } }),
    })
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => navigate({ to: '/instances/$instanceId/wines', params: { instanceId } })}
          className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wines
        </button>

        <div className="max-w-lg space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">{wine.name}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4 soft-card">
              <div>
                <label htmlFor="wine-name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <Input id="wine-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                <div className="flex flex-wrap gap-2">
                  {wineTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        type === t ? 'bg-accent text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/70'
                      }`}
                    >
                      {t === 'rose' ? 'Rosé' : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wine-cost" className="block text-sm font-medium text-text-secondary mb-1">Cost ($)</label>
                  <Input id="wine-cost" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="wine-consumed" className="block text-sm font-medium text-text-secondary mb-1">Consumed</label>
                  <Input id="wine-consumed" type="date" value={consumedAt} onChange={(e) => setConsumedAt(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Rating</label>
                <StarRating value={rating} onChange={(v) => setRating(v)} />
              </div>
              <div>
                <label htmlFor="wine-notes" className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                <textarea
                  id="wine-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-2xl border-0 py-2.5 px-3 text-text bg-surface-secondary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm resize-none"
                />
              </div>
              <Button onClick={handleSave} disabled={updateWine.isPending}>
                {updateWine.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <div className="soft-card space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted">Type</span>
                  <p className="font-medium text-text capitalize">{wine.type === 'rose' ? 'Rosé' : wine.type}</p>
                </div>
                {wine.cost !== null && wine.cost !== undefined && (
                  <div>
                    <span className="text-muted">Cost</span>
                    <p className="font-medium text-text">${wine.cost.toFixed(2)}</p>
                  </div>
                )}
                {wine.consumedAt && (
                  <div>
                    <span className="text-muted">Consumed</span>
                    <p className="font-medium text-text">{new Date(wine.consumedAt + 'T00:00:00').toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted">Rating</span>
                  <div className="mt-1">
                    <StarRating value={wine.rating ?? 0} readonly size="sm" />
                  </div>
                </div>
              </div>
              {wine.notes && (
                <div className="border-t border-border-subtle pt-4">
                  <span className="text-sm text-muted">Notes</span>
                  <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap">{wine.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Wine"
          description="Are you sure you want to remove this wine from your collection?"
          confirmLabel="Delete"
          variant="destructive"
          loading={deleteWine.isPending}
        />
      </motion.div>
    </ErrorBoundary>
  )
}
