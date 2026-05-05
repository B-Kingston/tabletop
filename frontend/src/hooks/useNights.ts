import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Night } from '@/types/models'

export interface NightInput {
  name?: string
  wineId?: string | null
  recipeId?: string | null
  mediaId?: string | null
}

export interface NightUpdateInput extends NightInput {
  nightId: string
  clearWine?: boolean
  clearRecipe?: boolean
  clearMedia?: boolean
}

export function useNights(instanceId: string) {
  return useQuery({
    queryKey: ['nights', instanceId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Night[] }>(`/instances/${instanceId}/nights`)
      return data.data ?? []
    },
    enabled: !!instanceId,
  })
}

export function useNight(instanceId: string, nightId: string) {
  return useQuery({
    queryKey: ['nights', instanceId, nightId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Night }>(`/instances/${instanceId}/nights/${nightId}`)
      return data.data
    },
    enabled: !!instanceId && !!nightId,
  })
}

export function useCreateNight(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NightInput) => {
      const { data } = await api.post<{ data: Night }>(`/instances/${instanceId}/nights`, input)
      return data.data
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['nights', instanceId] })
      const previous = qc.getQueryData<Night[]>(['nights', instanceId])
      const optimistic: Night = {
        id: `optimistic-${Date.now()}`,
        instanceId,
        name: input.name || 'New Night',
        wineId: input.wineId ?? null,
        recipeId: input.recipeId ?? null,
        mediaId: input.mediaId ?? null,
        createdById: '',
        updatedById: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      qc.setQueryData(['nights', instanceId], (old: Night[] | undefined) => {
        return old ? [optimistic, ...old] : [optimistic]
      })
      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        qc.setQueryData(['nights', instanceId], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['nights', instanceId] })
    },
  })
}

export function useUpdateNight(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NightUpdateInput) => {
      const { nightId, ...body } = input
      const { data } = await api.patch<{ data: Night }>(`/instances/${instanceId}/nights/${nightId}`, body)
      return data.data
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['nights', instanceId] })
      const previousList = qc.getQueryData<Night[]>(['nights', instanceId])
      const previousItem = qc.getQueryData<Night>(['nights', instanceId, input.nightId])

      const update = (night: Night | undefined): Night | undefined => {
        if (!night) return night
        return {
          ...night,
          name: input.name ?? night.name,
          wineId: input.clearWine ? null : (input.wineId ?? night.wineId),
          recipeId: input.clearRecipe ? null : (input.recipeId ?? night.recipeId),
          mediaId: input.clearMedia ? null : (input.mediaId ?? night.mediaId),
          updatedAt: new Date().toISOString(),
        }
      }

      qc.setQueryData(['nights', instanceId], (old: Night[] | undefined) => {
        return old?.map((n) => (n.id === input.nightId ? update(n)! : n))
      })
      qc.setQueryData(['nights', instanceId, input.nightId], (old: Night | undefined) => update(old))

      return { previousList, previousItem }
    },
    onError: (_err, input, context) => {
      if (context?.previousList) qc.setQueryData(['nights', instanceId], context.previousList)
      if (context?.previousItem) qc.setQueryData(['nights', instanceId, input.nightId], context.previousItem)
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: ['nights', instanceId] })
      qc.invalidateQueries({ queryKey: ['nights', instanceId, input.nightId] })
    },
  })
}

export function useDeleteNight(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nightId: string) => {
      await api.delete(`/instances/${instanceId}/nights/${nightId}`)
    },
    onMutate: async (nightId) => {
      await qc.cancelQueries({ queryKey: ['nights', instanceId] })
      const previous = qc.getQueryData<Night[]>(['nights', instanceId])
      qc.setQueryData(['nights', instanceId], (old: Night[] | undefined) => {
        return old?.filter((n) => n.id !== nightId)
      })
      return { previous }
    },
    onError: (_err, _nightId, context) => {
      if (context?.previous) {
        qc.setQueryData(['nights', instanceId], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['nights', instanceId] })
    },
  })
}
