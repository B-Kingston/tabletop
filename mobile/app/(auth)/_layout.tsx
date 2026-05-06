import { useEffect } from 'react'
import { Redirect, Stack, useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

import { LoadingScreen } from '@/components/LoadingScreen'

/**
 * Auth group layout.
 * If the user is already signed in, redirect to the app group.
 */
export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(app)')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return <LoadingScreen />
  }

  if (isSignedIn) {
    return <Redirect href="/(app)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  )
}
