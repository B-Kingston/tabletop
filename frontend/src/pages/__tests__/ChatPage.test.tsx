import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatPage } from '../ChatPage'

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ instanceId: 'inst-1' }),
}))

vi.mock('@/hooks/useChat', () => ({
  useChatSessions: () => ({ data: [], isLoading: false }),
  useChatSession: () => ({ data: undefined, isLoading: false }),
  useCreateChatSession: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteChatSession: () => ({ mutate: vi.fn(), isPending: false }),
  useSendMessage: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('ChatPage AI Assistant copy', () => {
  it('makes the existing chat page clearly AI-specific', () => {
    render(<ChatPage />)

    expect(screen.getByRole('heading', { name: /ai assistant sessions/i })).toBeInTheDocument()
    expect(screen.getByText(/select or create an ai assistant session/i)).toBeInTheDocument()
  })
})
