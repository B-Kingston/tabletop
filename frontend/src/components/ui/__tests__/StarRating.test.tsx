import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StarRating } from '../StarRating'

describe('StarRating', () => {
  it('renders correct number of stars', () => {
    render(<StarRating value={0} readonly />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('renders custom max stars', () => {
    render(<StarRating value={0} max={10} readonly />)
    expect(screen.getAllByRole('button')).toHaveLength(10)
  })

  it('displays rating value text', () => {
    render(<StarRating value={4.5} readonly />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('does not display value text for 0 rating', () => {
    render(<StarRating value={0} readonly />)
    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<StarRating value={3} max={5} readonly />)
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Rating: 3 out of 5 stars')
  })

  it('buttons are disabled in readonly mode', () => {
    render(<StarRating value={3} readonly />)
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })
})
