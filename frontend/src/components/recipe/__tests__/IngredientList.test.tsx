import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IngredientList } from '../IngredientList'
import type { Ingredient } from '@/types/models'

const makeIngredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  id: 'ing-1',
  recipeId: 'recipe-1',
  name: 'Flour',
  quantity: '2',
  unit: 'cups',
  cost: null,
  optional: false,
  ...overrides,
})

describe('IngredientList', () => {
  it('renders ingredients', () => {
    const ingredients = [
      makeIngredient({ id: 'ing-1', name: 'Flour', quantity: '2', unit: 'cups' }),
      makeIngredient({ id: 'ing-2', name: 'Sugar', quantity: '1', unit: 'cup' }),
    ]
    render(<IngredientList ingredients={ingredients} />)
    expect(screen.getByText(/Flour/)).toBeInTheDocument()
    expect(screen.getByText(/Sugar/)).toBeInTheDocument()
  })

  it('shows quantity with font-medium', () => {
    render(<IngredientList ingredients={[makeIngredient({ quantity: '500g' })]} />)
    expect(screen.getByText('500g')).toHaveClass('font-medium')
  })

  it('shows optional label', () => {
    render(<IngredientList ingredients={[makeIngredient({ optional: true })]} />)
    expect(screen.getByText('(optional)')).toBeInTheDocument()
  })

  it('does not show optional label when not optional', () => {
    render(<IngredientList ingredients={[makeIngredient({ optional: false })]} />)
    expect(screen.queryByText('(optional)')).not.toBeInTheDocument()
  })

  it('renders empty list', () => {
    const { container } = render(<IngredientList ingredients={[]} />)
    expect(container.querySelector('ul')).toBeInTheDocument()
    expect(container.querySelectorAll('li').length).toBe(0)
  })
})
