import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { useMedia } from '@/hooks/useMedia'
import { Button } from '@/components/ui/Button'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { MediaCard } from '@/components/media/MediaCard'
import { MediaSearchModal } from '@/components/media/MediaSearchModal'
import type { MediaItem } from '@/types/models'

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'planning', label: 'Planning' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
]

const typeTabs = [
  { value: '', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV' },
]

export function MediaList() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const { data: media, isLoading, error } = useMedia(instanceId, statusFilter || undefined, typeFilter || undefined)

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-text">The Shelf</h1>
          <Button size="sm" onClick={() => setSearchOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Media
          </Button>
        </div>

        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="segmented-control overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`segmented-control-item whitespace-nowrap text-xs ${
                  statusFilter === tab.value ? 'active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="segmented-control">
            {typeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={`segmented-control-item whitespace-nowrap text-xs ${
                  typeFilter === tab.value ? 'active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50/80 border border-red-100 p-4 text-sm text-red-700 mb-4">
            Failed to load media. Please try again.
          </div>
        )}

        {isLoading && <GridSkeleton count={6} />}

        {media && media.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 blur-xl" />
              </div>
              <Search className="relative h-12 w-12 text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-text mb-2">The shelf is empty</h3>
            <p className="text-sm text-text-secondary">
              {statusFilter || typeFilter
                ? 'Try adjusting your filters.'
                : 'Add your first movie or TV show to get started.'}
            </p>
          </div>
        )}

        {media && media.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {media.map((item: MediaItem) => (
              <MediaCard key={item.id} media={item} instanceId={instanceId} />
            ))}
          </div>
        )}

        <MediaSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} instanceId={instanceId} />
      </motion.div>
    </ErrorBoundary>
  )
}
