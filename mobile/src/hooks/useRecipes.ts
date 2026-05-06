import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { recipesKeys } from '@tabletop/shared'

import type { ApiResponse, Recipe } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

interface CreateRecipePayload {
  title: string
  description?: string
  sourceUrl?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  imageUrl?: string
  rating?: number
  review?: string
  ingredients?: { name: string; quantity?: string; unit?: string; optional?: boolean }[]
  steps?: { orderIndex?: number; title?: string; content: string; durationMin?: number }[]
  tags?: string[]
}

type UpdateRecipePayload = Partial<CreateRecipePayload>

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetch all recipes for an instance, optionally filtered by tag.
 */
export function useRecipes(instanceId: string, tag?: string) {
  return useQuery<Recipe[], Error>({
    queryKey: recipesKeys.list(instanceId, tag),
    queryFn: async () => {
      const params = tag ? { tag } : {}
      const { data } = await api.get<ApiResponse<Recipe[]>>(
        `/instances/${instanceId}/recipes`,
        { params },
      )
      return data.data
    },
    enabled: !!instanceId,
  })
}

/**
 * Fetch a single recipe by ID.
 */
export function useRecipe(instanceId: string, recipeId: string) {
  return useQuery<Recipe, Error>({
    queryKey: recipesKeys.detail(instanceId, recipeId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Recipe>>(
        `/instances/${instanceId}/recipes/${recipeId}`,
      )
      return data.data
    },
    enabled: !!instanceId && !!recipeId,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Create a new recipe.
 */
export function useCreateRecipe(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<Recipe, Error, CreateRecipePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiResponse<Recipe>>(
        `/instances/${instanceId}/recipes`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recipesKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useCreateRecipe error:', error.message)
    },
  })
}

/**
 * Update an existing recipe.
 */
export function useUpdateRecipe(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<Recipe, Error, { recipeId: string; payload: UpdateRecipePayload }>({
    mutationFn: async ({ recipeId, payload }) => {
      const { data } = await api.patch<ApiResponse<Recipe>>(
        `/instances/${instanceId}/recipes/${recipeId}`,
        payload,
      )
      return data.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: recipesKeys.all(instanceId),
      })
      void queryClient.invalidateQueries({
        queryKey: recipesKeys.detail(instanceId, variables.recipeId),
      })
    },
    onError: (error) => {
      console.warn('useUpdateRecipe error:', error.message)
    },
  })
}

/**
 * Delete a recipe.
 */
export function useDeleteRecipe(instanceId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { recipeId: string }>({
    mutationFn: async ({ recipeId }) => {
      await api.delete(`/instances/${instanceId}/recipes/${recipeId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recipesKeys.all(instanceId),
      })
    },
    onError: (error) => {
      console.warn('useDeleteRecipe error:', error.message)
    },
  })
}
