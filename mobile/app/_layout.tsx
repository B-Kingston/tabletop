import React, { useEffect, useRef } from 'react'
import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'

import { queryClient } from '@/lib/queryClient'
import { setAuthTokenGetter, setSignOutHandler } from '@/lib/api'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthSync } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { useInstanceStore } from '@/stores/instanceStore'
import { LoadingScreen } from '@/components/LoadingScreen'

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

/**
 * Root layout — the entry point for the entire app.
 *
 * Deep link patterns (scheme: `tabletop`):
 *   tabletop://                           → Home / redirect
 *   tabletop://instances/:id/recipes      → Instance recipes tab
 *   tabletop://instances/:id/wines        → Instance wines tab
 *   tabletop://instances/:id/media        → Instance media tab
 *   tabletop://instances/:id/nights       → Instance nights tab
 *   tabletop://instances/:id/chat         → Instance chat tab
 *   tabletop://instances/:id/ai           → Instance AI tab
 *   tabletop://instances/:id/recipes/cook/:recipeId  → Cooking view
 *   tabletop://instances/:id/spin         → Spin the night
 *
 * Expo Router auto-maps these based on the file-system routes.
 */

/**
 * Inner component — lives inside ClerkProvider so useAuth() works.
 * Bridges Clerk auth → API token getter, user sync, and sign-out handler.
 */
function AuthBridge({ children }: { children: React.ReactNode }) {
  const { getToken, signOut, isLoaded, isSignedIn } = useAuth()

  // Wire API module with Clerk token getter and sign-out handler
  useEffect(() => {
    setAuthTokenGetter(() => getToken())
  }, [getToken])

  useEffect(() => {
    setSignOutHandler(() => {
      void signOut()
    })
  }, [signOut])

  // Sync Clerk user with backend
  useAuthSync()

  // Clean up when user signs out
  const prevSignedIn = useRef(isSignedIn)
  useEffect(() => {
    if (prevSignedIn.current && !isSignedIn) {
      queryClient.clear()
      useAuthStore.getState().setHasSynced(false)
      useInstanceStore.getState().setCurrentInstance(null)
    }
    prevSignedIn.current = isSignedIn
  }, [isSignedIn])

  if (!isLoaded) {
    return <LoadingScreen />
  }

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={CLERK_KEY}>
          <StatusBar style="auto" />
          <AuthBridge>
            <ErrorBoundary>
              <Slot />
            </ErrorBoundary>
          </AuthBridge>
        </ClerkProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
