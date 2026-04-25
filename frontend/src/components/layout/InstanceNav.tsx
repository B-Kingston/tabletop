import { Link, useMatchRoute } from '@tanstack/react-router'
import { Film, ChefHat, Wine, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstanceNavProps {
  instanceId: string
}

const navItems = [
  { path: '/media' as const, label: 'Media', icon: Film },
  { path: '/recipes' as const, label: 'Recipes', icon: ChefHat },
  { path: '/wines' as const, label: 'Wines', icon: Wine },
  { path: '/chat' as const, label: 'Chat', icon: MessageSquare },
]

export function InstanceNav({ instanceId }: InstanceNavProps) {
  const matchRoute = useMatchRoute()

  return (
    <ul className="space-y-1" role="list">
      {navItems.map((item) => {
        const isActive = matchRoute({
          to: '/instances/$instanceId' + item.path,
          params: { instanceId },
          fuzzy: true,
        })

        return (
          <li key={item.path}>
            <Link
              to={'/instances/$instanceId' + item.path as '/instances/$instanceId/media'}
              params={{ instanceId }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
