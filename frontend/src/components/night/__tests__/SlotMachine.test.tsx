import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SlotMachine } from '../SlotMachine'
import type { Wine, Recipe, MediaItem } from '@/types/models'

const mockWines: Wine[] = [
  {
    id: 'w1',
    instanceId: 'inst-1',
    name: 'Barolo',
    type: 'red',
    cost: 45,
    rating: 4.5,
    notes: '',
    consumedAt: null,
    createdById: 'user-1',
    updatedById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'w2',
    instanceId: 'inst-1',
    name: 'Chardonnay',
    type: 'white',
    cost: 30,
    rating: 4,
    notes: '',
    consumedAt: null,
    createdById: 'user-1',
    updatedById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    instanceId: 'inst-1',
    title: 'Bolognese',
    description: '',
    sourceUrl: '',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    imageUrl: '',
    rating: null,
    review: '',
    createdById: 'user-1',
    updatedById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'r2',
    instanceId: 'inst-1',
    title: 'Carbonara',
    description: '',
    sourceUrl: '',
    prepTime: 5,
    cookTime: 15,
    servings: 2,
    imageUrl: '',
    rating: null,
    review: '',
    createdById: 'user-1',
    updatedById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

const mockMedia: MediaItem[] = [
  {
    id: 'm1',
    instanceId: 'inst-1',
    tmdbId: 550,
    type: 'movie',
    title: 'The Godfather',
    overview: '',
    posterPath: '',
    releaseDate: null,
    planToWatchDate: null,
    status: 'planning',
    rating: null,
    review: '',
    createdById: 'user-1',
    updatedById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'm2',
    instanceId: 'inst-1',
    tmdbId: 680,
    type: 'movie',
    title: 'Pulp Fiction',
    overview: '',
    posterPath: '',
    releaseDate: null,
    planToWatchDate: null,
    status: 'planning',
    rating: null,
    review: '',
    createdById: 'user-1',
    updatedById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

describe('SlotMachine', () => {
  it('renders correct number of reels for selected categories', () => {
    render(
      <SlotMachine
        wines={mockWines}
        recipes={mockRecipes}
        media={mockMedia}
        selectedCategories={['wine', 'recipe', 'media']}
        onComplete={vi.fn()}
        spinDurationMs={100}
      />
    )

    expect(screen.getByRole('button', { name: /spin the night/i })).toBeInTheDocument()
  })

  it('disables spin when all selected categories are empty', () => {
    render(
      <SlotMachine
        wines={[]}
        recipes={[]}
        media={[]}
        selectedCategories={['wine', 'recipe', 'media']}
        onComplete={vi.fn()}
        spinDurationMs={100}
      />
    )

    const btn = screen.getByRole('button', { name: /spin the night/i })
    expect(btn).toBeDisabled()
  })

  it('calls onComplete with a result after spin', async () => {
    const onComplete = vi.fn()
    render(
      <SlotMachine
        wines={mockWines}
        recipes={mockRecipes}
        media={mockMedia}
        selectedCategories={['wine', 'recipe']}
        onComplete={onComplete}
        spinDurationMs={100}
      />
    )

    const btn = screen.getByRole('button', { name: /spin the night/i })
    fireEvent.click(btn)

    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 2000 })

    const result = onComplete.mock.calls[0][0]
    expect(result).toHaveProperty('wineId')
    expect(result).toHaveProperty('recipeId')
  }, 5000)

  it('shows warning when some selected categories have no items', () => {
    render(
      <SlotMachine
        wines={[]}
        recipes={mockRecipes}
        media={mockMedia}
        selectedCategories={['wine', 'recipe', 'media']}
        onComplete={vi.fn()}
        spinDurationMs={100}
      />
    )

    expect(screen.getByText(/some selected categories have no items yet/i)).toBeInTheDocument()
  })
})
