import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from '@/components/ui/StarRating'
import { useOMDBDetail } from '@/hooks/useOMDB'
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
  const { data: omdb } = useOMDBDetail(instanceId, media.omdbId)

  const hasPoster = omdb?.poster && omdb.poster !== 'N/A'

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
      <div className="aspect-[2/3] w-full bg-neutral-100 overflow-hidden relative">
        {hasPoster ? (
          <img
            src={omdb!.poster}
            alt={media.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">
            <Film className="h-12 w-12" />
          </div>
        )}
        {/* Status overlay */}
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm',
              statusColors[media.status] || 'bg-neutral-100 text-neutral-600'
            )}
          >
            {media.status}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-neutral-900 truncate">{media.title}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-neutral-400 uppercase">{media.type === 'tv' ? 'TV' : 'Movie'}</span>
          {media.rating !== null && media.rating !== undefined && (
            <StarRating value={media.rating} readonly size="sm" />
          )}
        </div>
        {omdb?.imdbRating && omdb.imdbRating !== 'N/A' && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px] font-bold text-yellow-600">IMDb</span>
            <span className="text-xs font-medium text-neutral-600">{omdb.imdbRating}</span>
          </div>
        )}
      </div>
    </motion.button>
  )
}
