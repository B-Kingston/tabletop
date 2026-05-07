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
  red: 'bg-rose-50 text-rose-700',
  white: 'bg-yellow-50 text-yellow-700',
  rose: 'bg-rose-50 text-rose-600',
  sparkling: 'bg-yellow-50 text-yellow-700',
  port: 'bg-violet-50 text-violet-700',
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
      className="group text-left w-full rounded-3xl bg-surface p-5 border border-border transition-all duration-150 hover:shadow-card hover:border-border-subtle"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-text truncate">{wine.name}</h3>
        <span
          className={cn(
            'inline-flex flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            typeColors[wine.type] || 'bg-surface-secondary text-text-secondary'
          )}
        >
          {wine.type}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {wine.rating !== null && wine.rating !== undefined ? (
          <StarRating value={wine.rating} readonly size="sm" />
        ) : (
          <span className="text-xs text-muted">Not rated</span>
        )}
        <div className="text-right">
          {wine.cost !== null && wine.cost !== undefined && (
            <p className="text-sm font-medium text-text">
              ${wine.cost.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  )
}
