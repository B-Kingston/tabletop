import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { instancesKeys } from '@tabletop/shared'

import type { ApiResponse, Instance } from '@tabletop/shared'

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all instances the current user belongs to.
 */
export function useInstances() {
  return useQuery<Instance[], Error>({
    queryKey: instancesKeys.all,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Instance[]>>('/instances')
      return data.data
    },
  })
}

/**
 * Fetch a single instance by ID.
 */
export function useInstance(instanceId: string) {
  return useQuery<Instance, Error>({
    queryKey: instancesKeys.detail(instanceId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Instance>>(
        `/instances/${instanceId}`,
      )
      return data.data
    },
    enabled: !!instanceId,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Create a new instance.
 */
export function useCreateInstance() {
  const queryClient = useQueryClient()

  return useMutation<
    Instance,
    Error,
    { name: string; password: string }
  >({
    mutationFn: async ({ name, password }) => {
      const { data } = await api.post<ApiResponse<Instance>>('/instances', {
        name,
        password,
      })
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: instancesKeys.all })
    },
    onError: (error) => {
      console.warn('useCreateInstance error:', error.message)
    },
  })
}

/**
 * Join an existing instance by ID and password.
 */
export function useJoinInstance() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { instanceId: string; password: string }
  >({
    mutationFn: async ({ instanceId, password }) => {
      await api.post(`/instances/${instanceId}/join`, { password })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: instancesKeys.all })
    },
    onError: (error) => {
      console.warn('useJoinInstance error:', error.message)
    },
  })
}

/**
 * Leave an instance.
 */
export function useLeaveInstance() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { instanceId: string }
  >({
    mutationFn: async ({ instanceId }) => {
      await api.post(`/instances/${instanceId}/leave`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: instancesKeys.all })
    },
    onError: (error) => {
      console.warn('useLeaveInstance error:', error.message)
    },
  })
}
