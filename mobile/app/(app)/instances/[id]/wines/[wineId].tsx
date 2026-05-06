import React, { useCallback } from 'react'
import { View, Text, Alert, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useTheme } from '@/theme'
import { useWine, useDeleteWine } from '@/hooks/useWines'
import { formatCurrency, formatRating, formatDate } from '@tabletop/shared'

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
 * Wine detail screen — pushed on top of the tab stack.
 */
export default function WineDetailScreen() {
  const { id: instanceId, wineId } = useLocalSearchParams<{
    id: string
    wineId: string
  }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: wine,
    isLoading,
    isError,
    error,
    refetch,
  } = useWine(instanceId, wineId)

  const deleteWine = useDeleteWine(instanceId)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/wines/edit/${wineId}`)
  }, [router, instanceId, wineId])

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Wine',
      'Are you sure you want to delete this wine? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            deleteWine.mutate(
              { wineId },
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
  }, [deleteWine, wineId, router])

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !wine) {
    return (
      <Screen title="Wine">
        <ErrorState
          message={error?.message ?? 'Wine not found'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading || !wine) {
    return (
      <Screen title="Wine">
        <View style={{ padding: spacing.lg }}>
          <Skeleton width="60%" height={28} style={{ marginBottom: 16 }} />
          <Skeleton width={80} height={24} borderRadius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="40%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="30%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={14} />
        </View>
      </Screen>
    )
  }

  const typeLabel = TYPE_LABELS[wine.type] ?? wine.type
  const typeEmoji = TYPE_EMOJI[wine.type] ?? '🍷'
  const creatorName = wine.createdBy?.name ?? 'Unknown'

  return (
    <Screen title={wine.name}>
      {/* Hero area: emoji + name */}
      <View style={styles.heroRow}>
        <Text style={{ fontSize: 48 }}>{typeEmoji}</Text>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={[typography.h2, { color: colors.text }]}
            numberOfLines={2}
          >
            {wine.name}
          </Text>
        </View>
      </View>

      {/* Type badge */}
      <View
        style={[
          styles.typeBadge,
          {
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 16,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            alignSelf: 'flex-start',
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text style={[typography.labelBold, { color: colors.textSecondary }]}>
          {typeLabel}
        </Text>
      </View>

      {/* Metadata stats */}
      <View style={[styles.statsRow, { marginBottom: spacing.md }]}>
        {wine.cost != null ? (
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              Cost
            </Text>
            <Text style={[typography.h3, { color: colors.text }]}>
              {formatCurrency(wine.cost)}
            </Text>
          </View>
        ) : null}

        {wine.rating != null ? (
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.warning + '15',
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              Rating
            </Text>
            <Text style={[typography.h3, { color: colors.warning }]}>
              ★ {formatRating(wine.rating)}
            </Text>
          </View>
        ) : null}

        {wine.consumedAt ? (
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.secondary + '15',
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              Consumed
            </Text>
            <Text style={[typography.h3, { color: colors.secondary }]}>
              ✓ {formatDate(wine.consumedAt)}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              Status
            </Text>
            <Text style={[typography.h3, { color: colors.textSecondary }]}>
              Not yet consumed
            </Text>
          </View>
        )}
      </View>

      {/* Notes */}
      {wine.notes ? (
        <View
          style={[
            styles.notesBlock,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              padding: spacing.lg,
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
            Notes
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {wine.notes}
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
          title="Delete"
          onPress={handleDelete}
          variant="danger"
          size="lg"
          loading={deleteWine.isPending}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: 100,
  },
  notesBlock: {},
  actions: {
    gap: 12,
  },
})
