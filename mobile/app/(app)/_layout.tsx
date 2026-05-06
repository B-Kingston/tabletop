import { useEffect, useRef } from 'react'
import { Redirect, Stack, useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

import { LoadingScreen } from '@/components/LoadingScreen'
import { useHydratedInstanceStore } from '@/hooks/useHydratedInstanceStore'

/**
 * Main app group layout (after authentication).
 * Guards against unauthenticated access.
 * On first load with a persisted instance, redirects directly to that instance.
 */
export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const hydratedStore = useHydratedInstanceStore()
  const isHydrated = hydratedStore((s) => s.isHydrated)
  const currentInstanceId = hydratedStore((s) => s.currentInstanceId)
  const didRedirect = useRef(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/(auth)/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  // On initial load, if we have a persisted instance, go straight there
  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn &&
      isHydrated &&
      currentInstanceId &&
      !didRedirect.current
    ) {
      didRedirect.current = true
      router.replace(
        `/(app)/instances/${currentInstanceId}/(tabs)/recipes`,
      )
    }
  }, [isLoaded, isSignedIn, isHydrated, currentInstanceId, router])

  if (!isLoaded) {
    return <LoadingScreen />
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Groups' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="create-group" options={{ title: 'Create Group' }} />
      <Stack.Screen name="join-group" options={{ title: 'Join Group' }} />
      <Stack.Screen name="instances/[id]" options={{ headerShown: false }} />
    </Stack>
  )
}
