import { useAuth as useClerkAuth } from '@/lib/clerk'
import { useMutation } from '@tanstack/react-query'
import { api, setAuthTokenGetter } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types/models'

export function useAuth() {
  const clerk = useClerkAuth()
  const { hasSynced, setHasSynced } = useAuthStore()

  setAuthTokenGetter(clerk.getToken)

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ data: User }>('/auth/clerk-sync', {
        clerkId: clerk.userId,
        email: '',
        name: '',
        avatarUrl: '',
      })
      return data.data
    },
    onSuccess: () => setHasSynced(true),
  })

  return {
    ...clerk,
    hasSynced,
    syncUser: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  }
}
