import { useEffect } from 'react'
import { useAuth as useClerkAuth, useUser } from '@/lib/clerk'
import { useMutation } from '@tanstack/react-query'
import { api, setAuthTokenGetter } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types/models'

export function useAuth() {
  const clerk = useClerkAuth()
  const { user: clerkUser } = useUser()
  const { hasSynced, setHasSynced } = useAuthStore()

  // Register token getter once per session — must be inside useEffect
  useEffect(() => {
    if (clerk.isSignedIn) {
      setAuthTokenGetter(clerk.getToken)
    }
  }, [clerk.isSignedIn, clerk.getToken])

  const syncMutation = useMutation({
    mutationFn: async () => {
      const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
      const name = clerkUser?.fullName ??
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ??
        ''
      const avatarUrl = clerkUser?.imageUrl ?? ''
      const { data } = await api.post<{ data: User }>('/auth/clerk-sync', {
        clerkId: clerk.userId,
        email,
        name,
        avatarUrl,
      })
      return data.data
    },
    onSuccess: () => setHasSynced(true),
  })

  // Auto-sync user to backend DB on first sign-in
  useEffect(() => {
    if (clerk.isSignedIn && !hasSynced && !syncMutation.isPending) {
      syncMutation.mutate()
    }
  }, [clerk.isSignedIn, hasSynced, syncMutation])

  return {
    ...clerk,
    hasSynced,
    syncUser: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  }
}
