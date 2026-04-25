import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { StarRating } from '@/components/ui/StarRating'
import type { MediaItem } from '@/types/models'

interface MediaCardProps {
  media: MediaItem
  instanceId: string
}

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700',
  watching: 'bg-green-100 text-green-700',
  completed: 'bg-neutral-100 text-neutral-700',
  dropped: 'bg-red-100 text-red-700',
}

export function MediaCard({ media, instanceId }: MediaCardProps) {
  const navigate = useNavigate()
  const posterUrl = media.posterPath
    ? `https://image.tmdb.org/t/p/w500${media.posterPath}`
    : null

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() =>
        navigate({
          to: '/instances/$instanceId/media/$mediaId',
          params: { instanceId, mediaId: media.id },
        })
      }
      className="group text-left w-full rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[2/3] w-full bg-neutral-100 overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={media.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-neutral-900 truncate">{media.title}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
              statusColors[media.status] || 'bg-neutral-100 text-neutral-600'
            )}
          >
            {media.status}
          </span>
          <span className="text-xs text-neutral-400 uppercase">{media.type}</span>
        </div>
        {media.rating !== null && media.rating !== undefined && (
          <div className="mt-2">
            <StarRating value={media.rating} readonly size="sm" />
          </div>
        )}
      </div>
    </motion.button>
  )
}
