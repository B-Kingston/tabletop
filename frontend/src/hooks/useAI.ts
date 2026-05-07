import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useAIChat(instanceId: string) {
  return useMutation({
    mutationFn: async (messages: { role: string; content: string }[]) => {
      const { data } = await api.post(`/instances/${instanceId}/ai/chat`, { messages })
      return data
    },
  })
}

