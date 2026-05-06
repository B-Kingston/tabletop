import { Link, useMatchRoute } from '@tanstack/react-router'
import { Bot, Film, ChefHat, Wine, MessageSquare, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstanceNavProps {
  instanceId: string
}

const navItems = [
  { path: '/media' as const, label: 'Media', icon: Film },
  { path: '/recipes' as const, label: 'Recipes', icon: ChefHat },
  { path: '/wines' as const, label: 'Wines', icon: Wine },
  { path: '/nights' as const, label: 'Nights', icon: Moon },
  { path: '/chat' as const, label: 'Messages', icon: MessageSquare },
  { path: '/ai' as const, label: 'AI Assistant', icon: Bot },
]

export function InstanceNav({ instanceId }: InstanceNavProps) {
  const matchRoute = useMatchRoute()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-1" aria-label="Instance navigation">
      {navItems.map((item) => {
        const isActive = matchRoute({
          to: '/instances/$instanceId' + item.path,
          params: { instanceId },
          fuzzy: true,
        })

        return (
          <Link
            key={item.path}
            to={'/instances/$instanceId' + item.path as '/instances/$instanceId/media'}
            params={{ instanceId }}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
