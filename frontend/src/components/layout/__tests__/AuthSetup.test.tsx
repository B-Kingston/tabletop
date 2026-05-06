import { render, screen } from '@testing-library/react'
import { AuthSetup } from '../AuthSetup'

const useAuthMock = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('AuthSetup', () => {
  it('waits for Clerk auth to load before rendering route content', () => {
    useAuthMock.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      getToken: vi.fn(),
    })

    render(
      <AuthSetup>
        <div>route content</div>
      </AuthSetup>,
    )

    expect(screen.queryByText('route content')).not.toBeInTheDocument()
  })

  it('renders route content after auth has loaded', () => {
    useAuthMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      getToken: vi.fn(),
    })

    render(
      <AuthSetup>
        <div>route content</div>
      </AuthSetup>,
    )

    expect(screen.getByText('route content')).toBeInTheDocument()
  })
})
