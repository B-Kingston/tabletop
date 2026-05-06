import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemberMessagesPage } from '../MemberMessagesPage'

class FakeWebSocket {
  static latest: FakeWebSocket | null = null
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  url: string

  constructor(url: string) {
    this.url = url
    FakeWebSocket.latest = this
  }

  close() {
    this.onclose?.()
  }
}

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ instanceId: 'inst-1' }),
}))

vi.mock('@/lib/auth', () => ({
  useAuthToken: () => ({ getToken: () => Promise.resolve('dev') }),
}))

function renderWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemberMessagesPage />
    </QueryClientProvider>
  )
}

describe('MemberMessagesPage', () => {
  beforeEach(() => {
    FakeWebSocket.latest = null
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders persisted member messages and sends a new one', async () => {
    renderWithClient()

    expect(await screen.findByText('Dinner is at 7')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Chat message input'), 'On my way')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText('On my way')).toBeInTheDocument()
  })

  it('appends realtime websocket member messages', async () => {
    renderWithClient()

    await screen.findByText('Dinner is at 7')

    FakeWebSocket.latest?.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify({
          type: 'member_message.created',
          data: {
            id: 'member-msg-ws',
            instanceId: 'inst-1',
            userId: 'user-2',
            content: 'I will bring wine',
            createdAt: '2024-01-01T00:01:00Z',
            user: { id: 'user-2', clerkId: 'clerk-2', email: 'sam@test.com', name: 'Sam', avatarUrl: '', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          },
        }),
      })
    )

    await waitFor(() => expect(screen.getByText('I will bring wine')).toBeInTheDocument())
    expect(screen.getByText('Sam')).toBeInTheDocument()
  })
})
