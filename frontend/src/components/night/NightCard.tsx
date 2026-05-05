import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Wine, ChefHat, Film, AlertCircle } from 'lucide-react'
import type { Night } from '@/types/models'

interface NightCardProps {
  night: Night
  instanceId: string
}

type NightItemKey = 'wine' | 'recipe' | 'media'

function shouldShowItem(night: Night, key: NightItemKey): boolean {
  switch (key) {
    case 'wine': return !!night.wineId
    case 'recipe': return !!night.recipeId
    case 'media': return !!night.mediaId
  }
}

export function NightCard({ night, instanceId }: NightCardProps) {
  const navigate = useNavigate()

  const items = [
    { key: 'wine' as NightItemKey, label: night.wine?.name, icon: Wine, present: !!night.wine },
    { key: 'recipe' as NightItemKey, label: night.recipe?.title, icon: ChefHat, present: !!night.recipe },
    { key: 'media' as NightItemKey, label: night.media?.title, icon: Film, present: !!night.media },
  ].filter((i) => shouldShowItem(night, i.key))

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() =>
        navigate({
          to: '/instances/$instanceId/nights/$nightId',
          params: { instanceId, nightId: night.id },
        })
      }
      className="group text-left w-full rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 hover:shadow-md transition-shadow"
    >
      <h3 className="font-medium text-neutral-900 truncate mb-3">{night.name}</h3>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.icon
          const hasItem = item.present
          const wasDeleted = !hasItem && (
            (item.key === 'wine' && night.wineId) ||
            (item.key === 'recipe' && night.recipeId) ||
            (item.key === 'media' && night.mediaId)
          )

          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                hasItem
                  ? 'bg-neutral-100 text-neutral-700'
                  : wasDeleted
                  ? 'bg-red-50 text-red-600'
                  : 'bg-neutral-50 text-neutral-400'
              }`}
            >
              {wasDeleted ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              <span className="truncate max-w-[120px]">
                {hasItem ? item.label : wasDeleted ? 'Deleted item' : `No ${item.key}`}
              </span>
            </span>
          )
        })}
      </div>

      {night.createdBy && (
        <div className="mt-3 flex items-center gap-2">
          {night.createdBy.avatarUrl ? (
            <img
              src={night.createdBy.avatarUrl}
              alt={night.createdBy.name}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-neutral-200" />
          )}
          <span className="text-xs text-neutral-500">{night.createdBy.name}</span>
        </div>
      )}
    </motion.button>
  )
}
