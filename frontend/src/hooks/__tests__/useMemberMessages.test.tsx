import { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemberMessages, useSendMemberMessage } from '../useMemberMessages'
import { api } from '@/lib/api'

const mockMessage = {
  id: 'member-msg-1',
  instanceId: 'inst-1',
  userId: 'user-1',
  content: 'Dinner is at 7',
  createdAt: '2024-01-01T00:00:00Z',
  user: { id: 'user-1', clerkId: 'clerk-1', email: 'test@test.com', name: 'Test User', avatarUrl: '', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
}

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: { data: [mockMessage] } })),
    post: vi.fn(() => Promise.resolve({ data: { data: { ...mockMessage, id: 'member-msg-new', content: 'On my way' } } })),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useMemberMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads messages for an instance', async () => {
    const { result } = renderHook(() => useMemberMessages('inst-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/instances/inst-1/messages')
    expect(result.current.data?.[0].content).toBe('Dinner is at 7')
  })
})

describe('useSendMemberMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends a member message to the instance messages endpoint', async () => {
    const { result } = renderHook(() => useSendMemberMessage('inst-1'), {
      wrapper: createWrapper(),
    })

    result.current.mutate('On my way')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.post).toHaveBeenCalledWith('/instances/inst-1/messages', { content: 'On my way' })
    expect(result.current.data?.content).toBe('On my way')
  })
})
