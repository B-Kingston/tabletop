import React, { useCallback } from 'react'
import {
  View,
  Text,
  Alert,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useTheme } from '@/theme'
import { useNight, useDeleteNight } from '@/hooks/useNights'

/**
 * Game night detail screen — pushed on top of the tab stack.
 * Shows night info with linked wine/recipe/media cards.
 */
export default function NightDetailScreen() {
  const { id: instanceId, nightId } = useLocalSearchParams<{
    id: string
    nightId: string
  }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: night,
    isLoading,
    isError,
    error,
    refetch,
  } = useNight(instanceId, nightId)

  const deleteNight = useDeleteNight(instanceId)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/nights/edit/${nightId}`)
  }, [router, instanceId, nightId])

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Night',
      'Are you sure you want to delete this game night? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            deleteNight.mutate(nightId, {
              onSuccess: () => {
                router.back()
              },
            })
          },
        },
      ],
    )
  }, [deleteNight, nightId, router])

  const handleNavigateToWine = useCallback(() => {
    if (night?.wineId) {
      router.push(`/(app)/instances/${instanceId}/wines/${night.wineId}`)
    }
  }, [router, instanceId, night?.wineId])

  const handleNavigateToRecipe = useCallback(() => {
    if (night?.recipeId) {
      router.push(`/(app)/instances/${instanceId}/recipes/${night.recipeId}`)
    }
  }, [router, instanceId, night?.recipeId])

  const handleNavigateToMedia = useCallback(() => {
    if (night?.mediaId) {
      router.push(`/(app)/instances/${instanceId}/media/${night.mediaId}`)
    }
  }, [router, instanceId, night?.mediaId])

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !night) {
    return (
      <Screen title="Night">
        <ErrorState
          message={error?.message ?? 'Night not found'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading || !night) {
    return (
      <Screen title="Night">
        <View style={{ padding: spacing.lg }}>
          <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={80} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={80} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={80} />
        </View>
      </Screen>
    )
  }

  const creatorName = night.createdBy?.name ?? 'Unknown'
  const mediaReleaseYear =
    night.media && 'releaseYear' in night.media
      ? (night.media.releaseYear as string | undefined)
      : undefined

  return (
    <Screen title={night.name}>
      {/* Creator info */}
      <Text
        style={[
          typography.label,
          { color: colors.textTertiary, marginBottom: spacing.xl },
        ]}
      >
        Created by {creatorName}
      </Text>

      {/* Linked items section */}
      <View style={[styles.linkedSection, { marginBottom: spacing.xl }]}>
        <Text
          style={[
            typography.h3,
            { color: colors.text, marginBottom: spacing.md },
          ]}
        >
          Linked Items
        </Text>

        {/* Wine card */}
        {night.wine ? (
          <Card
            onPress={handleNavigateToWine}
            style={{ marginBottom: spacing.md }}
          >
            <View style={styles.linkedRow}>
              <Text style={{ fontSize: 24 }}>🍷</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.bodyBold, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {night.wine.name}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {night.wine.type}
                  {night.wine.rating != null
                    ? `  ·  ★ ${night.wine.rating.toFixed(1)}`
                    : ''}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Recipe card */}
        {night.recipe ? (
          <Card
            onPress={handleNavigateToRecipe}
            style={{ marginBottom: spacing.md }}
          >
            <View style={styles.linkedRow}>
              <Text style={{ fontSize: 24 }}>🍽️</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.bodyBold, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {night.recipe.title}
                </Text>
                {night.recipe.description ? (
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                    numberOfLines={2}
                  >
                    {night.recipe.description}
                  </Text>
                ) : null}
              </View>
            </View>
          </Card>
        ) : null}

        {/* Media card */}
        {night.media ? (
          <Card
            onPress={handleNavigateToMedia}
            style={{ marginBottom: spacing.md }}
          >
            <View style={styles.linkedRow}>
              <Text style={{ fontSize: 24 }}>🎬</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.bodyBold, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {night.media.title}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {night.media.type}
                  {mediaReleaseYear
                    ? `  ·  ${mediaReleaseYear}`
                    : ''}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* No items linked */}
        {!night.wine && !night.recipe && !night.media ? (
          <Text
            style={[
              typography.body,
              { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
            ]}
          >
            No items linked yet.
          </Text>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={[styles.actions, { marginBottom: spacing['3xl'] }]}>
        <Button
          title="Edit"
          onPress={handleEdit}
          variant="secondary"
          size="lg"
        />
        <Button
          title="Delete"
          onPress={handleDelete}
          variant="danger"
          size="lg"
          loading={deleteNight.isPending}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  linkedSection: {},
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actions: {
    gap: 12,
  },
})
