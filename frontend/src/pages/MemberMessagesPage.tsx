import { useEffect, useMemo, useRef } from 'react'
import { useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { ChatInput } from '@/components/chat/ChatInput'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import { useAuthToken } from '@/lib/auth'
import { useAppendMemberMessage, useMemberMessages, useSendMemberMessage } from '@/hooks/useMemberMessages'
import type { MemberMessage } from '@/types/models'

interface MemberMessageEvent {
  type: 'member_message.created'
  data: MemberMessage
}

function getWebSocketURL(instanceId: string, token: string | null) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  const wsBase = apiBase.replace(/^http/, 'ws')
  const url = new URL(`${wsBase}/v1/instances/${instanceId}/ws`)
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

export function MemberMessagesPage() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const { data: messages, isLoading, error } = useMemberMessages(instanceId)
  const sendMessage = useSendMemberMessage(instanceId)
  const appendMessage = useAppendMemberMessage(instanceId)
  const { getToken } = useAuthToken()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let socket: WebSocket | null = null
    let cancelled = false

    async function connect() {
      const token = await getToken()
      if (cancelled) return

      socket = new WebSocket(getWebSocketURL(instanceId, token))
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as MemberMessageEvent
          if (payload.type === 'member_message.created') {
            appendMessage(payload.data)
          }
        } catch {
          // Ignore malformed realtime events; history remains source of truth.
        }
      }
    }

    if (instanceId) void connect()

    return () => {
      cancelled = true
      socket?.close()
    }
  }, [appendMessage, getToken, instanceId])

  useEffect(() => {
    if (typeof scrollRef.current?.scrollIntoView === 'function') {
      scrollRef.current.scrollIntoView({ block: 'end' })
    }
  }, [messages?.length])

  const orderedMessages = useMemo(() => messages ?? [], [messages])

  function handleSend(content: string) {
    sendMessage.mutate(content)
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex h-[calc(100vh-8rem)] flex-col"
      >
        <div className="mb-4 flex items-center gap-3 border-b border-neutral-200 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Messages</h1>
            <p className="text-sm text-neutral-500">Shared chat for everyone in this instance.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {isLoading && <ListSkeleton count={4} />}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load messages. Please try again.
            </div>
          )}
          {!isLoading && !error && orderedMessages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No messages yet.
            </div>
          )}
          <div className="space-y-4">
            {orderedMessages.map((message) => (
              <article key={message.id} className="max-w-3xl rounded-lg bg-white px-4 py-3 ring-1 ring-neutral-200">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">
                    {message.user?.name || message.user?.email || 'Member'}
                  </span>
                  <time className="text-xs text-neutral-400" dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-sm text-neutral-700">{message.content}</p>
              </article>
            ))}
          </div>
          <div ref={scrollRef} />
        </div>

        <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
      </motion.div>
    </ErrorBoundary>
  )
}
