import React, { useState, useCallback, useMemo } from 'react'
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
import { useTheme } from '@/theme'
import { useCreateNight } from '@/hooks/useNights'
import { useWines } from '@/hooks/useWines'
import { useRecipes } from '@/hooks/useRecipes'
import { useMedia } from '@/hooks/useMedia'

import type { Wine, Recipe, MediaItem } from '@tabletop/shared'

/**
 * Create game night screen — pushed on the instance stack.
 * Optional name, with linked selectors for wine, recipe, and media.
 */
export default function NightCreateScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const createNight = useCreateNight(instanceId)

  // Data for linked selectors
  const { data: wines } = useWines(instanceId)
  const { data: recipes } = useRecipes(instanceId)
  const { data: mediaList } = useMedia(instanceId)

  const [name, setName] = useState('')
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)

  const isSubmitting = createNight.isPending

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

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    createNight.mutate(
      {
        name: name.trim() || undefined,
        wineId: selectedWineId,
        recipeId: selectedRecipeId,
        mediaId: selectedMediaId,
      },
      {
        onSuccess: () => {
          router.back()
        },
      },
    )
  }, [name, selectedWineId, selectedRecipeId, selectedMediaId, createNight, router])

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Screen title="Create Night">
      {createNight.error ? (
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
            {createNight.error instanceof Error
              ? createNight.error.message
              : 'Failed to create game night'}
          </Text>
        </View>
      ) : null}

      {/* Name field */}
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Auto-generated if left empty"
        editable={!isSubmitting}
      />

      {/* Wine selector */}
      <SelectorField
        label="Wine"
        placeholder="None selected"
        options={wineOptions}
        selectedId={selectedWineId}
        onSelect={setSelectedWineId}
        disabled={isSubmitting}
      />

      {/* Recipe selector */}
      <SelectorField
        label="Recipe"
        placeholder="None selected"
        options={recipeOptions}
        selectedId={selectedRecipeId}
        onSelect={setSelectedRecipeId}
        disabled={isSubmitting}
      />

      {/* Media selector */}
      <SelectorField
        label="Media"
        placeholder="None selected"
        options={mediaOptions}
        selectedId={selectedMediaId}
        onSelect={setSelectedMediaId}
        disabled={isSubmitting}
      />

      {/* Submit / Cancel */}
      <View style={[styles.actions, { marginTop: spacing.xl, marginBottom: spacing['3xl'] }]}>
        <Button
          title="Create Night"
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
