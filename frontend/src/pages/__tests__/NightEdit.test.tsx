import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NightEdit } from '../NightEdit'

let editNightId: string | undefined = undefined
let nightData: Record<string, unknown> | undefined = undefined

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ instanceId: 'inst-1', nightId: editNightId }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/useWines', () => ({
  useWines: () => ({
    data: [{ id: 'w1', name: 'Barolo', type: 'red' }],
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => ({
    data: [{ id: 'r1', title: 'Bolognese' }],
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useMedia', () => ({
  useMedia: () => ({
    data: [{ id: 'm1', title: 'The Godfather' }],
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useNights', () => ({
  useCreateNight: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateNight: () => ({ mutate: vi.fn(), isPending: false }),
  useNight: () => ({
    data: nightData,
    isLoading: !nightData,
  }),
}))

describe('NightEdit', () => {
  beforeEach(() => {
    editNightId = undefined
    nightData = undefined
  })

  it('renders create mode form', () => {
    render(<NightEdit />)
    expect(screen.getByText('New Night')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Wine')).toBeInTheDocument()
    expect(screen.getByLabelText('Recipe')).toBeInTheDocument()
    expect(screen.getByLabelText('Media')).toBeInTheDocument()
  })

  it('renders edit mode form with pre-populated fields', () => {
    editNightId = 'night-1'
    nightData = {
      id: 'night-1',
      name: 'Test Night',
      wineId: 'w1',
      recipeId: null,
      mediaId: null,
    }
    render(<NightEdit />)
    expect(screen.getByText('Edit Night')).toBeInTheDocument()
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    expect(nameInput.value).toBe('Test Night')
    const wineSelect = screen.getByLabelText('Wine') as HTMLSelectElement
    expect(wineSelect.value).toBe('w1')
  })
})
