import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { nightsKeys } from '@tabletop/shared'

import type { ApiResponse, Night } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

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

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all game nights for an instance.
 */
export function useNights(instanceId: string) {
  return useQuery<Night[], Error>({
    queryKey: nightsKeys.list(instanceId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Night[]>>(
        `/instances/${instanceId}/nights`,
      )
      return data.data ?? []
    },
    enabled: !!instanceId,
  })
}

/**
 * Fetch a single game night by ID.
 */
export function useNight(instanceId: string, nightId: string) {
  return useQuery<Night, Error>({
    queryKey: nightsKeys.detail(instanceId, nightId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Night>>(
        `/instances/${instanceId}/nights/${nightId}`,
      )
      return data.data
    },
    enabled: !!instanceId && !!nightId,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Create a new game night with optimistic insertion at the top of the list.
 */
interface CreateContext {
  previous: Night[] | undefined
}

export function useCreateNight(instanceId: string) {
  const queryClient = useQueryClient()
  const listKey = nightsKeys.list(instanceId)

  return useMutation<Night, Error, NightInput, CreateContext>({
    mutationFn: async (input) => {
      const { data } = await api.post<ApiResponse<Night>>(
        `/instances/${instanceId}/nights`,
        input,
      )
      return data.data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<Night[]>(listKey)

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

      queryClient.setQueryData<Night[]>(listKey, (old) => {
        return old ? [optimistic, ...old] : [optimistic]
      })

      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}

interface UpdateContext {
  previousList: Night[] | undefined
  previousItem: Night | undefined
}

/**
 * Update an existing game night with optimistic cache morphing.
 */
export function useUpdateNight(instanceId: string) {
  const queryClient = useQueryClient()
  const listKey = nightsKeys.list(instanceId)

  return useMutation<Night, Error, NightUpdateInput, UpdateContext>({
    mutationFn: async (input) => {
      const { nightId, ...body } = input
      const { data } = await api.patch<ApiResponse<Night>>(
        `/instances/${instanceId}/nights/${nightId}`,
        body,
      )
      return data.data
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listKey })

      const previousList = queryClient.getQueryData<Night[]>(listKey)
      const detailKey = nightsKeys.detail(instanceId, input.nightId)
      const previousItem = queryClient.getQueryData<Night>(detailKey)

      const update = (night: Night): Night => ({
        ...night,
        name: input.name ?? night.name,
        wineId: input.clearWine ? null : input.wineId !== undefined ? input.wineId : night.wineId,
        recipeId: input.clearRecipe ? null : input.recipeId !== undefined ? input.recipeId : night.recipeId,
        mediaId: input.clearMedia ? null : input.mediaId !== undefined ? input.mediaId : night.mediaId,
        updatedAt: new Date().toISOString(),
      })

      queryClient.setQueryData<Night[]>(listKey, (old) => {
        return old?.map((n) => (n.id === input.nightId ? update(n) : n))
      })
      queryClient.setQueryData<Night>(detailKey, (old) => {
        return old ? update(old) : old
      })

      return { previousList, previousItem }
    },
    onError: (_err, input, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(listKey, context.previousList)
      }
      if (context?.previousItem) {
        queryClient.setQueryData(
          nightsKeys.detail(instanceId, input.nightId),
          context.previousItem,
        )
      }
    },
    onSettled: (_data, _err, input) => {
      void queryClient.invalidateQueries({ queryKey: listKey })
      void queryClient.invalidateQueries({
        queryKey: nightsKeys.detail(instanceId, input.nightId),
      })
    },
  })
}

interface DeleteContext {
  previous: Night[] | undefined
}

/**
 * Delete a game night with optimistic removal from the list.
 */
export function useDeleteNight(instanceId: string) {
  const queryClient = useQueryClient()
  const listKey = nightsKeys.list(instanceId)

  return useMutation<void, Error, string, DeleteContext>({
    mutationFn: async (nightId) => {
      await api.delete(`/instances/${instanceId}/nights/${nightId}`)
    },
    onMutate: async (nightId) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<Night[]>(listKey)

      queryClient.setQueryData<Night[]>(listKey, (old) => {
        return old?.filter((n) => n.id !== nightId)
      })

      return { previous }
    },
    onError: (_err, _nightId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}
