import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Film, Trash2, Clock, Calendar, Globe, Award, TrendingUp, Users } from 'lucide-react'
import { useMediaItem, useUpdateMedia, useDeleteMedia } from '@/hooks/useMedia'
import { useOMDBDetail } from '@/hooks/useOMDB'
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

function RatingBadge({ source, value }: { source: string; value: string }) {
  if (!value || value === 'N/A') return null

  let icon: React.ReactNode = null
  let colorClass = 'bg-surface-secondary text-text-secondary'

  if (source.includes('Internet Movie Database')) {
    icon = <span className="text-xs font-bold text-accent">IMDb</span>
    colorClass = 'bg-accent-surface text-accent'
  } else if (source.includes('Rotten Tomatoes')) {
    icon = <span className="text-xs font-bold text-red-600">RT</span>
    colorClass = 'bg-red-50 text-red-700'
  } else if (source.includes('Metacritic')) {
    icon = <span className="text-xs font-bold text-accent">MC</span>
    colorClass = 'bg-surface-secondary text-text-secondary'
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-border ${colorClass}`}>
      {icon}
      <span>{value}</span>
    </div>
  )
}

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value || value === 'N/A') return null
  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <Icon className="h-4 w-4 text-muted shrink-0" />
      <span className="text-muted shrink-0">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  )
}

function GenrePill({ genre }: { genre: string }) {
  return (
    <span className="inline-flex rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary border border-border">
      {genre.trim()}
    </span>
  )
}

export function MediaDetail() {
  const { instanceId, mediaId } = useParams({ strict: false }) as { instanceId: string; mediaId: string }
  const navigate = useNavigate()
  const { data: media, isLoading, error } = useMediaItem(instanceId, mediaId)
  const { data: omdb } = useOMDBDetail(instanceId, media?.omdbId)
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
      <div className="rounded-2xl bg-red-50/80 border border-red-100 p-4 text-sm text-red-700">
        Failed to load media. Please try again.
      </div>
    )
  }

  const currentStatus = status ?? media.status
  const currentRating = rating ?? media.rating ?? 0
  const currentReview = review ?? media.review
  const currentPlanToWatchDate = planToWatchDate ?? media.planToWatchDate ?? ''

  const hasPoster = omdb?.poster && omdb.poster !== 'N/A'
  const genres = omdb?.genre ? omdb.genre.split(',').map((g) => g.trim()).filter(Boolean) : []
  const typeLabel = media.type === 'tv' ? 'TV Series' : 'Movie'

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

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => navigate({ to: '/instances/$instanceId/media', params: { instanceId } })}
          className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Media
        </button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
          {/* Poster */}
          <div className="space-y-4">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-3xl bg-surface-secondary">
              {hasPoster ? (
                <img
                  src={omdb!.poster}
                  alt={media.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <Film className="h-16 w-16" />
                </div>
              )}
            </div>

            {/* OMDb ratings */}
            {omdb && omdb.ratings && omdb.ratings.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {omdb.ratings.map((r, i) => (
                  <RatingBadge key={i} source={r.source} value={r.value} />
                ))}
              </div>
            )}

            {/* Meta sidebar */}
            <div className="space-y-2.5 bg-surface-secondary/50 border border-border rounded-3xl p-4">
              <MetaItem icon={Calendar} label="Released" value={omdb?.released ?? media.releaseYear} />
              <MetaItem icon={Clock} label="Runtime" value={omdb?.runtime} />
              <MetaItem icon={Globe} label="Country" value={omdb?.country} />
              <MetaItem icon={Award} label="Awards" value={omdb?.awards} />
              {media.type === 'movie' && <MetaItem icon={TrendingUp} label="Box Office" value={omdb?.boxOffice} />}
              {media.type === 'tv' && <MetaItem icon={Users} label="Seasons" value={omdb?.totalSeasons} />}
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-text">{media.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary capitalize">
                      {typeLabel}
                    </span>
                    {omdb?.rated && omdb.rated !== 'N/A' && (
                      <span className="inline-flex rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                        {omdb.rated}
                      </span>
                    )}
                    {omdb?.year && omdb.year !== 'N/A' && (
                      <span className="text-sm text-muted">{omdb.year}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50/50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <GenrePill key={g} genre={g} />
                ))}
              </div>
            )}

            {/* Plot */}
            {(omdb?.plot || media.overview) && (
              <p className="text-sm leading-relaxed text-text-secondary">
                {omdb?.plot && omdb.plot !== 'N/A' ? omdb.plot : media.overview}
              </p>
            )}

            {/* Cast & Crew */}
            {(omdb?.director || omdb?.writer || omdb?.actors) && (
              <div className="grid gap-3 bg-surface-secondary/50 border border-border rounded-3xl p-4 sm:grid-cols-2 lg:grid-cols-3">
                {omdb.director && omdb.director !== 'N/A' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Director</p>
                    <p className="mt-0.5 text-sm text-text">{omdb.director}</p>
                  </div>
                )}
                {omdb.writer && omdb.writer !== 'N/A' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Writers</p>
                    <p className="mt-0.5 text-sm text-text">{omdb.writer}</p>
                  </div>
                )}
                {omdb.actors && omdb.actors !== 'N/A' && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Starring</p>
                    <p className="mt-0.5 text-sm text-text">{omdb.actors}</p>
                  </div>
                )}
              </div>
            )}

            {/* User controls */}
            <div className="soft-card space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                <div className="segmented-control flex flex-wrap">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={`segmented-control-item text-xs ${
                        currentStatus === opt.value ? 'active' : ''
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {currentStatus === 'planning' && (
                <div>
                  <label htmlFor="plan-date" className="block text-sm font-medium text-text-secondary mb-1">
                    Plan to Watch
                  </label>
                  <input
                    id="plan-date"
                    type="date"
                    value={currentPlanToWatchDate}
                    onChange={(e) => setPlanToWatchDate(e.target.value)}
                    className="block w-full rounded-full bg-surface-secondary border-0 py-2.5 px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Rating</label>
                <StarRating value={currentRating} onChange={(v) => setRating(v)} />
              </div>

              <div>
                <label htmlFor="review" className="block text-sm font-medium text-text-secondary mb-1">
                  Review
                </label>
                <textarea
                  id="review"
                  value={currentReview}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  className="block w-full rounded-2xl bg-surface-secondary border-0 py-3 px-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
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
