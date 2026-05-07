import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SpinReelItem {
  id: string
  name: string
}

interface SpinReelProps {
  icon: LucideIcon
  label: string
  items: SpinReelItem[]
  finalItem: SpinReelItem | null
  isSpinning: boolean
  stopDelayMs: number
  onSettled: () => void
}

const REEL_TICK_MS = 80
const REDUCED_MOTION_SETTLE_MS = 100

export function SpinReel({
  icon: Icon,
  label,
  items,
  finalItem,
  isSpinning,
  stopDelayMs,
  onSettled,
}: SpinReelProps) {
  const [displayItem, setDisplayItem] = useState<SpinReelItem | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!isSpinning) {
      if (finalItem) {
        setDisplayItem(finalItem)
      }
      return
    }

    if (reducedMotion) {
      // Skip animation: show final item immediately, settle after brief delay
      if (finalItem) {
        setDisplayItem(finalItem)
      }
      const timeout = setTimeout(() => {
        onSettled()
      }, REDUCED_MOTION_SETTLE_MS)
      return () => clearTimeout(timeout)
    }

    const interval = setInterval(() => {
      const arr = itemsRef.current
      if (arr.length > 0) {
        setDisplayItem(arr[Math.floor(Math.random() * arr.length)])
      }
    }, REEL_TICK_MS)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (finalItem) {
        setDisplayItem(finalItem)
      }
      onSettled()
    }, stopDelayMs)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isSpinning, finalItem, stopDelayMs, onSettled, reducedMotion])

  const isSettled = !isSpinning && finalItem !== null

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center aspect-square w-full max-w-[200px] rounded-3xl bg-surface border border-border overflow-hidden"
      animate={isSpinning && !reducedMotion ? { y: [0, -3, 3, 0] } : { y: 0 }}
      transition={isSpinning && !reducedMotion ? { repeat: Infinity, duration: 0.12 } : {}}
    >
      <div
        className={`flex flex-col items-center justify-center gap-3 p-4 transition-all duration-200 ${
          isSpinning && !reducedMotion ? 'blur-[2px] opacity-80' : 'blur-0 opacity-100'
        }`}
      >
        {isSettled && displayItem ? (
          <motion.div
            key={displayItem.id}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
              <Icon className="h-6 w-6 text-text-secondary" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-text line-clamp-2">
              {displayItem.name}
            </span>
            <span className="text-xs text-muted capitalize">{label}</span>
          </motion.div>
        ) : isSpinning && displayItem ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
              <Icon className="h-6 w-6 text-muted" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium text-text-secondary line-clamp-2">
              {displayItem.name}
            </span>
            <span className="text-xs text-muted capitalize">{label}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
              <Icon className="h-6 w-6 text-muted" strokeWidth={1.5} />
            </div>
            <span className="text-xs text-muted capitalize">{label}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
