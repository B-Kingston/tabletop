import { Menu, X } from 'lucide-react'
import { Outlet, useParams } from '@tanstack/react-router'
import { UserButton } from '@/lib/clerk'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInstance } from '@/hooks/useInstances'
import { useInstanceStore } from '@/stores/instanceStore'
import { InstanceNav } from './InstanceNav'
import { cn } from '@/lib/utils'

export function InstanceLayout() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const { data: instance, isLoading } = useInstance(instanceId)
  const { sidebarOpen, setSidebarOpen, setCurrentInstance } = useInstanceStore()

  useEffect(() => {
    setCurrentInstance(instanceId)
    return () => setCurrentInstance(null)
  }, [instanceId, setCurrentInstance])

  return (
    <div className="flex h-screen bg-neutral-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-neutral-200 transition-transform duration-200 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
            <h1 className="text-lg font-semibold text-neutral-900 truncate">
              {isLoading ? '...' : instance?.name ?? 'Group'}
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-sm p-1 text-neutral-400 hover:text-neutral-600 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4">
            <InstanceNav instanceId={instanceId} />
          </nav>
          <div className="border-t border-neutral-200 px-4 py-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-sm p-1 text-neutral-600 hover:text-neutral-900"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium text-neutral-900 truncate">
            {isLoading ? '...' : instance?.name ?? 'Group'}
          </h1>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
