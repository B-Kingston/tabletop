export interface GenerateRecipeResponse {
  title?: string
  description?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  ingredients?: Array<{ name: string; quantity?: string; unit?: string }>
  steps?: Array<{ title?: string; content: string; durationMin?: number }>
  tags?: string[]
}

export interface OpenAIRecipeResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced?.[1]?.trim() ?? trimmed
}

export function parseGeneratedRecipeResponse(
  response: OpenAIRecipeResponse,
): GenerateRecipeResponse {
  const content = response.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI response did not include recipe content')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFence(content))
  } catch {
    throw new Error('AI response was not valid recipe JSON')
  }

  if (!isRecord(parsed)) {
    throw new Error('AI response recipe was not an object')
  }

  const title = optionalString(parsed.title)
  if (!title) {
    throw new Error('AI response recipe did not include a title')
  }

  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients
        .filter(isRecord)
        .map((ingredient) => ({
          name: optionalString(ingredient.name) ?? '',
          quantity: optionalString(ingredient.quantity),
          unit: optionalString(ingredient.unit),
        }))
        .filter((ingredient) => ingredient.name.length > 0)
    : undefined

  const steps = Array.isArray(parsed.steps)
    ? parsed.steps
        .filter(isRecord)
        .map((step) => ({
          title: optionalString(step.title),
          content: optionalString(step.content) ?? '',
          durationMin: optionalNumber(step.durationMin),
        }))
        .filter((step) => step.content.length > 0)
    : undefined

  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : undefined

  return {
    title,
    description: optionalString(parsed.description),
    prepTime: optionalNumber(parsed.prepTime),
    cookTime: optionalNumber(parsed.cookTime),
    servings: optionalNumber(parsed.servings),
    ingredients,
    steps,
    tags,
  }
}
