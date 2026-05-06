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
import { useRecipes } from '@/hooks/useRecipes'
import { formatDuration } from '@tabletop/shared'

import type { Recipe } from '@tabletop/shared'

/**
 * Predefined tag filter options for recipe discovery.
 */
const COMMON_TAGS = [
  'All',
  'Dinner',
  'Dessert',
  'Quick',
  'Slow Cook',
  'Breakfast',
  'Lunch',
  'Snack',
  'Drink',
  'Vegetarian',
]

/**
 * Recipe list screen — the Recipes tab in the instance tab navigator.
 */
export default function RecipesScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const [selectedTag, setSelectedTag] = useState<string>('All')
  const tagFilter = selectedTag === 'All' ? undefined : selectedTag

  const {
    data: recipes,
    isLoading,
    isError,
    error,
    refetch,
  } = useRecipes(instanceId, tagFilter)

  // ── Render helpers ────────────────────────────────────────────────────

  const handleAddRecipe = useCallback(() => {
    router.push(`/(app)/instances/${instanceId}/recipes/create`)
  }, [router, instanceId])

  const handlePressRecipe = useCallback(
    (recipe: Recipe) => {
      router.push(`/(app)/instances/${instanceId}/recipes/${recipe.id}`)
    },
    [router, instanceId],
  )

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !recipes) {
    return (
      <Screen title="Recipes">
        <ErrorState
          message={error?.message ?? 'Failed to load recipes'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Tag filter bar ────────────────────────────────────────────────────

  const tagBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.tagBar, { borderBottomColor: colors.border }]}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
    >
      {COMMON_TAGS.map((tag) => {
        const isActive = selectedTag === tag
        return (
          <TouchableOpacity
            key={tag}
            onPress={() => setSelectedTag(tag)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${tag}`}
            accessibilityState={{ selected: isActive }}
            style={[
              styles.tagChip,
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
              {tag}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )

  // ── Recipe card ───────────────────────────────────────────────────────

  const renderRecipeCard = useCallback(
    ({ item }: { item: Recipe }) => {
      const totalTime = (item.prepTime || 0) + (item.cookTime || 0)
      const creatorName = item.createdBy?.name ?? 'Unknown'

      return (
        <TouchableOpacity
          onPress={() => handlePressRecipe(item)}
          accessibilityRole="button"
          accessibilityLabel={`Recipe: ${item.title}`}
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
          {/* Image */}
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.cardImage, { borderRadius: 8 }]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.cardImage,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text style={[typography.h3, { color: colors.textTertiary }]}>
                🍽️
              </Text>
            </View>
          )}

          {/* Content */}
          <View style={{ marginTop: spacing.md }}>
            <Text
              style={[typography.h3, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            {item.description ? (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, marginTop: spacing.xs },
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}

            {/* Metadata row */}
            <View
              style={[styles.metaRow, { marginTop: spacing.sm }]}
            >
              {totalTime > 0 ? (
                <Text style={[typography.label, { color: colors.textSecondary }]}>
                  {formatDuration(totalTime)}
                </Text>
              ) : null}
              {item.servings ? (
                <Text style={[typography.label, { color: colors.textSecondary }]}>
                  {item.servings} servings
                </Text>
              ) : null}
              {item.rating != null ? (
                <Text style={[typography.label, { color: colors.warning }]}>
                  ★ {item.rating.toFixed(1)}
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
        </TouchableOpacity>
      )
    },
    [colors, spacing, typography, handlePressRecipe],
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
          <Skeleton height={160} borderRadius={8} />
          <View style={{ marginTop: spacing.md }}>
            <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Skeleton width={50} height={12} />
              <Skeleton width={60} height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  )

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <Screen
      title="Recipes"
      rightAction={
        <Button title="+" onPress={handleAddRecipe} variant="primary" size="sm" />
      }
    >
      {tagBar}

      {isLoading ? (
        renderSkeletons()
      ) : recipes && recipes.length > 0 ? (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeCard}
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
            <EmptyState
              message="No recipes found for this tag."
            />
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <EmptyState
            message="No recipes yet."
            actionLabel="Add your first recipe"
            onAction={handleAddRecipe}
          />
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tagBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    maxHeight: 40,
  },
  tagChip: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
})
