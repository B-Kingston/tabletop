import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { SelectorField, type SelectorOption } from '@/components/SelectorField'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useTheme } from '@/theme'
import { useNight, useUpdateNight } from '@/hooks/useNights'
import { useWines } from '@/hooks/useWines'
import { useRecipes } from '@/hooks/useRecipes'
import { useMedia } from '@/hooks/useMedia'

import type { Wine, Recipe, MediaItem } from '@tabletop/shared'

/**
 * Edit game night screen — pushed on the instance stack.
 * Pre-populated with existing night data. Supports clearing associations.
 */
export default function NightEditScreen() {
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

  const updateNight = useUpdateNight(instanceId)

  // Data for linked selectors
  const { data: wines } = useWines(instanceId)
  const { data: recipes } = useRecipes(instanceId)
  const { data: mediaList } = useMedia(instanceId)

  const [name, setName] = useState('')
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [clearWine, setClearWine] = useState(false)
  const [clearRecipe, setClearRecipe] = useState(false)
  const [clearMedia, setClearMedia] = useState(false)

  const [hasPopulated, setHasPopulated] = useState(false)

  const isSubmitting = updateNight.isPending

  // ── Build selector options ────────────────────────────────────────────

  const wineOptions: SelectorOption[] = useMemo(
    () =>
      wines?.map((w: Wine) => ({
        id: w.id,
        label: w.name,
        subtitle: `${w.type}${w.rating != null ? ` · ★ ${w.rating.toFixed(1)}` : ''}`,
      })) ?? [],
    [wines],
  )

  const recipeOptions: SelectorOption[] = useMemo(
    () =>
      recipes?.map((r: Recipe) => ({
        id: r.id,
        label: r.title,
        subtitle: r.description ?? undefined,
      })) ?? [],
    [recipes],
  )

  const mediaOptions: SelectorOption[] = useMemo(
    () =>
      mediaList?.map((m: MediaItem) => ({
        id: m.id,
        label: m.title,
        subtitle: `${m.type}${m.status ? ` · ${m.status}` : ''}`,
      })) ?? [],
    [mediaList],
  )

  // ── Populate form from night ──────────────────────────────────────────

  useEffect(() => {
    if (night && !hasPopulated) {
      setName(night.name)
      setSelectedWineId(night.wineId)
      setSelectedRecipeId(night.recipeId)
      setSelectedMediaId(night.mediaId)
      setHasPopulated(true)
    }
  }, [night, hasPopulated])

  // ── Clear toggles ─────────────────────────────────────────────────────

  const handleToggleClearWine = useCallback(() => {
    setClearWine((prev) => !prev)
    if (!clearWine) {
      setSelectedWineId(null)
    }
  }, [clearWine])

  const handleToggleClearRecipe = useCallback(() => {
    setClearRecipe((prev) => !prev)
    if (!clearRecipe) {
      setSelectedRecipeId(null)
    }
  }, [clearRecipe])

  const handleToggleClearMedia = useCallback(() => {
    setClearMedia((prev) => !prev)
    if (!clearMedia) {
      setSelectedMediaId(null)
    }
  }, [clearMedia])

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    updateNight.mutate(
      {
        nightId,
        name: name.trim() || undefined,
        wineId: selectedWineId,
        recipeId: selectedRecipeId,
        mediaId: selectedMediaId,
        clearWine: clearWine || undefined,
        clearRecipe: clearRecipe || undefined,
        clearMedia: clearMedia || undefined,
      },
      {
        onSuccess: () => {
          router.back()
        },
      },
    )
  }, [
    nightId,
    name,
    selectedWineId,
    selectedRecipeId,
    selectedMediaId,
    clearWine,
    clearRecipe,
    clearMedia,
    updateNight,
    router,
  ])

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !night) {
    return (
      <Screen title="Edit Night">
        <ErrorState
          message={error?.message ?? 'Night not found'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading || !night || !hasPopulated) {
    return (
      <Screen title="Edit Night">
        <View style={{ padding: spacing.lg }}>
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} />
        </View>
      </Screen>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Screen title="Edit Night">
      {updateNight.error ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.danger + '15',
              borderColor: colors.danger,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text
            style={[typography.caption, { color: colors.danger }]}
            accessibilityRole="alert"
          >
            {updateNight.error instanceof Error
              ? updateNight.error.message
              : 'Failed to update game night'}
          </Text>
        </View>
      ) : null}

      {/* Name field */}
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Night name"
        editable={!isSubmitting}
      />

      {/* Wine selector */}
      <SelectorField
        label="Wine"
        placeholder="None selected"
        options={wineOptions}
        selectedId={clearWine ? null : selectedWineId}
        onSelect={(id) => {
          setSelectedWineId(id)
          if (clearWine) setClearWine(false)
        }}
        disabled={isSubmitting || clearWine}
      />
      {night.wineId ? (
        <View style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
          <Button
            title={clearWine ? 'Undo Clear Wine' : 'Clear Wine'}
            onPress={handleToggleClearWine}
            variant={clearWine ? 'secondary' : 'ghost'}
            size="sm"
            disabled={isSubmitting}
          />
        </View>
      ) : null}

      {/* Recipe selector */}
      <SelectorField
        label="Recipe"
        placeholder="None selected"
        options={recipeOptions}
        selectedId={clearRecipe ? null : selectedRecipeId}
        onSelect={(id) => {
          setSelectedRecipeId(id)
          if (clearRecipe) setClearRecipe(false)
        }}
        disabled={isSubmitting || clearRecipe}
      />
      {night.recipeId ? (
        <View style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
          <Button
            title={clearRecipe ? 'Undo Clear Recipe' : 'Clear Recipe'}
            onPress={handleToggleClearRecipe}
            variant={clearRecipe ? 'secondary' : 'ghost'}
            size="sm"
            disabled={isSubmitting}
          />
        </View>
      ) : null}

      {/* Media selector */}
      <SelectorField
        label="Media"
        placeholder="None selected"
        options={mediaOptions}
        selectedId={clearMedia ? null : selectedMediaId}
        onSelect={(id) => {
          setSelectedMediaId(id)
          if (clearMedia) setClearMedia(false)
        }}
        disabled={isSubmitting || clearMedia}
      />
      {night.mediaId ? (
        <View style={{ marginTop: -spacing.md, marginBottom: spacing.lg }}>
          <Button
            title={clearMedia ? 'Undo Clear Media' : 'Clear Media'}
            onPress={handleToggleClearMedia}
            variant={clearMedia ? 'secondary' : 'ghost'}
            size="sm"
            disabled={isSubmitting}
          />
        </View>
      ) : null}

      {/* Submit / Cancel */}
      <View style={[styles.actions, { marginTop: spacing.xl, marginBottom: spacing['3xl'] }]}>
        <Button
          title="Save Changes"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          loading={isSubmitting}
        />
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="ghost"
          size="md"
          disabled={isSubmitting}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actions: {
    gap: 12,
  },
})
