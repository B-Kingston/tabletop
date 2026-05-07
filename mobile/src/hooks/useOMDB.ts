import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { omdbKeys } from '@tabletop/shared'

import type { ApiResponse, OMDBDetail } from '@tabletop/shared'

export interface OMDBSearchResult {
  omdbId: string
  title: string
  type: 'movie' | 'tv'
  releaseYear: string
}

interface OMDBSearchResponse {
  page: number
  results: OMDBSearchResult[]
  totalResults: number
}

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Debounced OMDb search.
 * Query is enabled only when the debounced query is non-empty.
 */
export function useOMDBSearch(
  instanceId: string,
  query: string,
  page: number = 1,
  type?: string,
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 3000)
    return () => clearTimeout(timer)
  }, [query])

  const trimmed = debouncedQuery.trim()

  return useQuery<OMDBSearchResult[], Error>({
    queryKey: omdbKeys.search(instanceId, trimmed, page, type),
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        q: trimmed,
        page,
      }
      if (type) params.type = type
      const { data } = await api.get<ApiResponse<OMDBSearchResponse>>(
        `/instances/${instanceId}/omdb/search`,
        { params },
      )
      return data.data.results ?? []
    },
    enabled: !!instanceId && trimmed.length > 0,
  })
}

/**
 * Fetch full OMDb details by IMDb ID.
 */
export function useOMDBDetail(instanceId: string, omdbId: string | undefined) {
  return useQuery<OMDBDetail, Error>({
    queryKey: omdbKeys.detail(instanceId, omdbId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OMDBDetail>>(
        `/instances/${instanceId}/omdb/${omdbId}`,
      )
      return data.data
    },
    enabled: !!instanceId && !!omdbId,
  })
}
