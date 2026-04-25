import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/types/models'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-900 ring-1 ring-neutral-200'
        )}
      >
        {isAssistant && (
          <span className="mb-1 block text-xs font-medium text-neutral-500">AI Assistant</span>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  )
}
