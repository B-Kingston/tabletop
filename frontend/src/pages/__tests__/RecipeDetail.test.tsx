import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecipeDetail } from '../RecipeDetail'

const remixMutate = vi.fn()
const restoreMutate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ instanceId: 'inst-1', recipeId: 'recipe-1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useRecipes', () => ({
  useRecipe: () => ({
    data: {
      id: 'recipe-1',
      instanceId: 'inst-1',
      title: 'Test Recipe',
      description: 'A test recipe',
      sourceUrl: '',
      sourceUrls: ['https://example.com/lemon-pasta', 'https://minimalistbaker.com/noodles'],
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      imageUrl: '',
      rating: null,
      review: '',
      createdById: 'user-1',
      updatedById: 'user-1',
      ingredients: [
        { id: 'ing-1', recipeId: 'recipe-1', name: 'Flour', quantity: '2', unit: 'cups', optional: false },
      ],
      steps: [
        { id: 'step-1', recipeId: 'recipe-1', orderIndex: 1, title: '', content: 'Mix ingredients', durationMin: null },
      ],
      tags: [{ id: 'tag-1', name: 'dinner' }],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    isLoading: false,
    error: null,
  }),
  useRecipeVersions: () => ({
    data: [
      {
        id: 'version-2',
        instanceId: 'inst-1',
        recipeId: 'recipe-1',
        versionNumber: 2,
        remixPrompt: 'make it vegetarian',
        snapshot: { title: 'Vegetarian Test Recipe' },
        createdById: 'user-1',
        isCurrent: true,
        createdAt: '2024-01-02T00:00:00Z',
      },
      {
        id: 'version-1',
        instanceId: 'inst-1',
        recipeId: 'recipe-1',
        versionNumber: 1,
        remixPrompt: '',
        snapshot: { title: 'Test Recipe' },
        createdById: 'user-1',
        isCurrent: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ],
  }),
  useRemixRecipe: () => ({ mutate: remixMutate, isPending: false }),
  useRestoreRecipeVersion: () => ({ mutate: restoreMutate, isPending: false }),
  useDeleteRecipe: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('RecipeDetail', () => {
  beforeEach(() => {
    remixMutate.mockReset()
    restoreMutate.mockReset()
  })

  it('opens remix prompt and submits the prompt for the current recipe', async () => {
    const user = userEvent.setup()
    render(<RecipeDetail />)

    await user.click(screen.getByRole('button', { name: /remix/i }))
    await user.type(screen.getByLabelText(/what should change/i), 'make it vegetarian')
    await user.click(screen.getByRole('button', { name: /remix recipe/i }))

    expect(remixMutate).toHaveBeenCalledWith(
      { prompt: 'make it vegetarian', simplicity: 3 },
      expect.any(Object)
    )
  })

  it('shows recipe versions and restores an older version', async () => {
    const user = userEvent.setup()
    render(<RecipeDetail />)

    expect(screen.getByText('Vegetarian Test Recipe')).toBeInTheDocument()
    expect(screen.getByText('Original recipe')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /test recipe original recipe/i }))

    expect(restoreMutate).toHaveBeenCalledWith('version-1')
  })

  it('shows persisted recipe sources in the sidebar', () => {
    render(<RecipeDetail />)

    expect(screen.getByText('Sources')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /example.com/i })).toHaveAttribute(
      'href',
      'https://example.com/lemon-pasta'
    )
    expect(screen.getByRole('link', { name: /minimalistbaker.com/i })).toHaveAttribute(
      'href',
      'https://minimalistbaker.com/noodles'
    )
  })
})
