import { Outlet, useParams, Link } from '@tanstack/react-router'
import { UserButton } from '@/lib/clerk'
import { useEffect } from 'react'
import { useInstance } from '@/hooks/useInstances'
import { useInstanceStore } from '@/stores/instanceStore'
import { InstanceNav } from './InstanceNav'
import { Home } from 'lucide-react'

export function InstanceLayout() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const { data: instance, isLoading } = useInstance(instanceId)
  const { setCurrentInstance } = useInstanceStore()

  useEffect(() => {
    setCurrentInstance(instanceId)
    return () => setCurrentInstance(null)
  }, [instanceId, setCurrentInstance])

  return (
    <div className="min-h-screen bg-bg">
      {/* Floating pill navigation */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 rounded-full bg-surface/80 backdrop-blur-xl border border-border/50 shadow-nav px-2 py-1.5">
          <Link
            to="/"
            className="flex items-center justify-center h-9 w-9 rounded-full text-muted hover:text-text hover:bg-surface-secondary/50 transition-all duration-150"
          >
            <Home className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <div className="flex items-center gap-3 pr-2">
            <span className="text-sm font-semibold text-text hidden sm:block max-w-[140px] truncate">
              {isLoading ? '...' : instance?.name ?? 'Home'}
            </span>
            <InstanceNav instanceId={instanceId} />
          </div>
          <div className="h-5 w-px bg-border/60" />
          <div className="pl-1">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main content with generous top padding for floating nav */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
