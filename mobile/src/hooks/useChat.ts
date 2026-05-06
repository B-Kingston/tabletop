import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { chatSessionsKeys } from '@tabletop/shared'

import type { ApiResponse, ChatSession, ChatMessage } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

interface CreateSessionPayload {
  title?: string
}

interface SendMessagePayload {
  content: string
}

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all chat sessions for an instance.
 */
export function useChatSessions(instanceId: string) {
  return useQuery<ChatSession[], Error>({
    queryKey: chatSessionsKeys.list(instanceId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ChatSession[]>>(
        `/instances/${instanceId}/chat/sessions`,
      )
      return data.data
    },
    enabled: !!instanceId,
  })
}

/**
 * Fetch a single chat session with its messages.
 */
export function useChatSession(instanceId: string, sessionId: string) {
  return useQuery<ChatSession, Error>({
    queryKey: chatSessionsKeys.detail(instanceId, sessionId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ChatSession>>(
        `/instances/${instanceId}/chat/sessions/${sessionId}`,
      )
      return data.data
    },
    enabled: !!instanceId && !!sessionId,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Create a new chat session.
 */
export function useCreateChatSession(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<ChatSession, Error, CreateSessionPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<ChatSession>>(
        `/instances/${instanceId}/chat/sessions`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatSessionsKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useCreateChatSession error:', error.message)
    },
  })
}

/**
 * Send a message in a chat session (AI responds with assistant message).
 */
export function useSendMessage(instanceId: string, sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<ChatMessage, Error, SendMessagePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<ChatMessage>>(
        `/instances/${instanceId}/chat/sessions/${sessionId}/messages`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatSessionsKeys.detail(instanceId, sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: chatSessionsKeys.list(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useSendMessage error:', error.message)
    },
  })
}

/**
 * Delete a chat session.
 */
export function useDeleteChatSession(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { sessionId: string }>({
    mutationFn: async ({ sessionId }) => {
      await api.delete(`/instances/${instanceId}/chat/sessions/${sessionId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatSessionsKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useDeleteChatSession error:', error.message)
    },
  })
}
