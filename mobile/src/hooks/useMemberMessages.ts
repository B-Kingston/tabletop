import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { memberMessagesKeys } from '@tabletop/shared'

import type { ApiResponse, MemberMessage } from '@tabletop/shared'

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Poll member messages every 5 seconds.
 * Automatically pauses when the screen is not focused (refetchInterval
 * only ticks while the query is active, and React Navigation suspends
 * query observers for unfocused screens).
 */
export function useMemberMessages(instanceId: string) {
  return useQuery<MemberMessage[], Error>({
    queryKey: memberMessagesKeys.list(instanceId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MemberMessage[]>>(
        `/instances/${instanceId}/messages`,
      )
      return data.data
    },
    enabled: !!instanceId,
    refetchInterval: 5_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Send a message with optimistic cache append.
 *
 * Strategy:
 * 1. onMutate — append a temp message (id = `temp-…`) immediately so the
 *    UI updates before the server responds.
 * 2. onSuccess — replace the temp message with the real server response,
 *    deduplicating by message.id.
 * 3. onError — remove the temp message from the cache.
 */
export function useSendMemberMessage(instanceId: string, tempUser?: MemberMessage['user']) {
  const queryClient = useQueryClient()
  const queryKey = memberMessagesKeys.list(instanceId)

  return useMutation<MemberMessage, Error, string, { optimisticId: string; previousMessages: MemberMessage[] }>({
    mutationFn: async (content) => {
      const { data } = await api.post<ApiResponse<MemberMessage>>(
        `/instances/${instanceId}/messages`,
        { content },
      )
      return data.data
    },

    onMutate: async (content) => {
      // Cancel any in-flight list fetches so they don't clobber our optimistic update
      await queryClient.cancelQueries({ queryKey })

      const previousMessages = queryClient.getQueryData<MemberMessage[]>(queryKey) ?? []

      const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      const optimistic: MemberMessage = {
        id: optimisticId,
        instanceId,
        userId: '',
        content,
        createdAt: new Date().toISOString(),
        user: tempUser,
      }

      queryClient.setQueryData<MemberMessage[]>(queryKey, [...previousMessages, optimistic])

      return { optimisticId, previousMessages }
    },

    onSuccess: (serverMessage, _content, context) => {
      if (!context) return

      queryClient.setQueryData<MemberMessage[]>(queryKey, (old) => {
        const existing = old ?? []
        // Replace the optimistic entry (by temp id) with the real server message
        // Also deduplicate in case the server message arrived via polling already
        const filtered = existing.filter(
          (m) => m.id !== context.optimisticId && m.id !== serverMessage.id,
        )
        return [...filtered, serverMessage]
      })
    },

    onError: (_error, _content, context) => {
      if (!context) return

      queryClient.setQueryData<MemberMessage[]>(queryKey, (old) => {
        const existing = old ?? []
        return existing.filter((m) => m.id !== context.optimisticId)
      })
    },
  })
}

// ── Standalone append (e.g. future WebSocket use) ─────────────────────────

/**
 * Returns a callback that appends a message to the query cache with
 * duplicate detection by message.id. Designed for real-time WebSocket
 * ingestion in the future.
 */
export function useAppendMemberMessage(instanceId: string) {
  const queryClient = useQueryClient()
  const queryKey = memberMessagesKeys.list(instanceId)

  return useCallback(
    (message: MemberMessage) => {
      queryClient.setQueryData<MemberMessage[]>(queryKey, (old) => {
        const existing = old ?? []
        if (existing.some((m) => m.id === message.id)) {
          return existing
        }
        return [...existing, message]
      })
    },
    [queryClient, queryKey],
  )
}
