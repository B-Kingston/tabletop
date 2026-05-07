import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { OMDBSearchResponse, OMDBDetail } from '@/types/models'

export function useOMDBSearch(instanceId: string, query: string, page = 1, type?: 'movie' | 'tv') {
  return useQuery({
    queryKey: ['omdb-search', instanceId, query, page, type],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, page: String(page) })
      if (type) params.set('type', type)
      const { data } = await api.get<{ data: OMDBSearchResponse }>(`/instances/${instanceId}/omdb/search?${params}`)
      return data.data
    },
    enabled: !!instanceId && query.length >= 2,
  })
}

export function useOMDBDetail(instanceId: string, omdbId: string | undefined) {
  return useQuery({
    queryKey: ['omdb-detail', instanceId, omdbId],
    queryFn: async () => {
      const { data } = await api.get<{ data: OMDBDetail }>(`/instances/${instanceId}/omdb/${omdbId}`)
      return data.data
    },
    enabled: !!instanceId && !!omdbId,
  })
}
