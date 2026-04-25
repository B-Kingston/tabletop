import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ChatSession, ChatMessage } from '@/types/models'

export function useChatSessions(instanceId: string) {
  return useQuery({
    queryKey: ['chat-sessions', instanceId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChatSession[] }>(`/instances/${instanceId}/chat/sessions`)
      return data.data
    },
    enabled: !!instanceId,
  })
}

export function useChatSession(instanceId: string, sessionId: string) {
  return useQuery({
    queryKey: ['chat-sessions', instanceId, sessionId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChatSession }>(`/instances/${instanceId}/chat/sessions/${sessionId}`)
      return data.data
    },
    enabled: !!instanceId && !!sessionId,
  })
}

export function useCreateChatSession(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title?: string) => {
      const { data } = await api.post<{ data: ChatSession }>(`/instances/${instanceId}/chat/sessions`, { title })
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-sessions', instanceId] }),
  })
}

export function useSendMessage(instanceId: string, sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<{ data: ChatMessage }>(
        `/instances/${instanceId}/chat/sessions/${sessionId}/messages`,
        { content }
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-sessions', instanceId, sessionId] }),
  })
}

export function useDeleteChatSession(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/instances/${instanceId}/chat/sessions/${sessionId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-sessions', instanceId] }),
  })
}
