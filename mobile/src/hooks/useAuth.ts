import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

import type { ApiResponse, User } from '@tabletop/shared'

interface ClerkSyncPayload {
  clerkId: string
  email: string
  name?: string
  avatarUrl?: string
}

/**
 * Syncs the current Clerk user with the backend.
 * Runs once per auth session (guarded by authStore.hasSynced).
 * Must be called inside ClerkProvider + QueryClientProvider.
 */
export function useAuthSync() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser()
  const hasSynced = useAuthStore((s) => s.hasSynced)
  const setHasSynced = useAuthStore((s) => s.setHasSynced)

  const mutation = useMutation<ApiResponse<User>, Error, ClerkSyncPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<User>>(
        '/auth/clerk-sync',
        payload,
      )
      return data
    },
    onSuccess: () => {
      setHasSynced(true)
    },
    onError: (error) => {
      console.warn('useAuthSync error:', error.message)
    },
  })

  useEffect(() => {
    if (
      isUserLoaded &&
      isSignedIn &&
      user &&
      !hasSynced &&
      !mutation.isPending
    ) {
      mutation.mutate({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        name: user.fullName ?? undefined,
        avatarUrl: user.imageUrl ?? undefined,
      })
    }
    // mutation.isPending and mutation.isSuccess intentionally omitted
    // from deps to prevent infinite retry loops on failure.
    // The effect only re-fires when auth state or hasSynced changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoaded, isSignedIn, user, hasSynced])

  return mutation
}

/**
 * Combined auth hook — wraps Clerk auth + sync state + sign-out helper.
 */
export function useAuth() {
  const clerkAuth = useClerkAuth()
  const hasSynced = useAuthStore((s) => s.hasSynced)
  const syncMutation = useAuthSync()

  const signOut = async () => {
    await clerkAuth.signOut()
  }

  return {
    ...clerkAuth,
    hasSynced,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    signOut,
  }
}
