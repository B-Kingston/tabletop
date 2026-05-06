import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { IconButton } from '@/components/IconButton'
import { useTheme } from '@/theme'
import { useChatSession, useSendMessage } from '@/hooks/useChat'
import { RateLimitError } from '@/hooks/useAI'

import type { ChatMessage } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

interface OptimisticMessage {
  id: string
  role: 'user'
  content: string
  createdAt: string
}

// ── Screen ────────────────────────────────────────────────────────────────

/**
 * Chat session detail — message thread with composer at bottom.
 */
export default function ChatSessionDetailScreen() {
  const { id: instanceId, sessionId } = useLocalSearchParams<{
    id: string
    sessionId: string
  }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useChatSession(instanceId, sessionId)

  const sendMessage = useSendMessage(instanceId, sessionId)

  const [input, setInput] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)

  const flatListRef = useRef<FlatList>(null)

  // ── Derived data ────────────────────────────────────────────────────

  // Combine persisted messages with optimistic (user-only) placeholders.
  const messages = session?.messages ?? []
  const allMessages = [...messages, ...optimisticMessages]

  const isSending = sendMessage.isPending

  // ── Scroll helpers ──────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    if (allMessages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [allMessages.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, optimisticMessages.length, scrollToBottom])

  // ── Send ────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const content = input.trim()
    if (!content || isSending) return

    setRateLimitError(null)

    // Optimistically append user message
    const optimistic: OptimisticMessage = {
      id: `opt-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setOptimisticMessages((prev) => [...prev, optimistic])
    setInput('')

    sendMessage.mutate(
      { content },
      {
        onSuccess: () => {
          // Remove optimistic message — the query refetch will supply
          // the persisted user message + assistant response.
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.id !== optimistic.id),
          )
        },
        onError: (err) => {
          // Remove optimistic message on error
          setOptimisticMessages((prev) =>
            prev.filter((m) => m.id !== optimistic.id),
          )

          if (err instanceof RateLimitError) {
            setRateLimitError(err.message)
          } else {
            setRateLimitError(
              err instanceof Error ? err.message : 'Failed to send message.',
            )
          }
        },
      },
    )
  }, [input, isSending, sendMessage])

  // ── Error state (initial load) ──────────────────────────────────────

  if (isError && !session) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ErrorState
          message={error?.message ?? 'Failed to load chat'}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    )
  }

  // ── Loading state ───────────────────────────────────────────────────

  if (isLoading || !session) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Skeleton width="60%" height={20} />
        </View>
        <View style={{ padding: spacing.lg }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={{
                alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
                width: '70%',
                marginBottom: 12,
              }}
            >
              <Skeleton height={40} borderRadius={12} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  // ── Message bubble ──────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({
      item,
    }: {
      item: ChatMessage | OptimisticMessage
    }) => {
      const isUser = item.role === 'user'

      return (
        <View
          style={[
            styles.messageRow,
            {
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: isUser ? colors.primary : colors.surfaceSecondary,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderBottomLeftRadius: isUser ? 16 : 4,
                borderBottomRightRadius: isUser ? 4 : 16,
                maxWidth: '80%',
              },
            ]}
          >
            <Text
              style={[
                typography.body,
                {
                  color: isUser ? '#FFFFFF' : colors.text,
                  lineHeight: 22,
                },
              ]}
              selectable
            >
              {item.content}
            </Text>
          </View>
        </View>
      )
    },
    [colors, spacing, typography],
  )

  // ── Typing indicator ────────────────────────────────────────────────

  const typingIndicator = isSending ? (
    <View
      style={[
        styles.messageRow,
        {
          justifyContent: 'flex-start',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          styles.typingBubble,
          {
            backgroundColor: colors.surfaceSecondary,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 16,
          },
        ]}
      >
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          ● ● ●
        </Text>
      </View>
    </View>
  ) : null

  // ── Empty messages ──────────────────────────────────────────────────

  const emptyMessages = allMessages.length === 0 ? (
    <View
      style={[
        styles.emptyMessages,
        { padding: spacing['3xl'] },
      ]}
    >
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            textAlign: 'center',
          },
        ]}
      >
        Send a message to start the conversation.
      </Text>
    </View>
  ) : null

  // ── Main render ─────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* Custom header with back and title */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <IconButton
            onPress={() => router.back()}
            accessibilityLabel="Back to AI sessions"
            variant="ghost"
          >
            <Text
              style={[
                typography.bodyBold,
                { color: colors.primary, fontSize: 16 },
              ]}
            >
              ←
            </Text>
          </IconButton>
        </View>
        <Text
          style={[
            typography.h3,
            { color: colors.text, flex: 1 },
          ]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {session.title}
        </Text>
        {/* Spacer to balance the back button */}
        <View style={styles.headerRight} />
      </View>

      {/* Rate-limit error banner */}
      {rateLimitError ? (
        <View
          style={[
            styles.rateLimitBanner,
            {
              backgroundColor: colors.warning + '20',
              borderBottomColor: colors.warning,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            },
          ]}
          accessibilityRole="alert"
        >
          <Text style={[typography.caption, { color: colors.danger }]}>
            {rateLimitError}
          </Text>
          <TouchableOpacity
            onPress={() => setRateLimitError(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[typography.labelBold, { color: colors.primary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messageList,
            allMessages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={emptyMessages}
          ListFooterComponent={typingIndicator}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* Composer */}
        <View
          style={[
            styles.composer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            editable={!isSending}
            accessibilityLabel="Message input"
            style={[
              typography.body,
              styles.composerInput,
              {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                borderRadius: 20,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={input.trim().length === 0 || isSending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{
              disabled: input.trim().length === 0 || isSending,
            }}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  input.trim().length > 0 && !isSending
                    ? colors.primary
                    : colors.surfaceSecondary,
                borderRadius: 20,
              },
            ]}
          >
            <Text
              style={[
                typography.bodyBold,
                {
                  color:
                    input.trim().length > 0 && !isSending
                      ? '#FFFFFF'
                      : colors.textTertiary,
                },
              ]}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerLeft: {
    width: 52,
  },
  headerRight: {
    width: 52,
  },
  messageList: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingBubble: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  emptyMessages: {
    alignItems: 'center',
  },
  rateLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
})
