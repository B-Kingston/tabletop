import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const clerkState = {
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_123',
  getToken: vi.fn(async () => 'token'),
}

const clerkUserState = {
  user: {
    primaryEmailAddress: { emailAddress: 'test@example.com' },
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    imageUrl: 'https://example.com/avatar.png',
  },
}

vi.mock('@/lib/clerk', () => ({
  useAuth: () => clerkState,
  useUser: () => clerkUserState,
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clerkState.isLoaded = true
    clerkState.isSignedIn = true
    clerkState.userId = 'user_123'
    clerkState.getToken = vi.fn(async () => 'token')
    useAuthStore.setState({ hasSynced: false })
  })

  it('does not repeatedly auto-sync the same user after a failed sync', async () => {
    const post = vi.spyOn(api, 'post').mockRejectedValue({
      response: { status: 401, data: { error: 'invalid token audience' } },
    })

    const { rerender } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))

    await act(async () => {
      rerender()
    })

    expect(post).toHaveBeenCalledTimes(1)
  })
})
