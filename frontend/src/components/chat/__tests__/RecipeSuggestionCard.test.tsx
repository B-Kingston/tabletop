import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecipeSuggestionCard } from '../RecipeSuggestionCard'

describe('RecipeSuggestionCard', () => {
  it('renders title', () => {
    render(<RecipeSuggestionCard title="Pasta Carbonara" />)
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<RecipeSuggestionCard title="Pasta" description="Classic Italian dish" />)
    expect(screen.getByText('Classic Italian dish')).toBeInTheDocument()
  })

  it('renders prep and cook time', () => {
    render(<RecipeSuggestionCard title="Pasta" prepTime={15} cookTime={30} />)
    expect(screen.getByText('15 min prep')).toBeInTheDocument()
    expect(screen.getByText('30 min cook')).toBeInTheDocument()
  })

  it('renders servings', () => {
    render(<RecipeSuggestionCard title="Pasta" servings={4} />)
    expect(screen.getByText('4 servings')).toBeInTheDocument()
  })

  it('renders ingredients (max 5)', () => {
    render(
      <RecipeSuggestionCard
        title="Pasta"
        ingredients={['Flour', 'Eggs', 'Cheese', 'Bacon', 'Pepper', 'Salt', 'Oil']}
      />
    )
    expect(screen.getByText('Flour')).toBeInTheDocument()
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('does not render time when 0', () => {
    render(<RecipeSuggestionCard title="Pasta" prepTime={0} cookTime={0} />)
    expect(screen.queryByText(/min/)).not.toBeInTheDocument()
  })
})
