import { render, screen } from '@testing-library/react'
import { AuthGate } from '../AuthGate'

// Clerk components are mocked in setup
vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-out">{children}</div>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <div data-testid="sign-in">{children}</div>,
  UserButton: () => <div data-testid="user-button">User</div>,
}))

describe('AuthGate', () => {
  it('renders title and description', () => {
    render(<AuthGate />)
    expect(screen.getByText('Tabletop')).toBeInTheDocument()
    expect(screen.getByText(/Track media, wines, and recipes/)).toBeInTheDocument()
  })
})