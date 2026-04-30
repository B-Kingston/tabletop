import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useMediaItem, useUpdateMedia, useDeleteMedia } from '@/hooks/useMedia'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
]

export function MediaDetail() {
  const { instanceId, mediaId } = useParams({ strict: false }) as { instanceId: string; mediaId: string }
  const navigate = useNavigate()
  const { data: media, isLoading, error } = useMediaItem(instanceId, mediaId)
  const updateMedia = useUpdateMedia(instanceId)
  const deleteMedia = useDeleteMedia(instanceId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState<string | null>(null)
  const [planToWatchDate, setPlanToWatchDate] = useState<string | null>(null)

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (error || !media) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load media. Please try again.
      </div>
    )
  }

  const currentStatus = status ?? media.status
  const currentRating = rating ?? media.rating ?? 0
  const currentReview = review ?? media.review
  const currentPlanToWatchDate = planToWatchDate ?? media.planToWatchDate ?? ''

  function handleSave() {
    updateMedia.mutate({
      mediaId,
      status: currentStatus,
      rating: currentRating || null,
      review: currentReview,
      planToWatchDate: currentPlanToWatchDate || null,
    })
  }

  function handleDelete() {
    deleteMedia.mutate(mediaId, {
      onSuccess: () => navigate({ to: '/instances/$instanceId/media', params: { instanceId } }),
    })
  }

  const posterUrl = media.posterPath
    ? `https://image.tmdb.org/t/p/w500${media.posterPath}`
    : null

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => navigate({ to: '/instances/$instanceId/media', params: { instanceId } })}
          className="mb-6 flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Media
        </button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
          <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-100">
            {posterUrl ? (
              <img src={posterUrl} alt={media.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-300">
                No image
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{media.title}</h1>
                  <p className="text-sm text-neutral-500 capitalize mt-1">{media.type}</p>
                </div>
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

            {media.overview && (
              <p className="text-sm text-neutral-600 leading-relaxed">{media.overview}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        currentStatus === opt.value
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {currentStatus === 'planning' && (
                <div>
                  <label htmlFor="plan-date" className="block text-sm font-medium text-neutral-700 mb-1">
                    Plan to Watch
                  </label>
                  <input
                    id="plan-date"
                    type="date"
                    value={currentPlanToWatchDate}
                    onChange={(e) => setPlanToWatchDate(e.target.value)}
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm sm:leading-6"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Rating</label>
                <StarRating value={currentRating} onChange={(v) => setRating(v)} />
              </div>

              <div>
                <label htmlFor="review" className="block text-sm font-medium text-neutral-700 mb-1">
                  Review
                </label>
                <textarea
                  id="review"
                  value={currentReview}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm sm:leading-6 resize-none"
                />
              </div>

              <Button onClick={handleSave} disabled={updateMedia.isPending}>
                {updateMedia.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Media"
          description="Are you sure you want to remove this from your collection?"
          confirmLabel="Delete"
          variant="destructive"
          loading={deleteMedia.isPending}
        />
      </motion.div>
    </ErrorBoundary>
  )
}
