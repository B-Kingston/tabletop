import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NightDetail } from '../NightDetail'

let isLoading = false

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ instanceId: 'inst-1', nightId: 'night-1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useNights', () => ({
  useNight: () => ({
    data: isLoading
      ? undefined
      : {
          id: 'night-1',
          instanceId: 'inst-1',
          name: 'Barolo & Bolognese Night',
          wineId: 'wine-1',
          recipeId: 'recipe-1',
          mediaId: null,
          createdById: 'user-1',
          updatedById: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          wine: { id: 'wine-1', name: 'Barolo', type: 'red' },
          recipe: { id: 'recipe-1', title: 'Bolognese' },
          media: null,
        },
    isLoading,
    error: null,
  }),
  useUpdateNight: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteNight: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useWines', () => ({
  useWines: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/hooks/useMedia', () => ({
  useMedia: () => ({ data: [], isLoading: false }),
}))

describe('NightDetail', () => {
  beforeEach(() => {
    isLoading = false
  })

  it('renders night name and linked items', () => {
    render(<NightDetail />)

    expect(screen.getByText('Barolo & Bolognese Night')).toBeInTheDocument()
    expect(screen.getByText('Barolo')).toBeInTheDocument()
    expect(screen.getByText('Bolognese')).toBeInTheDocument()
  })

  it('shows edit, respin and delete buttons', () => {
    render(<NightDetail />)

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /respin/i })).toBeInTheDocument()
    // Delete button is icon-only; check there are at least 3 action buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

  it('shows skeleton while loading night detail', () => {
    isLoading = true
    render(<NightDetail />)
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
