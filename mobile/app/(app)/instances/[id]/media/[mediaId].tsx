import React, { useCallback } from 'react'
import {
  View,
  Text,
  Alert,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useTheme } from '@/theme'
import { useMediaItem, useDeleteMedia } from '@/hooks/useMedia'
import { formatDate } from '@tabletop/shared'

// ── Constants ─────────────────────────────────────────────────────────────

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342'

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  watching: 'Watching',
  completed: 'Completed',
  dropped: 'Dropped',
}

const STATUS_COLORS: Record<string, string> = {
  planning: '#6366F1',
  watching: '#F59E0B',
  completed: '#10B981',
  dropped: '#EF4444',
}

const FALLBACK_ICON: Record<string, string> = {
  movie: '🎬',
  tv: '📺',
}

/**
 * Media detail screen — pushed on top of the tab stack.
 * Shows full media details with actions.
 */
export default function MediaDetailScreen() {
  const { id: instanceId, mediaId } = useLocalSearchParams<{
    id: string
    mediaId: string
  }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: mediaItem,
    isLoading,
    isError,
    error,
    refetch,
  } = useMediaItem(instanceId, mediaId)

  const deleteMedia = useDeleteMedia(instanceId)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/media/edit/${mediaId}`)
  }, [router, instanceId, mediaId])

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Remove Media',
      'Are you sure you want to remove this from your collection? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            deleteMedia.mutate(
              { mediaId },
              {
                onSuccess: () => {
                  router.back()
                },
              },
            )
          },
        },
      ],
    )
  }, [deleteMedia, mediaId, router])

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !mediaItem) {
    return (
      <Screen title="Media">
        <ErrorState
          message={error?.message ?? 'Media not found'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading || !mediaItem) {
    return (
      <Screen title="Media">
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={280} borderRadius={8} style={{ marginBottom: 16 }} />
          <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={14} />
        </View>
      </Screen>
    )
  }

  const statusColor = STATUS_COLORS[mediaItem.status] ?? colors.textSecondary
  const typeLabel = mediaItem.type === 'tv' ? 'TV Series' : 'Movie'
  const posterUri = mediaItem.posterPath
    ? `${TMDB_POSTER_BASE}${mediaItem.posterPath}`
    : null
  const creatorName = mediaItem.createdBy?.name ?? 'Unknown'

  return (
    <Screen title={mediaItem.title}>
      {/* Hero poster */}
      {posterUri ? (
        <Image
          source={{ uri: posterUri }}
          style={[styles.poster, { borderRadius: 8 }]}
          contentFit="cover"
          transition={300}
        />
      ) : (
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
          <Text style={{ fontSize: 64 }}>
            {FALLBACK_ICON[mediaItem.type] ?? '🎬'}
          </Text>
        </View>
      )}

      {/* Overview */}
      {mediaItem.overview ? (
        <Text
          style={[
            typography.body,
            { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
          ]}
        >
          {mediaItem.overview}
        </Text>
      ) : null}

      {/* Metadata row */}
      <View style={[styles.metaRow, { marginBottom: spacing.md, marginTop: mediaItem.overview ? 0 : spacing.lg }]}>
        <View
          style={[
            styles.badge,
            { backgroundColor: statusColor + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
          ]}
        >
          <Text style={[typography.labelBold, { color: statusColor }]}>
            {STATUS_LABELS[mediaItem.status] ?? mediaItem.status}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
          ]}
        >
          <Text style={[typography.label, { color: colors.textSecondary }]}>
            {typeLabel}
          </Text>
        </View>
        {mediaItem.rating != null ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.warning + '20',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
              },
            ]}
          >
            <Text style={[typography.labelBold, { color: colors.warning }]}>
              ★ {mediaItem.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Dates */}
      {mediaItem.releaseDate ? (
        <View style={styles.infoRow}>
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            Release date
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {formatDate(mediaItem.releaseDate)}
          </Text>
        </View>
      ) : null}
      {mediaItem.planToWatchDate ? (
        <View style={styles.infoRow}>
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            Plan to watch
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {formatDate(mediaItem.planToWatchDate)}
          </Text>
        </View>
      ) : null}

      {/* Review */}
      {mediaItem.review ? (
        <View
          style={[
            styles.reviewBlock,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              padding: spacing.lg,
              marginTop: spacing.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text
            style={[
              typography.bodyBold,
              { color: colors.text, marginBottom: spacing.xs },
            ]}
          >
            Review
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {mediaItem.review}
          </Text>
        </View>
      ) : null}

      {/* Creator info */}
      <Text
        style={[
          typography.label,
          { color: colors.textTertiary, marginBottom: spacing.xl },
        ]}
      >
        Added by {creatorName}
      </Text>

      {/* Action buttons */}
      <View style={[styles.actions, { marginBottom: spacing['3xl'] }]}>
        <Button
          title="Edit"
          onPress={handleEdit}
          variant="primary"
          size="lg"
        />
        <Button
          title="Remove"
          onPress={handleDelete}
          variant="danger"
          size="lg"
          loading={deleteMedia.isPending}
        />
      </View>
    </Screen>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  poster: {
    width: '100%',
    height: 280,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewBlock: {},
  actions: {
    gap: 12,
  },
})
