import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
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
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWines } from '@/hooks/useWines'
import { useRecipes } from '@/hooks/useRecipes'
import { useMedia } from '@/hooks/useMedia'
import { useCreateNight } from '@/hooks/useNights'
import {
  selectRandomItem,
  generateNightName,
  hasItemsInCategory,
} from '@/utils/spinHelpers'

import type { Wine, Recipe, MediaItem } from '@tabletop/shared'

type Category = 'wine' | 'recipe' | 'media'

interface SpinResult {
  wine?: Wine
  recipe?: Recipe
  media?: MediaItem
}

// ── Helpers ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Category, { emoji: string; label: string; createRoute: string }> = {
  wine: { emoji: '🍷', label: 'Wine', createRoute: 'wines/create' },
  recipe: { emoji: '🍽️', label: 'Recipe', createRoute: 'recipes/create' },
  media: { emoji: '🎬', label: 'Media', createRoute: 'media/create' },
}

/** All categories in toggle order */
const ALL_CATEGORIES: Category[] = ['wine', 'recipe', 'media']

/** Get items array for a category */
function getItemsForCategory(
  category: Category,
  wines: Wine[] | undefined,
  recipes: Recipe[] | undefined,
  media: MediaItem[] | undefined,
): (Wine | Recipe | MediaItem)[] {
  switch (category) {
    case 'wine':
      return wines ?? []
    case 'recipe':
      return recipes ?? []
    case 'media':
      return media ?? []
  }
}

// ── Spin Screen ───────────────────────────────────────────────────────────

export default function SpinScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const reducedMotion = useReducedMotion()

  // ── Data ─────────────────────────────────────────────────────────────

  const { data: wines, isLoading: winesLoading, isError: winesError, refetch: refetchWines } = useWines(instanceId)
  const { data: recipes, isLoading: recipesLoading, isError: recipesError, refetch: refetchRecipes } = useRecipes(instanceId)
  const { data: mediaList, isLoading: mediaLoading, isError: mediaError, refetch: refetchMedia } = useMedia(instanceId)

  const createNight = useCreateNight(instanceId)

  const isLoading = winesLoading || recipesLoading || mediaLoading
  const allErrors = [winesError && 'wines', recipesError && 'recipes', mediaError && 'media']
    .filter(Boolean)
    .join(', ')

  // ── State ─────────────────────────────────────────────────────────────

  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(['wine', 'recipe', 'media']),
  )
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<SpinResult | null>(null)
  const nightName = useMemo(
    () => (result ? generateNightName(result) : ''),
    [result],
  )

  // Cycling display indices (updated by interval during spin)
  const [cycleIndices, setCycleIndices] = useState<Record<Category, number>>({
    wine: 0,
    recipe: 0,
    media: 0,
  })

  // Animation values
  const resultOpacity = useRef(new Animated.Value(0)).current
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([])

  // ── Derived ───────────────────────────────────────────────────────────

  const canSpin = useMemo(
    () => hasItemsInCategory(selectedCategories, wines ?? [], recipes ?? [], mediaList ?? []),
    [selectedCategories, wines, recipes, mediaList],
  )

  const categoryEmpty = useCallback(
    (cat: Category): boolean => {
      const items = getItemsForCategory(cat, wines, recipes, mediaList)
      return items.length === 0
    },
    [wines, recipes, mediaList],
  )

  const getCategoryItems = useCallback(
    (cat: Category): (Wine | Recipe | MediaItem)[] => {
      return getItemsForCategory(cat, wines, recipes, mediaList)
    },
    [wines, recipes, mediaList],
  )

  // ── Toggle category ───────────────────────────────────────────────────

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        // Don't allow deselecting the last selected category
        if (next.size <= 1) return prev
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
    // Reset result when categories change
    setResult(null)
  }, [])

  // ── Clear intervals helper ────────────────────────────────────────────

  const clearAllIntervals = useCallback(() => {
    intervalRefs.current.forEach(clearInterval)
    intervalRefs.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllIntervals()
  }, [clearAllIntervals])

  // ── Spin ──────────────────────────────────────────────────────────────

  const performSpin = useCallback(() => {
    if (!canSpin) return

    setSpinning(true)
    setResult(null)
    resultOpacity.setValue(0)

    const activeCategories = ALL_CATEGORIES.filter(
      (cat) => selectedCategories.has(cat) && !categoryEmpty(cat),
    )

    if (reducedMotion) {
      // Reduced motion: just pick random items immediately with a brief delay
      const timeout = setTimeout(() => {
        const selections: SpinResult = {}
        for (const cat of activeCategories) {
          const items = getCategoryItems(cat)
          if (items.length > 0) {
            const picked = selectRandomItem(items)
            if (cat === 'wine') selections.wine = picked as Wine
            if (cat === 'recipe') selections.recipe = picked as Recipe
            if (cat === 'media') selections.media = picked as MediaItem
          }
        }
        setResult(selections)
        setSpinning(false)

        // Fade in result
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start()
      }, 400)

      return () => clearTimeout(timeout)
    }

    // Normal: rapid cycling for 1.5-2s
    const spinDuration = 1500 + Math.random() * 500

    // Start cycling intervals for each active category
    for (const cat of activeCategories) {
      const items = getCategoryItems(cat)
      if (items.length <= 1) continue // No cycling needed for single item

      const interval = setInterval(() => {
        setCycleIndices((prev) => {
          const next = (prev[cat] + 1) % items.length
          return { ...prev, [cat]: next }
        })
      }, 80)

      intervalRefs.current.push(interval)
    }

    // After spin duration, settle on final choices
    const settleTimeout = setTimeout(() => {
      clearAllIntervals()

      const selections: SpinResult = {}
      for (const cat of activeCategories) {
        const items = getCategoryItems(cat)
        if (items.length > 0) {
          const picked = selectRandomItem(items)
          if (cat === 'wine') selections.wine = picked as Wine
          if (cat === 'recipe') selections.recipe = picked as Recipe
          if (cat === 'media') selections.media = picked as MediaItem
        }
      }

      setResult(selections)
      setSpinning(false)

      // Haptic feedback on completion
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Fade in result
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start()
    }, spinDuration)

    return () => {
      clearTimeout(settleTimeout)
      clearAllIntervals()
    }
  }, [canSpin, reducedMotion, selectedCategories, categoryEmpty, getCategoryItems, resultOpacity, clearAllIntervals])

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!result) return

    createNight.mutate(
      {
        name: nightName,
        wineId: result.wine?.id ?? null,
        recipeId: result.recipe?.id ?? null,
        mediaId: result.media?.id ?? null,
      },
      {
        onSuccess: () => {
          router.back()
        },
      },
    )
  }, [result, nightName, createNight, router])

  // ── Navigate to create ─────────────────────────────────────────────────

  const handleNavigateToCreate = useCallback(
    (cat: Category) => {
      router.push(`/(app)/instances/${instanceId}/${CATEGORY_LABELS[cat].createRoute}`)
    },
    [router, instanceId],
  )

  // ── Get display item for cycling / result ─────────────────────────────

  const getDisplayItem = useCallback(
    (cat: Category): Wine | Recipe | MediaItem | null => {
      const items = getCategoryItems(cat)
      if (items.length === 0) return null

      if (spinning) {
        return items[cycleIndices[cat] % items.length]
      }

      if (result) {
        if (cat === 'wine') return result.wine ?? null
        if (cat === 'recipe') return result.recipe ?? null
        if (cat === 'media') return result.media ?? null
      }

      return null
    },
    [cycleIndices, spinning, result, getCategoryItems],
  )

  // ── Error state ────────────────────────────────────────────────────────

  if (allErrors && !isLoading) {
    const handleRetry = () => {
      if (winesError) void refetchWines()
      if (recipesError) void refetchRecipes()
      if (mediaError) void refetchMedia()
    }

    return (
      <Screen>
        <ErrorState
          message={`Failed to load: ${allErrors}`}
          onRetry={handleRetry}
        />
      </Screen>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const totalItemCount = (wines?.length ?? 0) + (recipes?.length ?? 0) + (mediaList?.length ?? 0)

  return (
    <Screen scrollable={false}>
      {/* ── Custom Header ──────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Text style={[typography.body, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text
          style={[typography.h2, { color: colors.text, flex: 1, marginLeft: spacing.sm }]}
          accessibilityRole="header"
        >
          Spin the Night
        </Text>
      </View>

      {/* ── Content (scrollable) ────────────────────────────────────── */}
      <View style={[styles.content, { padding: spacing.lg }]}>
        {/* Category toggles */}
        <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          Select categories to include
        </Text>

        <View style={styles.toggleRow}>
          {ALL_CATEGORIES.map((cat) => {
            const info = CATEGORY_LABELS[cat]
            const selected = selectedCategories.has(cat)
            const empty = categoryEmpty(cat)

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => toggleCategory(cat)}
                disabled={spinning}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: spinning }}
                accessibilityLabel={`${info.emoji} ${info.label}${empty ? ' (empty)' : ''}`}
                style={[
                  styles.toggleChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceSecondary,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: spinning ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.toggleEmoji}>{info.emoji}</Text>
                <Text
                  style={[
                    typography.captionBold,
                    {
                      color: selected ? '#FFFFFF' : colors.text,
                      marginLeft: 4,
                    },
                  ]}
                >
                  {info.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Empty category warnings */}
        {ALL_CATEGORIES.map((cat) => {
          if (!selectedCategories.has(cat) || !categoryEmpty(cat)) return null
          const info = CATEGORY_LABELS[cat]
          return (
            <View
              key={`empty-${cat}`}
              style={[
                styles.emptyBanner,
                {
                  backgroundColor: colors.warning + '15',
                  borderColor: colors.warning,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.warning, flex: 1 }]}>
                No {info.label.toLowerCase()}s yet —{' '}
              </Text>
              <TouchableOpacity
                onPress={() => handleNavigateToCreate(cat)}
                accessibilityRole="link"
                accessibilityLabel={`Add a ${info.label.toLowerCase()}`}
              >
                <Text style={[typography.captionBold, { color: colors.primary, textDecorationLine: 'underline' }]}>
                  add one
                </Text>
              </TouchableOpacity>
            </View>
          )
        })}

        {/* Loading */}
        {isLoading && (
          <View style={{ marginTop: spacing['2xl'] }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                width="100%"
                height={18}
                style={{ marginBottom: spacing.sm }}
              />
            ))}
          </View>
        )}

        {/* Empty state: no items in any category */}
        {!isLoading && totalItemCount === 0 && (
          <View style={[styles.emptyContainer, { marginTop: spacing['3xl'] }]}>
            <Text style={[typography.h3, { color: colors.textSecondary, textAlign: 'center' }]}>
              Nothing to spin yet!
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: spacing.sm,
                },
              ]}
            >
              Add some wines, recipes, or media to get started.
            </Text>
          </View>
        )}

        {/* Spin button */}
        {!isLoading && totalItemCount > 0 && (
          <View style={{ marginTop: spacing['2xl'] }}>
            <Button
              title={spinning ? 'Spinning...' : '🎲 Spin!'}
              onPress={performSpin}
              variant="primary"
              size="lg"
              disabled={!canSpin || spinning}
              loading={spinning}
            />
            {!canSpin && selectedCategories.size > 0 && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    textAlign: 'center',
                    marginTop: spacing.sm,
                  },
                ]}
              >
                Selected categories have no items. Add items or toggle other categories.
              </Text>
            )}
          </View>
        )}

        {/* Cycling display during spin */}
        {spinning && (
          <View style={[styles.cyclingContainer, { marginTop: spacing['2xl'] }]}>
            <Text
              style={[
                typography.captionBold,
                { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
              ]}
            >
              Spinning...
            </Text>
            {ALL_CATEGORIES.map((cat) => {
              if (!selectedCategories.has(cat) || categoryEmpty(cat)) return null
              const item = getDisplayItem(cat)
              if (!item) return null
              const info = CATEGORY_LABELS[cat]
              const name = 'name' in item ? item.name : 'title' in item ? item.title : ''
              const subtitle =
                cat === 'wine'
                  ? (item as Wine).type
                  : cat === 'media'
                    ? (item as MediaItem).type
                    : undefined

              return (
                <View
                  key={cat}
                  style={[
                    styles.cyclingItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={styles.resultEmoji}>{info.emoji}</Text>
                  <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                  {subtitle ? (
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textSecondary, marginLeft: spacing.sm },
                      ]}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        )}

        {/* Result display */}
        {result && (
          <Animated.View style={[styles.resultContainer, { opacity: resultOpacity }]}>
            <Text
              style={[
                typography.labelBold,
                { color: colors.textSecondary, marginBottom: spacing.sm },
              ]}
            >
              YOUR NIGHT
            </Text>

            {/* Night name */}
            <Card style={{ marginBottom: spacing.md }}>
              <Text
                style={[typography.h3, { color: colors.text, textAlign: 'center' }]}
                numberOfLines={3}
              >
                {nightName}
              </Text>
            </Card>

            {/* Individual selections */}
            {result.wine && selectedCategories.has('wine') && (
              <View
                style={[
                  styles.resultItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={styles.resultEmoji}>🍷</Text>
                <View style={styles.resultTextContainer}>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>
                    {result.wine.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {result.wine.type}
                    {result.wine.rating != null ? ` · ★ ${result.wine.rating.toFixed(1)}` : ''}
                  </Text>
                </View>
              </View>
            )}

            {result.recipe && selectedCategories.has('recipe') && (
              <View
                style={[
                  styles.resultItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={styles.resultEmoji}>🍽️</Text>
                <View style={styles.resultTextContainer}>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>
                    {result.recipe.title}
                  </Text>
                  {result.recipe.description ? (
                    <Text
                      style={[typography.caption, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {result.recipe.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}

            {result.media && selectedCategories.has('media') && (
              <View
                style={[
                  styles.resultItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={styles.resultEmoji}>🎬</Text>
                <View style={styles.resultTextContainer}>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>
                    {result.media.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {result.media.type}
                  </Text>
                </View>
              </View>
            )}

            {/* Action buttons */}
            <View style={[styles.resultActions, { marginTop: spacing.xl }]}>
              <Button
                title="Save Night"
                onPress={handleSave}
                variant="primary"
                size="lg"
                disabled={createNight.isPending}
                loading={createNight.isPending}
              />

              {/* Save error */}
              {createNight.error && (
                <Text
                  style={[
                    typography.caption,
                    { color: colors.danger, textAlign: 'center', marginTop: spacing.sm },
                  ]}
                  accessibilityRole="alert"
                >
                  {createNight.error instanceof Error
                    ? createNight.error.message
                    : 'Failed to save night'}
                </Text>
              )}

              <Button
                title="Spin Again"
                onPress={() => {
                  setResult(null)
                  resultOpacity.setValue(0)
                  performSpin()
                }}
                variant="secondary"
                size="md"
                disabled={spinning || !canSpin}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleEmoji: {
    fontSize: 16,
  },
  emptyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  cyclingContainer: {
    paddingVertical: 12,
  },
  cyclingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  resultContainer: {
    marginTop: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  resultEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultActions: {
    gap: 12,
  },
})
