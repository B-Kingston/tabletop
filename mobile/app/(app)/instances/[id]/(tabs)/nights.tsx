import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { Screen } from '@/components/Screen'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { useTheme } from '@/theme'
import { useNights } from '@/hooks/useNights'

import type { Night } from '@tabletop/shared'

/**
 * Game nights list screen — the Nights tab in the instance tab navigator.
 */
export default function NightsScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: nights,
    isLoading,
    isError,
    error,
    refetch,
  } = useNights(instanceId)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleCreate = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/nights/create`)
  }, [router, instanceId])

  const handleSpin = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/spin`)
  }, [router, instanceId])

  const handlePressNight = useCallback(
    (night: Night) => {
      router.push(`/(app)/instances/${instanceId}/nights/${night.id}`)
    },
    [router, instanceId],
  )

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !nights) {
    return (
      <Screen title="Nights">
        <ErrorState
          message={error?.message ?? 'Failed to load game nights'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Linked-item summary helper ────────────────────────────────────────

  const getLinkedSummary = (night: Night): string => {
    const parts: string[] = []
    if (night.wine?.name) parts.push(`🍷 ${night.wine.name}`)
    if (night.recipe?.title) parts.push(`🍽️ ${night.recipe.title}`)
    if (night.media?.title) parts.push(`🎬 ${night.media.title}`)
    return parts.length > 0 ? parts.join('  ·  ') : 'No items linked'
  }

  // ── Night card ────────────────────────────────────────────────────────

  const renderNightCard = useCallback(
    ({ item }: { item: Night }) => {
      const creatorName = item.createdBy?.name ?? 'Unknown'
      const linkedSummary = getLinkedSummary(item)

      return (
        <TouchableOpacity
          onPress={() => handlePressNight(item)}
          accessibilityRole="button"
          accessibilityLabel={`Night: ${item.name}`}
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
              {item.name}
            </Text>
          </View>

          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
            numberOfLines={2}
          >
            {linkedSummary}
          </Text>

          <Text
            style={[
              typography.label,
              { color: colors.textTertiary, marginTop: spacing.sm },
            ]}
          >
            by {creatorName}
          </Text>
        </TouchableOpacity>
      )
    },
    [colors, spacing, typography, handlePressNight],
  )

  // ── Skeleton loader ───────────────────────────────────────────────────

  const renderSkeletons = () => (
    <View style={{ padding: spacing.lg }}>
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
          <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
          <Skeleton width="40%" height={12} />
        </View>
      ))}
    </View>
  )

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <Screen
      title="Nights"
      rightAction={
        <View style={styles.headerActions}>
          <Button
            title="🎲"
            onPress={handleSpin}
            variant="ghost"
            size="sm"
            accessibilityLabel="Spin the Night"
          />
          <Button title="+" onPress={handleCreate} variant="primary" size="sm" />
        </View>
      }
    >
      {/* Spin prompt card — always visible above the list */}
      {!isLoading && (
        <TouchableOpacity
          onPress={handleSpin}
          accessibilityRole="button"
          accessibilityLabel="Spin the Night"
          style={[
            styles.spinCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary + '40',
            },
          ]}
        >
          <Text style={styles.spinEmoji}>🎲</Text>
          <View style={styles.spinTextContainer}>
            <Text style={[typography.h3, { color: colors.primary }]}>
              Spin the Night
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Randomly pick wine, recipe & media for your next game night
            </Text>
          </View>
          <Text style={[typography.labelBold, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        renderSkeletons()
      ) : nights && nights.length > 0 ? (
        <FlatList
          data={nights}
          keyExtractor={(item) => item.id}
          renderItem={renderNightCard}
          contentContainerStyle={{
            padding: spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState message="No game nights found." />
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <EmptyState
            message="No game nights yet."
            actionLabel="Schedule your first night"
            onAction={handleCreate}
          />
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  spinEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  spinTextContainer: {
    flex: 1,
  },
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
  },
})
