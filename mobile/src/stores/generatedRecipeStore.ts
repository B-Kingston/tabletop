/**
 * Lightweight in-memory bridge for passing AI-generated recipe data
 * from the recipe generation screen to the recipe create screen.
 *
 * Values are consumed once (read-then-clear) to avoid stale data.
 */

import type { GenerateRecipeResponse } from '@/utils/aiRecipeParser'

let stored: GenerateRecipeResponse | null = null

export function setGeneratedRecipe(recipe: GenerateRecipeResponse): void {
  stored = recipe
}

export function getGeneratedRecipe(): GenerateRecipeResponse | null {
  const result = stored
  stored = null
  return result
}
