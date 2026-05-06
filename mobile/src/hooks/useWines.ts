import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { winesKeys } from '@tabletop/shared'

import type { ApiResponse, Wine } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

interface CreateWinePayload {
  name: string
  type: Wine['type']
  cost?: number
  rating?: number
  notes?: string
  consumedAt?: string
}

type UpdateWinePayload = Partial<Omit<CreateWinePayload, 'cost' | 'rating' | 'consumedAt'>> & {
  cost?: number | null
  rating?: number | null
  consumedAt?: string | null
}

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all wines for an instance, optionally filtered by type.
 */
export function useWines(instanceId: string, type?: string) {
  return useQuery<Wine[], Error>({
    queryKey: winesKeys.list(instanceId, type),
    queryFn: async () => {
      const params = type ? { type } : {}
      const { data } = await api.get<ApiResponse<Wine[]>>(
        `/instances/${instanceId}/wines`,
        { params },
      )
      return data.data
    },
    enabled: !!instanceId,
  })
}

/**
 * Fetch a single wine by ID.
 */
export function useWine(instanceId: string, wineId: string) {
  return useQuery<Wine, Error>({
    queryKey: winesKeys.detail(instanceId, wineId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Wine>>(
        `/instances/${instanceId}/wines/${wineId}`,
      )
      return data.data
    },
    enabled: !!instanceId && !!wineId,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Create a new wine.
 */
export function useCreateWine(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<Wine, Error, CreateWinePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<Wine>>(
        `/instances/${instanceId}/wines`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: winesKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useCreateWine error:', error.message)
    },
  })
}

/**
 * Update an existing wine.
 */
export function useUpdateWine(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<Wine, Error, { wineId: string; payload: UpdateWinePayload }>({
    mutationFn: async ({ wineId, payload }) => {
      const { data } = await api.patch<ApiResponse<Wine>>(
        `/instances/${instanceId}/wines/${wineId}`,
        payload,
      )
      return data.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: winesKeys.all(instanceId),
      })
      void queryClient.invalidateQueries({
        queryKey: winesKeys.detail(instanceId, variables.wineId),
      })
    },
    onError: (error) => {
      console.warn('useUpdateWine error:', error.message)
    },
  })
}

/**
 * Delete a wine.
 */
export function useDeleteWine(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { wineId: string }>({
    mutationFn: async ({ wineId }) => {
      await api.delete(`/instances/${instanceId}/wines/${wineId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: winesKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useDeleteWine error:', error.message)
    },
  })
}
