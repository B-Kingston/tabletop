import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MediaItem } from '@/types/models'

export function useMedia(instanceId: string, status?: string, type?: string) {
  return useQuery({
    queryKey: ['media', instanceId, status, type],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (type) params.set('type', type)
      const { data } = await api.get<{ data: MediaItem[] }>(`/instances/${instanceId}/media?${params}`)
      return data.data ?? []
    },
    enabled: !!instanceId,
  })
}

export function useMediaItem(instanceId: string, mediaId: string) {
  return useQuery({
    queryKey: ['media', instanceId, mediaId],
    queryFn: async () => {
      const { data } = await api.get<{ data: MediaItem }>(`/instances/${instanceId}/media/${mediaId}`)
      return data.data
    },
    enabled: !!instanceId && !!mediaId,
  })
}

export function useAddMedia(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      omdbId: string
      type: 'movie' | 'tv'
      title: string
      overview: string
      releaseYear: string
    }) => {
      const { data } = await api.post<{ data: MediaItem }>(`/instances/${instanceId}/media`, input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', instanceId] }),
  })
}

export function useUpdateMedia(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      mediaId: string
      status?: string
      rating?: number | null
      review?: string
      planToWatchDate?: string | null
    }) => {
      const { data } = await api.patch<{ data: MediaItem }>(
        `/instances/${instanceId}/media/${input.mediaId}`,
        { status: input.status, rating: input.rating, review: input.review, planToWatchDate: input.planToWatchDate }
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', instanceId] }),
  })
}

export function useDeleteMedia(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mediaId: string) => {
      await api.delete(`/instances/${instanceId}/media/${mediaId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', instanceId] }),
  })
}
