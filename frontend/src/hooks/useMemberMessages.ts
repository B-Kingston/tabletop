import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MemberMessage } from '@/types/models'

const memberMessagesKey = (instanceId: string) => ['member-messages', instanceId] as const

function appendMessage(messages: MemberMessage[] | undefined, message: MemberMessage) {
  const existing = messages ?? []
  if (existing.some((item) => item.id === message.id)) return existing
  return [...existing, message]
}

export function useMemberMessages(instanceId: string) {
  return useQuery({
    queryKey: memberMessagesKey(instanceId),
    queryFn: async () => {
      const { data } = await api.get<{ data: MemberMessage[] }>(`/instances/${instanceId}/messages`)
      return data.data
    },
    enabled: !!instanceId,
  })
}

export function useSendMemberMessage(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<{ data: MemberMessage }>(`/instances/${instanceId}/messages`, { content })
      return data.data
    },
    onSuccess: (message) => {
      qc.setQueryData<MemberMessage[]>(memberMessagesKey(instanceId), (current) => appendMessage(current, message))
    },
  })
}

export function useAppendMemberMessage(instanceId: string) {
  const qc = useQueryClient()
  return useCallback((message: MemberMessage) => {
    qc.setQueryData<MemberMessage[]>(memberMessagesKey(instanceId), (current) => appendMessage(current, message))
  }, [instanceId, qc])
}
