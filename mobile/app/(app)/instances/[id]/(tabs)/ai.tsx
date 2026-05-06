import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'

import { Screen } from '@/components/Screen'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { useTheme } from '@/theme'
import { useChatSessions, useCreateChatSession, useDeleteChatSession } from '@/hooks/useChat'

import type { ChatSession } from '@tabletop/shared'

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ── Screen ────────────────────────────────────────────────────────────────

/**
 * AI Assistant tab — list chat sessions, create new ones, navigate to generation.
 */
export default function AIScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
  } = useChatSessions(instanceId)

  const createSession = useCreateChatSession(instanceId)
  const deleteSession = useDeleteChatSession(instanceId)

  // ── Navigation ──────────────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    createSession.mutate(
      { title: 'New Chat' },
      {
        onSuccess: (session) => {
          router.push(`/(app)/instances/${instanceId}/ai/${session.id}`)
        },
      },
    )
  }, [createSession, router, instanceId])

  const handlePressSession = useCallback(
    (session: ChatSession) => {
      router.push(`/(app)/instances/${instanceId}/ai/${session.id}`)
    },
    [router, instanceId],
  )

  const handleGenerateRecipe = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/ai/generate-recipe`)
  }, [router, instanceId])

  const handleDeleteSession = useCallback(
    (session: ChatSession) => {
      Alert.alert(
        'Delete Chat',
        `Delete "${session.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              deleteSession.mutate({ sessionId: session.id })
            },
          },
        ],
      )
    },
    [deleteSession],
  )

  // ── Error state ─────────────────────────────────────────────────────

  if (isError && !sessions) {
    return (
      <Screen title="AI Assistant">
        <ErrorState
          message={error?.message ?? 'Failed to load chat sessions'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Session card ────────────────────────────────────────────────────

  const renderSessionCard = useCallback(
    ({ item }: { item: ChatSession }) => {
      const messageCount = item.messages?.length ?? undefined

      return (
        <TouchableOpacity
          onPress={() => handlePressSession(item)}
          onLongPress={() => handleDeleteSession(item)}
          delayLongPress={500}
          accessibilityRole="button"
          accessibilityLabel={`Chat: ${item.title}${messageCount != null ? `, ${messageCount} messages` : ''}, created ${formatDate(item.createdAt)}`}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 12,
              padding: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[typography.h3, { color: colors.text, flex: 1 }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            {messageCount != null ? (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  },
                ]}
              >
                <Text style={[typography.labelBold, { color: '#FFFFFF' }]}>
                  {messageCount}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              typography.label,
              { color: colors.textTertiary, marginTop: spacing.xs },
            ]}
          >
            Created {formatDate(item.createdAt)}
          </Text>
        </TouchableOpacity>
      )
    },
    [colors, spacing, typography, handlePressSession, handleDeleteSession],
  )

  return (
    <Screen
      title="AI Assistant"
      rightAction={
        <Button
          title="New Chat"
          onPress={handleNewChat}
          variant="primary"
          size="sm"
          loading={createSession.isPending}
          disabled={createSession.isPending}
        />
      }
    >
      {/* Generate Recipe CTA */}
      <TouchableOpacity
        onPress={handleGenerateRecipe}
        accessibilityRole="button"
        accessibilityLabel="Generate Recipe"
        style={[
          styles.generateBanner,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 12,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[typography.bodyBold, { color: colors.primary, textAlign: 'center' }]}>
          ✨ Generate Recipe
        </Text>
      </TouchableOpacity>

      {isLoading ? (
        <View>
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={14} />
            </View>
          ))}
        </View>
      ) : sessions && sessions.length > 0 ? (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionCard}
          contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <EmptyState
          message="No chat sessions yet."
          actionLabel="Start a new chat"
          onAction={handleNewChat}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBanner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
})
