import { Outlet, useParams } from '@tanstack/react-router'
import { UserButton } from '@/lib/clerk'
import { useEffect } from 'react'
import { useInstance } from '@/hooks/useInstances'
import { useInstanceStore } from '@/stores/instanceStore'
import { InstanceNav } from './InstanceNav'
import { cn } from '@/lib/utils'

export function InstanceLayout() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const { data: instance, isLoading } = useInstance(instanceId)
  const { setCurrentInstance } = useInstanceStore()

  useEffect(() => {
    setCurrentInstance(instanceId)
    return () => setCurrentInstance(null)
  }, [instanceId, setCurrentInstance])

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-base font-semibold text-neutral-900 truncate">
              {isLoading ? '...' : instance?.name ?? 'Group'}
            </h1>
            <div className="hidden sm:block h-6 w-px bg-neutral-200" />
            <div className="hidden sm:block">
              <InstanceNav instanceId={instanceId} />
            </div>
          </div>
          <div className="flex-shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        {/* Mobile nav: scrollable pill row */}
        <div className="sm:hidden border-t border-neutral-100 px-4 py-2 overflow-x-auto">
          <InstanceNav instanceId={instanceId} />
        </div>
      </header>

      {/* Main content */}
      <main className={cn('flex-1 overflow-auto')}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
