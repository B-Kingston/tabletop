import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Wine } from '@/types/models'

interface WineInput {
  name: string
  producer?: string
  type: string
  vintage?: number | null
  cost?: number | null
  currency?: string
  rating?: number | null
  notes?: string
  consumedAt?: string | null
}

export function useWines(instanceId: string, type?: string) {
  return useQuery({
    queryKey: ['wines', instanceId, type],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      const { data } = await api.get<{ data: Wine[] }>(`/instances/${instanceId}/wines?${params}`)
      return data.data ?? []
    },
    enabled: !!instanceId,
  })
}

export function useWine(instanceId: string, wineId: string) {
  return useQuery({
    queryKey: ['wines', instanceId, wineId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Wine }>(`/instances/${instanceId}/wines/${wineId}`)
      return data.data
    },
    enabled: !!instanceId && !!wineId,
  })
}

export function useCreateWine(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: WineInput) => {
      const { data } = await api.post<{ data: Wine }>(`/instances/${instanceId}/wines`, input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wines', instanceId] }),
  })
}

export function useUpdateWine(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: WineInput & { wineId: string }) => {
      const { data } = await api.patch<{ data: Wine }>(
        `/instances/${instanceId}/wines/${input.wineId}`,
        input
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wines', instanceId] }),
  })
}

export function useDeleteWine(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (wineId: string) => {
      await api.delete(`/instances/${instanceId}/wines/${wineId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wines', instanceId] }),
  })
}
