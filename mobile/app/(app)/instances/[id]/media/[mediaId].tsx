import React, { useCallback } from 'react'
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
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
import { useOMDBDetail } from '@/hooks/useOMDB'
import { formatDate } from '@tabletop/shared'

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

/**
 * Media detail screen — pushed on top of the tab stack.
 * Shows full media details with rich OMDb data.
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

  const { data: omdb } = useOMDBDetail(
    instanceId,
    mediaItem?.omdbId,
  )

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
  const creatorName = mediaItem.createdBy?.name ?? 'Unknown'
  const hasPoster = omdb?.poster && omdb.poster !== 'N/A'
  const genres = omdb?.genre
    ? omdb.genre.split(',').map((g) => g.trim()).filter(Boolean)
    : []

  return (
    <Screen title={mediaItem.title} scrollable>
      {/* Hero poster */}
      {hasPoster ? (
        <Image
          source={{ uri: omdb!.poster }}
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
          <Text style={{ fontSize: 64 }}>🎬</Text>
        </View>
      )}

      {/* Title + meta */}
      <View style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.text }]}>
          {mediaItem.title}
        </Text>
        <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: statusColor + '20',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
              },
            ]}
          >
            <Text style={[typography.labelBold, { color: statusColor }]}>
              {STATUS_LABELS[mediaItem.status] ?? mediaItem.status}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              {typeLabel}
            </Text>
          </View>
          {omdb?.rated && omdb.rated !== 'N/A' && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                },
              ]}
            >
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                {omdb.rated}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Ratings */}
      {omdb && omdb.ratings && omdb.ratings.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {omdb.ratings.map((r, i) => {
            if (!r.value || r.value === 'N/A') return null
            let bgColor: string = colors.surfaceSecondary
            let textColor: string = colors.textSecondary
            if (r.source.includes('Internet Movie Database')) {
              bgColor = colors.warning + '20'
              textColor = colors.warning
            } else if (r.source.includes('Rotten Tomatoes')) {
              bgColor = colors.danger + '20'
              textColor = colors.danger
            } else if (r.source.includes('Metacritic')) {
              bgColor = colors.primary + '20'
              textColor = colors.primary
            }
            return (
              <View
                key={i}
                style={[
                  styles.ratingBadge,
                  {
                    backgroundColor: bgColor,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  },
                ]}
              >
                <Text style={[typography.labelBold, { color: textColor }]}>
                  {r.source.includes('Internet Movie Database')
                    ? 'IMDb'
                    : r.source.includes('Rotten Tomatoes')
                      ? 'RT'
                      : r.source.includes('Metacritic')
                        ? 'MC'
                        : r.source}{' '}
                  {r.value}
                </Text>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Genres */}
      {genres.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {genres.map((g) => (
            <View
              key={g}
              style={[
                styles.badge,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 16,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                {g}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Plot */}
      {(omdb?.plot || mediaItem.overview) && (
        <Text
          style={[
            typography.body,
            { color: colors.text, marginTop: spacing.lg },
          ]}
        >
          {omdb?.plot && omdb.plot !== 'N/A' ? omdb.plot : mediaItem.overview}
        </Text>
      )}

      {/* Info grid */}
      <View
        style={[
          styles.infoGrid,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 8,
            padding: spacing.lg,
            marginTop: spacing.lg,
          },
        ]}
      >
        {omdb?.director && omdb.director !== 'N/A' && (
          <InfoRow label="Director" value={omdb.director} />
        )}
        {omdb?.writer && omdb.writer !== 'N/A' && (
          <InfoRow label="Writers" value={omdb.writer} />
        )}
        {omdb?.actors && omdb.actors !== 'N/A' && (
          <InfoRow label="Starring" value={omdb.actors} />
        )}
        {omdb?.runtime && omdb.runtime !== 'N/A' && (
          <InfoRow label="Runtime" value={omdb.runtime} />
        )}
        {omdb?.released && omdb.released !== 'N/A' && (
          <InfoRow label="Released" value={omdb.released} />
        )}
        {omdb?.country && omdb.country !== 'N/A' && (
          <InfoRow label="Country" value={omdb.country} />
        )}
        {omdb?.language && omdb.language !== 'N/A' && (
          <InfoRow label="Language" value={omdb.language} />
        )}
        {omdb?.awards && omdb.awards !== 'N/A' && (
          <InfoRow label="Awards" value={omdb.awards} />
        )}
        {mediaItem.type === 'movie' &&
          omdb?.boxOffice &&
          omdb.boxOffice !== 'N/A' && (
            <InfoRow label="Box Office" value={omdb.boxOffice} />
          )}
        {mediaItem.type === 'tv' &&
          omdb?.totalSeasons &&
          omdb.totalSeasons !== 'N/A' && (
            <InfoRow label="Seasons" value={omdb.totalSeasons} />
          )}
      </View>

      {/* Dates */}
      {mediaItem.releaseYear && (
        <View style={styles.infoRow}>
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            Release year
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {mediaItem.releaseYear}
          </Text>
        </View>
      )}
      {mediaItem.planToWatchDate && (
        <View style={styles.infoRow}>
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            Plan to watch
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {formatDate(mediaItem.planToWatchDate)}
          </Text>
        </View>
      )}

      {/* User rating */}
      {mediaItem.rating != null && (
        <View style={[styles.userRatingRow, { marginTop: spacing.md }]}>
          <Text style={[typography.labelBold, { color: colors.text }]}>
            Your Rating
          </Text>
          <Text style={[typography.h3, { color: colors.warning }]}>
            ★ {mediaItem.rating.toFixed(1)}
          </Text>
        </View>
      )}

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
        <Button title="Edit" onPress={handleEdit} variant="primary" size="lg" />
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

// ── Helpers ───────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors, spacing, typography } = useTheme()
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[typography.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text
        style={[
          typography.body,
          { color: colors.text, marginTop: 2 },
        ]}
      >
        {value}
      </Text>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  poster: {
    width: '100%',
    height: 420,
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
  ratingBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28,
  },
  infoGrid: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userRatingRow: {
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
