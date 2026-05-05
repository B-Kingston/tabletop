import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpinTheNight } from '../SpinTheNight'

let winesLoading = false
let recipesLoading = false
let mediaLoading = false

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ instanceId: 'inst-1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useWines', () => ({
  useWines: () => ({
    data: winesLoading ? undefined : [{ id: 'w1', name: 'Barolo', type: 'red' }],
    isLoading: winesLoading,
  }),
}))

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => ({
    data: recipesLoading ? undefined : [{ id: 'r1', title: 'Bolognese' }],
    isLoading: recipesLoading,
  }),
}))

vi.mock('@/hooks/useMedia', () => ({
  useMedia: () => ({
    data: mediaLoading ? undefined : [{ id: 'm1', title: 'The Godfather' }],
    isLoading: mediaLoading,
  }),
}))

vi.mock('@/hooks/useNights', () => ({
  useCreateNight: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('SpinTheNight', () => {
  beforeEach(() => {
    winesLoading = false
    recipesLoading = false
    mediaLoading = false
  })

  it('shows category toggle buttons', () => {
    render(<SpinTheNight />)
    const toggles = screen.getAllByRole('button')
    const labels = toggles.map((b) => b.textContent)
    expect(labels.some((l) => l?.includes('Wine'))).toBe(true)
    expect(labels.some((l) => l?.includes('Recipe'))).toBe(true)
    expect(labels.some((l) => l?.includes('Media'))).toBe(true)
  })

  it('shows spin button', () => {
    render(<SpinTheNight />)
    expect(screen.getByRole('button', { name: /spin the night/i })).toBeInTheDocument()
  })

  it('toggles categories', () => {
    render(<SpinTheNight />)
    const wineToggle = screen.getAllByRole('button').find((b) => b.textContent?.includes('Wine'))!
    fireEvent.click(wineToggle)
    expect(wineToggle).toHaveClass('bg-neutral-100')
  })

  it('shows skeleton while fetching items', () => {
    winesLoading = true
    recipesLoading = true
    mediaLoading = true
    render(<SpinTheNight />)
    // GridSkeleton renders multiple CardSkeletons with animate-pulse
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
