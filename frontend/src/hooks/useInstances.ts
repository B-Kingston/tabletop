import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Instance } from '@/types/models'

export function useInstances() {
  return useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Instance[] }>('/instances')
      return data.data ?? []
    },
  })
}

export function useInstance(id: string) {
  return useQuery({
    queryKey: ['instances', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Instance }>(`/instances/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; password: string }) => {
      const { data } = await api.post<{ data: Instance }>('/instances', input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }),
  })
}

export function useJoinInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { instanceId: string; password: string }) => {
      const { data } = await api.post<{ message: string }>(`/instances/${input.instanceId}/join`, {
        password: input.password,
      })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }),
  })
}

export function useLeaveInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (instanceId: string) => {
      const { data } = await api.post<{ message: string }>(`/instances/${instanceId}/leave`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }),
  })
}
