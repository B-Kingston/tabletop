import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, CardSkeleton, ListSkeleton, DetailSkeleton, GridSkeleton } from '../LoadingSkeleton'

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-10" />)
    expect(container.firstChild).toHaveClass('h-10')
    expect(container.firstChild).toHaveClass('w-10')
  })
})

describe('CardSkeleton', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})

describe('ListSkeleton', () => {
  it('renders default count of items', () => {
    const { container } = render(<ListSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders custom count of items', () => {
    const { container } = render(<ListSkeleton count={3} />)
    const items = container.querySelectorAll('.flex.items-center.gap-4')
    expect(items.length).toBe(3)
  })
})

describe('DetailSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DetailSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})

describe('GridSkeleton', () => {
  it('renders default count of cards', () => {
    const { container } = render(<GridSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders custom count of cards', () => {
    const { container } = render(<GridSkeleton count={4} />)
    const cards = container.querySelectorAll('.rounded-xl')
    expect(cards.length).toBe(4)
  })
})
