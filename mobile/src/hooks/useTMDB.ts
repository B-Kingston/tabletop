import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { tmdbKeys } from '@tabletop/shared'

import type {
  ApiResponse,
  TMDBSearchResult,
  TMDBSearchResponse,
  TMDBMovieDetails,
  TMDBTVDetails,
} from '@tabletop/shared'

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Debounced TMDB search.
 * Query is enabled only when the debounced query is non-empty.
 */
export function useTMDBSearch(
  instanceId: string,
  query: string,
  page: number = 1,
  type?: string,
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const trimmed = debouncedQuery.trim()

  return useQuery<TMDBSearchResult[], Error>({
    queryKey: tmdbKeys.search(instanceId, trimmed, page, type),
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        q: trimmed,
        page,
      }
      if (type) params.type = type
      const { data } = await api.get<ApiResponse<TMDBSearchResponse>>(
        `/instances/${instanceId}/tmdb/search`,
        { params },
      )
      return data.data.results ?? []
    },
    enabled: !!instanceId && trimmed.length > 0,
  })
}

/**
 * Fetch TMDB movie details.
 */
export function useTMDBMovieDetails(instanceId: string, tmdbId: number) {
  return useQuery<TMDBMovieDetails, Error>({
    queryKey: tmdbKeys.movie(instanceId, tmdbId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TMDBMovieDetails>>(
        `/instances/${instanceId}/tmdb/movie/${tmdbId}`,
      )
      return data.data
    },
    enabled: !!instanceId && tmdbId > 0,
  })
}

/**
 * Fetch TMDB TV details.
 */
export function useTMDBTVDetails(instanceId: string, tmdbId: number) {
  return useQuery<TMDBTVDetails, Error>({
    queryKey: tmdbKeys.tv(instanceId, tmdbId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TMDBTVDetails>>(
        `/instances/${instanceId}/tmdb/tv/${tmdbId}`,
      )
      return data.data
    },
    enabled: !!instanceId && tmdbId > 0,
  })
}
