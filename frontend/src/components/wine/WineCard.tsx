import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { StarRating } from '@/components/ui/StarRating'
import type { Wine } from '@/types/models'

interface WineCardProps {
  wine: Wine
  instanceId: string
}

const typeColors: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  white: 'bg-amber-50 text-amber-700',
  rose: 'bg-pink-100 text-pink-700',
  sparkling: 'bg-yellow-100 text-yellow-700',
  port: 'bg-purple-100 text-purple-700',
}

export function WineCard({ wine, instanceId }: WineCardProps) {
  const navigate = useNavigate()

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() =>
        navigate({
          to: '/instances/$instanceId/wines/$wineId',
          params: { instanceId, wineId: wine.id },
        })
      }
      className="group text-left w-full rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-neutral-900 truncate">{wine.name}</h3>
        <span
          className={cn(
            'inline-flex flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            typeColors[wine.type] || 'bg-neutral-100 text-neutral-600'
          )}
        >
          {wine.type}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {wine.rating !== null && wine.rating !== undefined ? (
          <StarRating value={wine.rating} readonly size="sm" />
        ) : (
          <span className="text-xs text-neutral-400">Not rated</span>
        )}
        <div className="text-right">
          {wine.cost !== null && wine.cost !== undefined && (
            <p className="text-sm font-medium text-neutral-900">
              ${wine.cost.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  )
}
