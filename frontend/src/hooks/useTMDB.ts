import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TMDBMovieDetails, TMDBTVDetails } from '@/types/models'

export function useTMDBSearch(instanceId: string, query: string, page = 1, type = 'multi') {
  return useQuery({
    queryKey: ['tmdb-search', instanceId, query, page, type],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, page: String(page), type })
      const { data } = await api.get(`/instances/${instanceId}/tmdb/search?${params}`)
      return data
    },
    enabled: !!instanceId && query.length > 0,
  })
}

export function useTMDBMovieDetails(instanceId: string, tmdbId: number) {
  return useQuery({
    queryKey: ['tmdb-movie', instanceId, tmdbId],
    queryFn: async () => {
      const { data } = await api.get<TMDBMovieDetails>(`/instances/${instanceId}/tmdb/movie/${tmdbId}`)
      return data
    },
    enabled: !!instanceId && !!tmdbId,
  })
}

export function useTMDBTVDetails(instanceId: string, tmdbId: number) {
  return useQuery({
    queryKey: ['tmdb-tv', instanceId, tmdbId],
    queryFn: async () => {
      const { data } = await api.get<TMDBTVDetails>(`/instances/${instanceId}/tmdb/tv/${tmdbId}`)
      return data
    },
    enabled: !!instanceId && !!tmdbId,
  })
}
