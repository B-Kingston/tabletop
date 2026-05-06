import React, { useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
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
import { useRecipe, useDeleteRecipe } from '@/hooks/useRecipes'
import { formatDuration } from '@tabletop/shared'

/**
 * Recipe detail screen — pushed on top of the tab stack.
 * Shows full recipe details with ingredients, steps, and actions.
 */
export default function RecipeDetailScreen() {
  const { id: instanceId, recipeId } = useLocalSearchParams<{
    id: string
    recipeId: string
  }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: recipe,
    isLoading,
    isError,
    error,
    refetch,
  } = useRecipe(instanceId, recipeId)

  const deleteRecipe = useDeleteRecipe(instanceId)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleStartCooking = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/recipes/cook/${recipeId}`)
  }, [router, instanceId, recipeId])

  const handleEdit = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/recipes/edit/${recipeId}`)
  }, [router, instanceId, recipeId])

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            deleteRecipe.mutate(
              { recipeId },
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
  }, [deleteRecipe, recipeId, router])

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !recipe) {
    return (
      <Screen title="Recipe">
        <ErrorState
          message={error?.message ?? 'Recipe not found'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading || !recipe) {
    return (
      <Screen title="Recipe">
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={200} borderRadius={8} style={{ marginBottom: 16 }} />
          <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={14} />
        </View>
      </Screen>
    )
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)
  const creatorName = recipe.createdBy?.name ?? 'Unknown'

  return (
    <Screen title={recipe.title}>
      {/* Hero image */}
      {recipe.imageUrl ? (
        <Image
          source={{ uri: recipe.imageUrl }}
          style={[styles.heroImage, { borderRadius: 8 }]}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View
          style={[
            styles.heroImage,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ fontSize: 48 }}>🍽️</Text>
        </View>
      )}

      {/* Description */}
      {recipe.description ? (
        <Text
          style={[
            typography.body,
            { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
          ]}
        >
          {recipe.description}
        </Text>
      ) : null}

      {/* Metadata row */}
      <View style={[styles.metaRow, { marginBottom: spacing.md }]}>
        {recipe.prepTime != null && recipe.prepTime > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }]}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              Prep {formatDuration(recipe.prepTime)}
            </Text>
          </View>
        ) : null}
        {recipe.cookTime != null && recipe.cookTime > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }]}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              Cook {formatDuration(recipe.cookTime)}
            </Text>
          </View>
        ) : null}
        {totalTime > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }]}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              Total {formatDuration(totalTime)}
            </Text>
          </View>
        ) : null}
        {recipe.servings != null && recipe.servings > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }]}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              Serves {recipe.servings}
            </Text>
          </View>
        ) : null}
        {recipe.rating != null ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.warning + '20',
                borderRadius: 20,
              },
            ]}
          >
            <Text style={[typography.labelBold, { color: colors.warning }]}>
              ★ {recipe.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Source URL */}
      {recipe.sourceUrl ? (
        <Text
          style={[
            typography.label,
            { color: colors.textTertiary, marginBottom: spacing.md },
          ]}
          numberOfLines={1}
        >
          Source: {recipe.sourceUrl}
        </Text>
      ) : null}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {recipe.tags.map((tag) => (
            <View
              key={tag.id}
              style={[
                styles.tagPill,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 16,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                {tag.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              typography.h3,
              { color: colors.text, marginBottom: spacing.sm },
            ]}
          >
            Ingredients
          </Text>
          {recipe.ingredients.map((ing) => (
            <View
              key={ing.id}
              style={[
                styles.ingredientRow,
                { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {ing.quantity ? `${ing.quantity} ` : ''}
                {ing.unit ? `${ing.unit} ` : ''}
                {ing.name}
              </Text>
              {ing.optional ? (
                <Text style={[typography.label, { color: colors.textTertiary }]}>
                  optional
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              typography.h3,
              { color: colors.text, marginBottom: spacing.sm },
            ]}
          >
            Steps
          </Text>
          {recipe.steps
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((step, idx) => (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  { marginBottom: spacing.md },
                ]}
              >
                <View
                  style={[
                    styles.stepNumber,
                    {
                      backgroundColor: colors.primary,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                    },
                  ]}
                >
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  {step.title ? (
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: colors.text, marginBottom: 2 },
                      ]}
                    >
                      {step.title}
                    </Text>
                  ) : null}
                  <Text style={[typography.body, { color: colors.textSecondary }]}>
                    {step.content}
                  </Text>
                  {step.durationMin ? (
                    <Text
                      style={[
                        typography.label,
                        {
                          color: colors.textTertiary,
                          marginTop: spacing.xs,
                        },
                      ]}
                    >
                      ⏱ {formatDuration(step.durationMin)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
        </View>
      ) : null}

      {/* Review */}
      {recipe.review ? (
        <View
          style={[
            styles.reviewBlock,
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
            Review
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {recipe.review}
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
          title="Start Cooking"
          onPress={handleStartCooking}
          variant="primary"
          size="lg"
        />
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
          loading={deleteRecipe.isPending}
        />
      </View>
    </Screen>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 200,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28,
  },
  tagPill: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBlock: {},
  actions: {
    gap: 12,
  },
})
