import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useCreateWine } from '@/hooks/useWines'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StarRating } from '@/components/ui/StarRating'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

const wineTypes = ['red', 'white', 'rose', 'sparkling', 'port'] as const

export function WineEdit() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const navigate = useNavigate()
  const createWine = useCreateWine(instanceId)

  const [name, setName] = useState('')
  const [type, setType] = useState('red')
  const [cost, setCost] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [consumedAt, setConsumedAt] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createWine.mutate(
      {
        name,
        type,
        cost: cost ? Number(cost) : null,
        rating: rating || null,
        notes: notes || undefined,
        consumedAt: consumedAt || null,
      },
      {
        onSuccess: (wine) =>
          navigate({
            to: '/instances/$instanceId/wines/$wineId',
            params: { instanceId, wineId: wine.id },
          }),
      }
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
          onClick={() =>
            navigate({ to: '/instances/$instanceId/wines', params: { instanceId } })
          }
          className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wines
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-text mb-6">
          New Wine
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label htmlFor="wine-name" className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <Input
              id="wine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Penfolds Grange 2018"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <div className="flex flex-wrap gap-2">
              {wineTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    type === t
                      ? 'bg-accent text-white'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/70'
                  }`}
                >
                  {t === 'rose' ? 'Rosé' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wine-cost" className="block text-sm font-medium text-text-secondary mb-1">
                Cost ($)
              </label>
              <Input
                id="wine-cost"
                type="number"
                step="0.01"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="wine-consumed" className="block text-sm font-medium text-text-secondary mb-1">
                Consumed
              </label>
              <Input
                id="wine-consumed"
                type="date"
                value={consumedAt}
                onChange={(e) => setConsumedAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Rating</label>
            <StarRating value={rating} onChange={(v) => setRating(v)} />
          </div>

          <div>
            <label htmlFor="wine-notes" className="block text-sm font-medium text-text-secondary mb-1">
              Notes
            </label>
            <textarea
              id="wine-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Tasting notes, pairing suggestions..."
              className="block w-full rounded-2xl border-0 py-2.5 px-3 text-text bg-surface-secondary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={!name || createWine.isPending}>
              {createWine.isPending ? 'Creating...' : 'Add Wine'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                navigate({ to: '/instances/$instanceId/wines', params: { instanceId } })
              }
            >
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </ErrorBoundary>
  )
}
