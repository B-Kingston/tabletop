import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useUser } from '@clerk/clerk-expo'

import { Screen } from '@/components/Screen'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { useTheme } from '@/theme'
import { useMemberMessages, useSendMemberMessage } from '@/hooks/useMemberMessages'
import { formatDate } from '@tabletop/shared'

import type { MemberMessage } from '@tabletop/shared'

/**
 * Member chat screen — group chat for an instance.
 * Polls every 5 seconds. Messages ordered oldest → top, newest → bottom.
 */
export default function ChatScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const { user: clerkUser } = useUser()
  const flatListRef = useRef<FlatList<MemberMessage>>(null)

  const [composerValue, setComposerValue] = useState('')

  // Build a temp user payload for optimistic messages
  const tempUser = clerkUser
    ? {
        id: '',
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
        name: clerkUser.fullName ?? 'You',
        avatarUrl: clerkUser.imageUrl ?? '',
        createdAt: '',
        updatedAt: '',
      }
    : undefined

  const {
    data: messages,
    isLoading,
    isError,
    error,
    refetch,
  } = useMemberMessages(instanceId)

  const sendMutation = useSendMemberMessage(instanceId, tempUser)

  // ── Auto-scroll to bottom on new messages ─────────────────────────────

  const messagesCount = messages?.length ?? 0
  const prevCountRef = useRef(messagesCount)

  useEffect(() => {
    if (messagesCount > prevCountRef.current && messages && messages.length > 0) {
      // Small delay to let the FlatList render the new item
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
      prevCountRef.current = messagesCount
      return () => {
        clearTimeout(timer)
      }
    }
    prevCountRef.current = messagesCount
    return undefined
  }, [messagesCount, messages])

  // ── Send handler ──────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const trimmed = composerValue.trim()
    if (!trimmed || sendMutation.isPending) return

    setComposerValue('')
    sendMutation.mutate(trimmed, {
      onSettled: () => {
        // Scroll to bottom after optimistic append
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 50)
      },
    })
  }, [composerValue, sendMutation])

  // ── Render helpers ────────────────────────────────────────────────────

  const isCurrentUser = useCallback(
    (msg: MemberMessage) => {
      // Optimistic messages have no clerkId set or match ours
      if (!msg.user?.clerkId || msg.user.clerkId === clerkUser?.id) return true
      return false
    },
    [clerkUser?.id],
  )

  const getInitials = (name: string): string => {
    return name
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2)
  }

  // ── Message bubble ────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item }: { item: MemberMessage }) => {
      const isMine = isCurrentUser(item)
      const senderName = item.user?.name ?? 'Unknown'
      const initials = getInitials(senderName)

      return (
        <View
          style={[
            styles.messageRow,
            {
              justifyContent: isMine ? 'flex-end' : 'flex-start',
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.sm,
            },
          ]}
        >
          {/* Avatar for other people's messages */}
          {!isMine && (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.primaryLight,
                  marginRight: spacing.sm,
                },
              ]}
              accessibilityLabel={`Avatar for ${senderName}`}
            >
              <Text
                style={[
                  typography.labelBold,
                  { color: colors.primaryDark, fontSize: 12 },
                ]}
              >
                {initials}
              </Text>
            </View>
          )}

          {/* Bubble */}
          <View style={{ maxWidth: '75%' }}>
            {!isMine && (
              <Text
                style={[
                  typography.labelBold,
                  {
                    color: colors.textSecondary,
                    marginBottom: 2,
                    marginLeft: 4,
                  },
                ]}
              >
                {senderName}
              </Text>
            )}

            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: isMine ? colors.primary : colors.surfaceSecondary,
                  borderTopLeftRadius: isMine ? 16 : 4,
                  borderTopRightRadius: isMine ? 4 : 16,
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.body,
                  { color: isMine ? '#FFFFFF' : colors.text },
                ]}
              >
                {item.content}
              </Text>
            </View>

            <Text
              style={[
                typography.label,
                {
                  color: colors.textTertiary,
                  marginTop: 2,
                  textAlign: isMine ? 'right' : 'left',
                  paddingHorizontal: 4,
                },
              ]}
            >
              {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Avatar for own messages (placeholder space) */}
          {isMine && (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.primary,
                  marginLeft: spacing.sm,
                },
              ]}
              accessibilityLabel={`Avatar for ${senderName}`}
            >
              <Text
                style={[
                  typography.labelBold,
                  { color: '#FFFFFF', fontSize: 12 },
                ]}
              >
                {initials}
              </Text>
            </View>
          )}
        </View>
      )
    },
    [colors, spacing, typography, isCurrentUser],
  )

  // ── Skeleton loader ───────────────────────────────────────────────────

  const renderSkeletons = () => (
    <View style={{ padding: spacing.lg }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.messageRow,
            {
              justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          {i % 2 === 0 && <Skeleton width={32} height={32} borderRadius={16} />}
          <View style={{ marginLeft: i % 2 === 0 ? 8 : 0, marginRight: i % 2 !== 0 ? 8 : 0 }}>
            <Skeleton
              width={120 + ((i * 37) % 100)}
              height={14}
              style={{ marginBottom: 4 }}
            />
            <Skeleton
              width={160 + ((i * 53) % 120)}
              height={36}
              borderRadius={16}
            />
          </View>
          {i % 2 !== 0 && <Skeleton width={32} height={32} borderRadius={16} />}
        </View>
      ))}
    </View>
  )

  // ── Empty state ───────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        message="No messages yet. Be the first to say hello!"
      />
    </View>
  )

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !messages) {
    return (
      <Screen title="Chat">
        <ErrorState
          message={error?.message ?? 'Failed to load messages'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <Screen title="Chat" scrollable={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Message list */}
        {isLoading ? (
          renderSkeletons()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.listContent,
              messages && messages.length === 0 && styles.listContentEmpty,
            ]}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => refetch()}
                tintColor={colors.primary}
              />
            }
            onContentSizeChange={() => {
              // Scroll to end when content size changes (new messages rendered)
              if (messages && messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            }}
          />
        )}

        {/* Composer */}
        <View
          style={[
            styles.composer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <TextInput
            value={composerValue}
            onChangeText={setComposerValue}
            placeholder="Type a message…"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            accessibilityLabel="Message composer"
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
                marginRight: spacing.sm,
              },
            ]}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            returnKeyType="default"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={composerValue.trim().length === 0 || sendMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{
              disabled: composerValue.trim().length === 0 || sendMutation.isPending,
            }}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  composerValue.trim().length === 0
                    ? colors.surfaceSecondary
                    : colors.primary,
                borderRadius: 20,
                width: 40,
                height: 40,
              },
            ]}
          >
            <Text
              style={{
                color:
                  composerValue.trim().length === 0
                    ? colors.textTertiary
                    : '#FFFFFF',
                fontSize: 18,
                fontWeight: '600',
              }}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 8,
    flexGrow: 1,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    // borderRadius set dynamically per message
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
