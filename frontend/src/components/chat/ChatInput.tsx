import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border pt-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-2xl bg-surface-secondary border-0 py-2.5 px-3 text-text placeholder:text-muted focus:ring-2 focus:ring-accent/30 sm:text-sm disabled:opacity-50"
        aria-label="Chat message input"
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
