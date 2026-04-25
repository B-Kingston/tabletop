import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepList } from '../StepList'
import type { RecipeStep } from '@/types/models'

const makeStep = (overrides: Partial<RecipeStep> = {}): RecipeStep => ({
  id: 'step-1',
  recipeId: 'recipe-1',
  orderIndex: 1,
  title: '',
  content: 'Mix ingredients',
  durationMin: null,
  ...overrides,
})

describe('StepList', () => {
  it('renders steps sorted by orderIndex', () => {
    const steps = [
      makeStep({ id: 'step-2', orderIndex: 2, content: 'Second step' }),
      makeStep({ id: 'step-1', orderIndex: 1, content: 'First step' }),
    ]
    render(<StepList steps={steps} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('First step')
    expect(items[1]).toHaveTextContent('Second step')
  })

  it('renders step title when present', () => {
    render(<StepList steps={[makeStep({ title: 'Preparation' })]} />)
    expect(screen.getByText('Preparation')).toBeInTheDocument()
  })

  it('renders duration when present', () => {
    render(<StepList steps={[makeStep({ durationMin: 15 })]} />)
    expect(screen.getByText('15 min')).toBeInTheDocument()
  })

  it('does not render duration when null', () => {
    render(<StepList steps={[makeStep({ durationMin: null })]} />)
    expect(screen.queryByText(/min/)).not.toBeInTheDocument()
  })

  it('renders numbered steps', () => {
    const steps = [
      makeStep({ id: 's1', orderIndex: 1, content: 'A' }),
      makeStep({ id: 's2', orderIndex: 2, content: 'B' }),
      makeStep({ id: 's3', orderIndex: 3, content: 'C' }),
    ]
    render(<StepList steps={steps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
