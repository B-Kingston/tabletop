import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatMessage } from '../ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/types/models'

const makeMessage = (overrides: Partial<ChatMessageType> = {}): ChatMessageType => ({
  id: 'msg-1',
  sessionId: 'session-1',
  role: 'user',
  content: 'Hello AI',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('ChatMessage', () => {
  it('renders user message with correct styling', () => {
    render(<ChatMessage message={makeMessage({ role: 'user', content: 'Hello' })} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders assistant message with AI label', () => {
    render(<ChatMessage message={makeMessage({ role: 'assistant', content: 'Hi there' })} />)
    expect(screen.getByText('Hi there')).toBeInTheDocument()
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
  })

  it('does not show AI label for user messages', () => {
    render(<ChatMessage message={makeMessage({ role: 'user' })} />)
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument()
  })

  it('renders system message', () => {
    render(<ChatMessage message={makeMessage({ role: 'system', content: 'Instructions' })} />)
    expect(screen.getByText('Instructions')).toBeInTheDocument()
  })
})
