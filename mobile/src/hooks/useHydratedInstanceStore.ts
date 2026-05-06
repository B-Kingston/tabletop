import { useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useInstanceStore } from '../stores/instanceStore'

const INSTANCE_STORE_KEY = 'tabletop-current-instance-id'

/**
 * Hydrates the instance store from SecureStore on mount.
 * Returns the store hook for convenient access.
 */
export function useHydratedInstanceStore() {
  const isHydrated = useInstanceStore((s) => s.isHydrated)
  const hydrate = useInstanceStore((s) => s._hydrate)

  useEffect(() => {
    if (!isHydrated) {
      SecureStore.getItemAsync(INSTANCE_STORE_KEY)
        .then((id) => {
          hydrate(id)
        })
        .catch(() => {
          hydrate(null)
        })
    }
  }, [isHydrated, hydrate])

  return useInstanceStore
}
