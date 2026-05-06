import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { useUIStore } from '../stores/uiStore'

/**
 * Returns whether reduced motion should be respected.
 * Checks both the user's explicit preference in UIStore and
 * the system-level AccessibilityInfo setting.
 */
export function useReducedMotion(): boolean {
  const storeReducedMotion = useUIStore((s) => s.reducedMotion)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        setSystemReducedMotion(enabled)
      })
      .catch(() => {
        // If the check fails, default to false.
        setSystemReducedMotion(false)
      })
  }, [])

  return storeReducedMotion || systemReducedMotion
}
