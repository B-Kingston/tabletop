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
import { Image } from 'expo-image'

import { Screen } from '@/components/Screen'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { useTheme } from '@/theme'
import { useMedia } from '@/hooks/useMedia'
import { useOMDBDetail } from '@/hooks/useOMDB'
import { formatDate } from '@tabletop/shared'

import type { MobileMediaItem } from '@/hooks/useMedia'

const STATUS_FILTERS = ['All', 'Planning', 'Watching', 'Completed', 'Dropped'] as const

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Movies', value: 'movie' },
  { label: 'TV', value: 'tv' },
] as const

const STATUS_COLORS: Record<string, string> = {
  planning: '#6366F1',
  watching: '#F59E0B',
  completed: '#10B981',
  dropped: '#EF4444',
}

// ── Poster helper component ─────────────────────────────────────────────

function MediaPoster({ omdbId, instanceId }: { omdbId: string; instanceId: string }) {
  const { data: omdb } = useOMDBDetail(instanceId, omdbId)
  const { colors } = useTheme()
  const hasPoster = omdb?.poster && omdb.poster !== 'N/A'

  if (hasPoster) {
    return (
      <Image
        source={{ uri: omdb!.poster }}
        style={[styles.poster, { borderRadius: 8 }]}
        contentFit="cover"
        transition={200}
      />
    )
  }

  return (
    <View
      style={[
        styles.poster,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text style={{ fontSize: 28 }}>🎬</Text>
    </View>
  )
}

/**
 * Media list screen — the Media tab in the instance tab navigator.
 */
export default function MediaScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>({
    label: 'All',
    value: undefined,
  })

  const statusParam = statusFilter === 'All' ? undefined : statusFilter.toLowerCase()
  const typeParam = typeFilter.value

  const {
    data: media,
    isLoading,
    isError,
    error,
    refetch,
  } = useMedia(instanceId, statusParam, typeParam)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAddMedia = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/media/create`)
  }, [router, instanceId])

  const handlePressMedia = useCallback(
    (item: MobileMediaItem) => {
      router.push(`/(app)/instances/${instanceId}/media/${item.id}`)
    },
    [router, instanceId],
  )

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !media) {
    return (
      <Screen title="Media">
        <ErrorState
          message={error?.message ?? 'Failed to load media'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Filter bars ───────────────────────────────────────────────────────

  const statusFilterBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.filterBar, { borderBottomColor: colors.border }]}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
    >
      {STATUS_FILTERS.map((label) => {
        const isActive = statusFilter === label
        return (
          <TouchableOpacity
            key={label}
            onPress={() => setStatusFilter(label)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${label}`}
            accessibilityState={{ selected: isActive }}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
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
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )

  const typeFilterBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.filterBar, { borderBottomColor: colors.border }]}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
    >
      {TYPE_FILTERS.map((option) => {
        const isActive = typeFilter.label === option.label
        return (
          <TouchableOpacity
            key={option.label}
            onPress={() => setTypeFilter(option)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${option.label}`}
            accessibilityState={{ selected: isActive }}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
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
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )

  // ── Media card ────────────────────────────────────────────────────────

  const renderMediaCard = useCallback(
    ({ item }: { item: MobileMediaItem }) => {
      const label = item.type === 'tv' ? 'TV' : 'Movie'
      const statusColor = STATUS_COLORS[item.status] ?? colors.textSecondary

      return (
        <TouchableOpacity
          onPress={() => handlePressMedia(item)}
          accessibilityRole="button"
          accessibilityLabel={`Media: ${item.title}`}
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
          {/* Row: poster + info */}
          <View style={styles.cardRow}>
            {/* Poster */}
            <MediaPoster omdbId={item.omdbId} instanceId={instanceId} />

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text
                style={[typography.h3, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>

              {/* Badge row */}
              <View style={[styles.badgeRow, { marginTop: spacing.xs }]}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: statusColor + '20',
                      borderRadius: 12,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  <Text
                    style={[typography.labelBold, { color: statusColor }]}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: 12,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  <Text style={[typography.label, { color: colors.textSecondary }]}>
                    {label}
                  </Text>
                </View>
              </View>

              {/* Metadata */}
              {item.rating != null ? (
                <Text
                  style={[
                    typography.label,
                    { color: colors.warning, marginTop: spacing.xs },
                  ]}
                >
                  ★ {item.rating.toFixed(1)}
                </Text>
              ) : null}
              {item.planToWatchDate ? (
                <Text
                  style={[
                    typography.label,
                    { color: colors.textTertiary, marginTop: spacing.xs },
                  ]}
                >
                  Planned: {formatDate(item.planToWatchDate)}
                </Text>
              ) : null}
              {item.releaseYear ? (
                <Text
                  style={[
                    typography.label,
                    { color: colors.textTertiary, marginTop: spacing.xs },
                  ]}
                >
                  Released: {item.releaseYear}
                </Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [colors, spacing, typography, handlePressMedia, instanceId],
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
          <View style={styles.cardRow}>
            <Skeleton width={80} height={120} borderRadius={8} />
            <View style={[styles.cardInfo, { gap: 8 }]}>
              <Skeleton width="70%" height={20} />
              <Skeleton width="40%" height={14} />
              <Skeleton width="50%" height={12} />
              <Skeleton width="60%" height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  )

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <Screen
      title="Media"
      rightAction={
        <Button title="+" onPress={handleAddMedia} variant="primary" size="sm" />
      }
    >
      {statusFilterBar}
      {typeFilterBar}

      {isLoading ? (
        renderSkeletons()
      ) : media && media.length > 0 ? (
        <FlatList
          data={media}
          keyExtractor={(item) => item.id}
          renderItem={renderMediaCard}
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
            <EmptyState message="No media found for these filters." />
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <EmptyState
            message="No media tracked yet."
            actionLabel="Add your first title"
            onAction={handleAddMedia}
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
    gap: 12,
  },
  poster: {
    width: 80,
    height: 120,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 22,
  },
})
