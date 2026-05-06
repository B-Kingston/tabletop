import { describe, expect, it } from '@jest/globals'
import { parseGeneratedRecipeResponse } from '../aiRecipeParser'

describe('parseGeneratedRecipeResponse', () => {
  it('parses the recipe JSON inside the OpenAI response envelope', () => {
    const parsed = parseGeneratedRecipeResponse({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Pasta',
              description: 'Fast dinner',
              prepTime: 10,
              cookTime: 15,
              servings: 2,
              ingredients: [{ name: 'Pasta', quantity: '200', unit: 'g' }],
              steps: [{ title: 'Boil', content: 'Boil the pasta.', durationMin: 10 }],
              tags: ['Dinner', 'Quick'],
            }),
          },
        },
      ],
    })

    expect(parsed).toEqual({
      title: 'Pasta',
      description: 'Fast dinner',
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      ingredients: [{ name: 'Pasta', quantity: '200', unit: 'g' }],
      steps: [{ title: 'Boil', content: 'Boil the pasta.', durationMin: 10 }],
      tags: ['Dinner', 'Quick'],
    })
  })

  it('accepts fenced JSON content', () => {
    const parsed = parseGeneratedRecipeResponse({
      choices: [
        {
          message: {
            content: '```json\n{"title":"Soup","steps":[{"content":"Simmer."}]}\n```',
          },
        },
      ],
    })

    expect(parsed.title).toBe('Soup')
    expect(parsed.steps).toEqual([{ title: undefined, content: 'Simmer.', durationMin: undefined }])
  })

  it('throws when the assistant content is not valid recipe JSON', () => {
    expect(() =>
      parseGeneratedRecipeResponse({
        choices: [{ message: { content: 'Here is a recipe, probably.' } }],
      }),
    ).toThrow('AI response was not valid recipe JSON')
  })
})
