import { useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-text/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative z-50 w-full max-w-lg rounded-3xl bg-surface p-6 shadow-card',
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface DialogHeaderProps {
  children: ReactNode
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

interface DialogTitleProps {
  children: ReactNode
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <h2 className="text-lg font-semibold text-text">{children}</h2>
}

interface DialogBodyProps {
  children: ReactNode
}

export function DialogBody({ children }: DialogBodyProps) {
  return <div className="space-y-4">{children}</div>
}

interface DialogFooterProps {
  children: ReactNode
}

export function DialogFooter({ children }: DialogFooterProps) {
  return <div className="mt-6 flex justify-end gap-3">{children}</div>
}
