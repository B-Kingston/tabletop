import { render, screen } from '@testing-library/react'
import { AppShell } from '../AppShell'

describe('AppShell', () => {
  it('renders children', () => {
    render(
      <AppShell>
        <div data-testid="child">Test Content</div>
      </AppShell>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})