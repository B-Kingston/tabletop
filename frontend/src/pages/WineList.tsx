import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { useWines } from '@/hooks/useWines'
import { Button } from '@/components/ui/Button'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { WineCard } from '@/components/wine/WineCard'
import type { Wine } from '@/types/models'

const typeTabs = [
  { value: '', label: 'All' },
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Sparkling' },
  { value: 'port', label: 'Port' },
]

type SortOption = 'rating' | 'date' | 'cost'

export function WineList() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const { data: wines, isLoading, error } = useWines(instanceId, typeFilter || undefined)

  const sorted = wines?.slice().sort((a: Wine, b: Wine) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0)
      case 'cost':
        return (b.cost ?? 0) - (a.cost ?? 0)
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-text">Wines</h1>
          <Button
            size="sm"
            onClick={() =>
              navigate({
                to: '/instances/$instanceId/wines/new',
                params: { instanceId },
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            New Wine
          </Button>
        </div>

        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="segmented-control">
            {typeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={`segmented-control-item${typeFilter === tab.value ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-full border-0 py-1.5 px-3 text-sm text-text bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="date">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="cost">Most Expensive</option>
          </select>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-rose-700 mb-4">
            Failed to load wines. Please try again.
          </div>
        )}

        {isLoading && <GridSkeleton count={6} />}

        {sorted && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">The cellar is empty</h3>
            <p className="text-sm text-text-secondary">
              {typeFilter ? 'Try adjusting your filters.' : 'Add your first wine to get started.'}
            </p>
          </div>
        )}

        {sorted && sorted.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((wine: Wine) => (
              <WineCard key={wine.id} wine={wine} instanceId={instanceId} />
            ))}
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  )
}
