import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from '../ChatInput'

describe('ChatInput', () => {
  it('renders textarea and send button', () => {
    render(<ChatInput onSend={() => {}} />)
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onSend with trimmed value when button clicked', async () => {
    let sentValue = ''
    render(<ChatInput onSend={(v) => { sentValue = v }} />)

    const textarea = screen.getByLabelText('Chat message input')
    await userEvent.type(textarea, '  Hello AI  ')
    await userEvent.click(screen.getByRole('button'))

    expect(sentValue).toBe('Hello AI')
  })

  it('clears input after sending', async () => {
    render(<ChatInput onSend={() => {}} />)
    const textarea = screen.getByLabelText('Chat message input')

    await userEvent.type(textarea, 'Hello')
    await userEvent.click(screen.getByRole('button'))

    expect(textarea).toHaveValue('')
  })

  it('does not send empty message', async () => {
    let sent = false
    render(<ChatInput onSend={() => { sent = true }} />)

    await userEvent.click(screen.getByRole('button'))
    expect(sent).toBe(false)
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={() => {}} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('send button is disabled when disabled prop is true', () => {
    render(<ChatInput onSend={() => {}} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
