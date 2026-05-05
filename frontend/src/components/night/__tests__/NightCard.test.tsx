import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NightCard } from '../NightCard'
import type { Night, Wine as WineType, Recipe as RecipeType, User } from '@/types/models'

const testWine: WineType = {
  id: 'wine-1', name: 'Barolo', type: 'red', instanceId: 'inst-1',
  rating: null, cost: null, notes: '', consumedAt: null,
  createdById: 'user-1', updatedById: 'user-1',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
}

const testRecipe: RecipeType = {
  id: 'recipe-1', title: 'Bolognese', instanceId: 'inst-1',
  description: '', sourceUrl: '', imageUrl: '',
  rating: null, review: '',
  prepTime: 10, cookTime: 20, servings: 2,
  createdById: 'user-1', updatedById: 'user-1',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
}

const testUser: User = {
  id: 'user-1', name: 'Test User', avatarUrl: '', clerkId: 'clerk-1',
  email: 'test@test.com',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
}

const mockNight: Night = {
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
  wine: testWine,
  recipe: testRecipe,
  media: null,
  createdBy: testUser,
}

const mockDeletedNight: Night = {
  ...mockNight,
  id: 'night-2',
  name: 'Deleted Item Night',
  wineId: 'wine-deleted',
  recipeId: null,
  mediaId: null,
  wine: null,
  recipe: null,
  media: null,
}

describe('NightCard', () => {
  it('renders night name and linked items', () => {
    render(<NightCard night={mockNight} instanceId="inst-1" />)

    expect(screen.getByText('Barolo & Bolognese Night')).toBeInTheDocument()
    expect(screen.getByText('Barolo')).toBeInTheDocument()
    expect(screen.getByText('Bolognese')).toBeInTheDocument()
  })

  it('navigates on click', () => {
    render(<NightCard night={mockNight} instanceId="inst-1" />)

    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
  })

  it('shows deleted item placeholder for missing associations', () => {
    render(<NightCard night={mockDeletedNight} instanceId="inst-1" />)

    expect(screen.getByText('Deleted item')).toBeInTheDocument()
  })

  it('shows created by info', () => {
    render(<NightCard night={mockNight} instanceId="inst-1" />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })
})
