import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import {
  useChatSessions,
  useChatSession,
  useCreateChatSession,
  useDeleteChatSession,
  useSendMessage,
} from '@/hooks/useChat'
import { Button } from '@/components/ui/Button'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'

export function ChatPage() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions(instanceId)
  const { data: activeSession, isLoading: messagesLoading } = useChatSession(
    instanceId,
    activeSessionId ?? ''
  )
  const createSession = useCreateChatSession(instanceId)
  const deleteSession = useDeleteChatSession(instanceId)
  const sendMessage = useSendMessage(instanceId, activeSessionId ?? '')

  function handleCreateSession() {
    createSession.mutate(undefined, {
      onSuccess: (session) => setActiveSessionId(session.id),
    })
  }

  function handleDeleteSession() {
    if (!sessionToDelete) return
    deleteSession.mutate(sessionToDelete, {
      onSuccess: () => {
        if (activeSessionId === sessionToDelete) setActiveSessionId(null)
        setSessionToDelete(null)
        setDeleteOpen(false)
      },
    })
  }

  function handleSend(content: string) {
    sendMessage.mutate(content)
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex h-[calc(100vh-8rem)] gap-4"
      >
        <div className="w-64 flex-shrink-0 flex flex-col border-r border-neutral-200 pr-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">AI Assistant Sessions</h2>
            <Button variant="ghost" size="sm" onClick={handleCreateSession}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {sessionsLoading && <ListSkeleton count={3} />}

          <div className="flex-1 overflow-y-auto space-y-1">
            {sessions?.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <span className="truncate">{session.title || 'New AI Chat'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSessionToDelete(session.id)
                    setDeleteOpen(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-opacity"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          {activeSessionId ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {messagesLoading && <ListSkeleton count={3} />}
                {activeSession?.messages?.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </div>
              <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-neutral-400">
              <p className="text-sm">Select or create an AI Assistant session</p>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteSession}
          title="Delete AI Chat"
          description="Are you sure you want to delete this AI Assistant session?"
          confirmLabel="Delete"
          variant="destructive"
          loading={deleteSession.isPending}
        />
      </motion.div>
    </ErrorBoundary>
  )
}
