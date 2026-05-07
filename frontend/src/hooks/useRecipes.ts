import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Recipe, RecipeVersion } from '@/types/models'

interface RecipeInput {
  title: string
  description?: string
  sourceUrl?: string
  sourceUrls?: string[]
  prepTime?: number
  cookTime?: number
  servings?: number
  imageUrl?: string
  ingredients?: { name: string; quantity?: string; unit?: string; optional?: boolean }[]
  steps?: { orderIndex: number; title?: string; content: string; durationMin?: number | null }[]
  tags?: string[]
}

export function useRecipes(instanceId: string, tag?: string) {
  return useQuery({
    queryKey: ['recipes', instanceId, tag],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (tag) params.set('tag', tag)
      const { data } = await api.get<{ data: Recipe[] }>(`/instances/${instanceId}/recipes?${params}`)
      return data.data ?? []
    },
    enabled: !!instanceId,
  })
}

export function useRecipe(instanceId: string, recipeId: string) {
  return useQuery({
    queryKey: ['recipes', instanceId, recipeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Recipe }>(`/instances/${instanceId}/recipes/${recipeId}`)
      return data.data
    },
    enabled: !!instanceId && !!recipeId,
  })
}

export function useRecipeVersions(instanceId: string, recipeId: string) {
  return useQuery({
    queryKey: ['recipes', instanceId, recipeId, 'versions'],
    queryFn: async () => {
      const { data } = await api.get<{ data: RecipeVersion[] }>(
        `/instances/${instanceId}/recipes/${recipeId}/versions`
      )
      return data.data ?? []
    },
    enabled: !!instanceId && !!recipeId,
  })
}

export function useCreateRecipe(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecipeInput) => {
      const { data } = await api.post<{ data: Recipe }>(`/instances/${instanceId}/recipes`, input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', instanceId] }),
  })
}

export function useUpdateRecipe(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecipeInput & { recipeId: string }) => {
      const { data } = await api.patch<{ data: Recipe }>(
        `/instances/${instanceId}/recipes/${input.recipeId}`,
        input
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', instanceId] }),
  })
}

export function useRemixRecipe(instanceId: string, recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { prompt: string; simplicity?: number }) => {
      const { data } = await api.post<{ data: Recipe }>(
        `/instances/${instanceId}/recipes/${recipeId}/remix`,
        input
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes', instanceId] })
      qc.invalidateQueries({ queryKey: ['recipes', instanceId, recipeId] })
      qc.invalidateQueries({ queryKey: ['recipes', instanceId, recipeId, 'versions'] })
    },
  })
}

export function useRestoreRecipeVersion(instanceId: string, recipeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data } = await api.post<{ data: Recipe }>(
        `/instances/${instanceId}/recipes/${recipeId}/versions/${versionId}/restore`
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes', instanceId] })
      qc.invalidateQueries({ queryKey: ['recipes', instanceId, recipeId] })
      qc.invalidateQueries({ queryKey: ['recipes', instanceId, recipeId, 'versions'] })
    },
  })
}

export function useDeleteRecipe(instanceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recipeId: string) => {
      await api.delete(`/instances/${instanceId}/recipes/${recipeId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes', instanceId] }),
  })
}
