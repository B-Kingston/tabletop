import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NightList } from '../NightList'

let isLoading = false

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ instanceId: 'inst-1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useNights', () => ({
  useNights: () => ({
    data: isLoading
      ? undefined
      : [
          {
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
            createdBy: { id: 'user-1', name: 'Test User', avatarUrl: '' },
          },
        ],
    isLoading,
    error: null,
  }),
}))

describe('NightList', () => {
  beforeEach(() => {
    isLoading = false
  })

  it('renders night list with items', () => {
    render(<NightList />)

    expect(screen.getByText('Nights')).toBeInTheDocument()
    expect(screen.getByText('Barolo & Bolognese Night')).toBeInTheDocument()
    expect(screen.getByText('1 night planned')).toBeInTheDocument()
  })

  it('shows spin and new buttons', () => {
    render(<NightList />)

    expect(screen.getByRole('button', { name: /spin the night/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new night/i })).toBeInTheDocument()
  })

  it('shows skeleton while loading nights list', () => {
    isLoading = true
    render(<NightList />)
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
