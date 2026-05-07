import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { mediaKeys } from '@tabletop/shared'

import type { ApiResponse, MediaItem as SharedMediaItem } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

export type MobileMediaItem = SharedMediaItem & {
  omdbId?: string
  releaseYear?: string
}

interface AddMediaPayload {
  omdbId: string
  type: 'movie' | 'tv'
  title: string
  releaseYear?: string
}

interface UpdateMediaPayload {
  status?: 'planning' | 'watching' | 'completed' | 'dropped'
  rating?: number | null
  review?: string
  planToWatchDate?: string
}

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all media for an instance, optionally filtered by status and/or type.
 */
export function useMedia(instanceId: string, status?: string, type?: string) {
  return useQuery<MobileMediaItem[], Error>({
    queryKey: mediaKeys.list(instanceId, status, type),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (status) params.status = status
      if (type) params.type = type
      const { data } = await api.get<ApiResponse<MobileMediaItem[]>>(
        `/instances/${instanceId}/media`,
        { params },
      )
      return data.data
    },
    enabled: !!instanceId,
  })
}

/**
 * Fetch a single media item by ID.
 */
export function useMediaItem(instanceId: string, mediaId: string) {
  return useQuery<MobileMediaItem, Error>({
    queryKey: mediaKeys.detail(instanceId, mediaId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MobileMediaItem>>(
        `/instances/${instanceId}/media/${mediaId}`,
      )
      return data.data
    },
    enabled: !!instanceId && !!mediaId,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Add a new media item (from OMDb search result).
 */
export function useAddMedia(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<MobileMediaItem, Error, AddMediaPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<MobileMediaItem>>(
        `/instances/${instanceId}/media`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mediaKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useAddMedia error:', error.message)
    },
  })
}

/**
 * Update an existing media item (status, rating, review, planToWatchDate).
 */
export function useUpdateMedia(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    MobileMediaItem,
    Error,
    { mediaId: string; payload: UpdateMediaPayload }
  >({
    mutationFn: async ({ mediaId, payload }) => {
      const { data } = await api.patch<ApiResponse<MobileMediaItem>>(
        `/instances/${instanceId}/media/${mediaId}`,
        payload,
      )
      return data.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: mediaKeys.all(instanceId),
      })
      void queryClient.invalidateQueries({
        queryKey: mediaKeys.detail(instanceId, variables.mediaId),
      })
    },
    onError: (error) => {
      console.warn('useUpdateMedia error:', error.message)
    },
  })
}

/**
 * Delete a media item.
 */
export function useDeleteMedia(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { mediaId: string }>({
    mutationFn: async ({ mediaId }) => {
      await api.delete(`/instances/${instanceId}/media/${mediaId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mediaKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useDeleteMedia error:', error.message)
    },
  })
}
