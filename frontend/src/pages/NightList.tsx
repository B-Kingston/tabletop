import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Plus, Sparkles, Moon } from 'lucide-react'
import { useNights } from '@/hooks/useNights'
import { Button } from '@/components/ui/Button'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { NightCard } from '@/components/night/NightCard'
import type { Night } from '@/types/models'

type SortOption = 'date' | 'name'

export function NightList() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const { data: nights, isLoading, error } = useNights(instanceId)

  const sorted = nights?.slice().sort((a: Night, b: Night) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
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
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Nights</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate({
                  to: '/instances/$instanceId/nights/spin',
                  params: { instanceId },
                })
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Spin the Night
            </Button>
            <Button
              size="sm"
              onClick={() =>
                navigate({
                  to: '/instances/$instanceId/nights/new',
                  params: { instanceId },
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New Night
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-600">
            {nights?.length ?? 0} {nights?.length === 1 ? 'night' : 'nights'} planned
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border-0 py-1.5 px-3 text-sm text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-inset focus:ring-neutral-900"
          >
            <option value="date">Newest First</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-4">
            Failed to load nights. Please try again.
          </div>
        )}

        {isLoading && <GridSkeleton count={6} />}

        {sorted && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Moon className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No nights yet</h3>
            <p className="text-sm text-neutral-600 max-w-sm mb-6">
              Spin the slot machine to randomly combine wines, recipes, and media into a curated evening plan.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: '/instances/$instanceId/nights/spin',
                    params: { instanceId },
                  })
                }
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Spin the Night
              </Button>
            </div>
          </div>
        )}

        {sorted && sorted.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((night: Night) => (
              <NightCard key={night.id} night={night} instanceId={instanceId} />
            ))}
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  )
}
