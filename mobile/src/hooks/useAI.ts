import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import { api } from '@/lib/api'
import {
  parseGeneratedRecipeResponse,
  type GenerateRecipeResponse,
  type OpenAIRecipeResponse,
} from '@/utils/aiRecipeParser'

import type { ApiResponse } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

/**
 * Structured error for rate-limiting responses.
 * Extends Error so it integrates with TanStack Query's error type.
 */
export class RateLimitError extends Error {
  type: 'daily_limit' | 'service_unavailable'

  constructor(type: 'daily_limit' | 'service_unavailable', message: string) {
    super(message)
    this.name = 'RateLimitError'
    this.type = type
  }
}

interface AIChatPayload {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
}

interface AIChatResponse {
  role: 'assistant'
  content: string
}

interface GenerateRecipePayload {
  prompt: string
}

export type { GenerateRecipeResponse }

// ── Helpers ───────────────────────────────────────────────────────────────

function classifyRateLimitError(error: unknown): RateLimitError | null {
  const axiosError = error as AxiosError | undefined
  if (!axiosError?.response) return null

  const status = axiosError.response.status
  if (status === 429) {
    return new RateLimitError(
      'daily_limit',
      'Daily AI request limit reached. Try again tomorrow.',
    )
  }
  if (status === 503) {
    return new RateLimitError(
      'service_unavailable',
      'AI service is temporarily unavailable. Please try again later.',
    )
  }

  return null
}

// ── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Direct AI chat — send a list of messages and receive an assistant reply.
 * Rate-limit errors (429 / 503) are thrown as RateLimitError.
 */
export function useAIChat(instanceId: string) {
  return useMutation<AIChatResponse, Error, AIChatPayload>({
    mutationFn: async (payload) => {
      try {
        const { data } = await api.post<ApiResponse<AIChatResponse>>(
          `/instances/${instanceId}/ai/chat`,
          payload,
        )
        return data.data
      } catch (error) {
        const rateLimit = classifyRateLimitError(error)
        if (rateLimit) throw rateLimit
        throw error
      }
    },
    onError: (error) => {
      if (!(error instanceof RateLimitError)) {
        console.warn('useAIChat error:', error.message)
      }
    },
  })
}

/**
 * Generate a recipe from a natural-language prompt.
 * Rate-limit errors (429 / 503) are thrown as RateLimitError.
 */
export function useGenerateRecipe(instanceId: string) {
  return useMutation<GenerateRecipeResponse, Error, GenerateRecipePayload>({
    mutationFn: async (payload) => {
      try {
        const { data } = await api.post<ApiResponse<OpenAIRecipeResponse>>(
          `/instances/${instanceId}/chat/generate-recipe`,
          payload,
        )
        return parseGeneratedRecipeResponse(data.data)
      } catch (error) {
        const rateLimit = classifyRateLimitError(error)
        if (rateLimit) throw rateLimit
        throw error
      }
    },
    onError: (error) => {
      if (!(error instanceof RateLimitError)) {
        console.warn('useGenerateRecipe error:', error.message)
      }
    },
  })
}
