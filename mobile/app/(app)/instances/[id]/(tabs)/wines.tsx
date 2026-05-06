import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { Screen } from '@/components/Screen'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { useTheme } from '@/theme'
import { useWines } from '@/hooks/useWines'
import { formatCurrency, formatRating } from '@tabletop/shared'

import type { Wine } from '@tabletop/shared'

/** Wine type options for the filter bar. */
const WINE_TYPES = ['All', 'Red', 'White', 'Rose', 'Sparkling', 'Port'] as const

const TYPE_API_VALUES: Record<string, string | undefined> = {
  All: undefined,
  Red: 'red',
  White: 'white',
  Rose: 'rose',
  Sparkling: 'sparkling',
  Port: 'port',
}

/** Human-readable labels for wine types. */
const TYPE_LABELS: Record<string, string> = {
  red: 'Red',
  white: 'White',
  rose: 'Rosé',
  sparkling: 'Sparkling',
  port: 'Port',
}

/** Emoji badge per wine type. */
const TYPE_EMOJI: Record<string, string> = {
  red: '🍷',
  white: '🥂',
  rose: '🌸',
  sparkling: '🍾',
  port: '🍇',
}

/**
 * Wine list screen — the Wines tab in the instance tab navigator.
 */
export default function WinesScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const [selectedType, setSelectedType] = useState<string>('All')
  const typeFilter = TYPE_API_VALUES[selectedType]

  const {
    data: wines,
    isLoading,
    isError,
    error,
    refetch,
  } = useWines(instanceId, typeFilter)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAddWine = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/wines/create`)
  }, [router, instanceId])

  const handlePressWine = useCallback(
    (wine: Wine) => {
      router.push(`/(app)/instances/${instanceId}/wines/${wine.id}`)
    },
    [router, instanceId],
  )

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !wines) {
    return (
      <Screen title="Wines">
        <ErrorState
          message={error?.message ?? 'Failed to load wines'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Type filter bar ───────────────────────────────────────────────────

  const typeBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.filterBar, { borderBottomColor: colors.border }]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
      }}
    >
      {WINE_TYPES.map((type) => {
        const isActive = selectedType === type
        return (
          <TouchableOpacity
            key={type}
            onPress={() => setSelectedType(type)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${type}`}
            accessibilityState={{ selected: isActive }}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : colors.surfaceSecondary,
                borderRadius: 16,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                typography.label,
                {
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )

  // ── Wine card ─────────────────────────────────────────────────────────

  const renderWineCard = useCallback(
    ({ item }: { item: Wine }) => {
      const typeLabel = TYPE_LABELS[item.type] ?? item.type
      const typeEmoji = TYPE_EMOJI[item.type] ?? '🍷'
      const creatorName = item.createdBy?.name ?? 'Unknown'
      const hasConsumed = !!item.consumedAt

      return (
        <TouchableOpacity
          onPress={() => handlePressWine(item)}
          accessibilityRole="button"
          accessibilityLabel={`Wine: ${item.name}`}
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
          <View style={styles.cardRow}>
            {/* Emoji + Name */}
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[typography.h3, { color: colors.text }]}>
                  {typeEmoji}{' '}
                </Text>
                <Text
                  style={[typography.h3, { color: colors.text, flex: 1 }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>

              {/* Metadata row */}
              <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
                {/* Type badge */}
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  <Text style={[typography.label, { color: colors.textSecondary }]}>
                    {typeLabel}
                  </Text>
                </View>

                {item.cost != null ? (
                  <Text style={[typography.label, { color: colors.textSecondary }]}>
                    {formatCurrency(item.cost)}
                  </Text>
                ) : null}

                {item.rating != null ? (
                  <View
                    style={[
                      styles.ratingBadge,
                      {
                        backgroundColor: colors.warning + '20',
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      },
                    ]}
                  >
                    <Text style={[typography.label, { color: colors.warning }]}>
                      ★ {formatRating(item.rating)}
                    </Text>
                  </View>
                ) : null}

                {hasConsumed ? (
                  <Text style={[typography.label, { color: colors.secondary }]}>
                    ✓ Consumed
                  </Text>
                ) : null}
              </View>

              {/* Creator */}
              <Text
                style={[
                  typography.label,
                  { color: colors.textTertiary, marginTop: spacing.xs },
                ]}
              >
                by {creatorName}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [colors, spacing, typography, handlePressWine],
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
          <Skeleton width="60%" height={22} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
            <Skeleton width={50} height={20} borderRadius={12} />
            <Skeleton width={60} height={20} borderRadius={12} />
          </View>
          <Skeleton width={80} height={12} />
        </View>
      ))}
    </View>
  )

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <Screen
      title="Wines"
      rightAction={
        <Button
          title="+"
          onPress={handleAddWine}
          variant="primary"
          size="sm"
        />
      }
    >
      {typeBar}

      {isLoading ? (
        renderSkeletons()
      ) : wines && wines.length > 0 ? (
        <FlatList
          data={wines}
          keyExtractor={(item) => item.id}
          renderItem={renderWineCard}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingTop: spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState message="No wines found for this type." />
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <EmptyState
            message="No wines yet."
            actionLabel="Add your first wine"
            onAction={handleAddWine}
          />
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  filterBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    maxHeight: 40,
  },
  filterChip: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  typeBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 24,
  },
  ratingBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 24,
  },
})
