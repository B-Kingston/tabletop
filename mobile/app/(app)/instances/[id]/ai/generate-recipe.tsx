import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { ErrorState } from '@/components/ErrorState'
import { IconButton } from '@/components/IconButton'
import { useTheme } from '@/theme'
import { useGenerateRecipe, RateLimitError } from '@/hooks/useAI'
import { setGeneratedRecipe } from '@/stores/generatedRecipeStore'

import type { GenerateRecipeResponse } from '@/utils/aiRecipeParser'

// ── Helpers ───────────────────────────────────────────────────────────────

function isValidPrompt(prompt: string): boolean {
  return prompt.trim().length >= 3
}

// ── Screen ────────────────────────────────────────────────────────────────

/**
 * Recipe generation screen — user enters a prompt, AI generates a recipe.
 * Rate-limit errors are shown with retry. Successful results can be saved.
 */
export default function GenerateRecipeScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const generateRecipe = useGenerateRecipe(instanceId)

  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<GenerateRecipeResponse | null>(null)

  const isGenerating = generateRecipe.isPending

  // ── Submit ──────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    if (!isValidPrompt(prompt) || isGenerating) return

    generateRecipe.mutate(
      { prompt: prompt.trim() },
      {
        onSuccess: (data) => {
          setResult(data)
        },
      },
    )
  }, [prompt, isGenerating, generateRecipe])

  // ── Save as recipe ──────────────────────────────────────────────────

  const handleSaveAsRecipe = useCallback(() => {
    if (!result) return

    setGeneratedRecipe(result)
    router.push(`/(app)/instances/${instanceId}/recipes/create`)
  }, [result, router, instanceId])

  // ── Rate-limit error ────────────────────────────────────────────────

  const rateLimitError =
    generateRecipe.error instanceof RateLimitError
      ? generateRecipe.error
      : null

  if (rateLimitError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        {/* Header with back */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <IconButton
            onPress={() => router.back()}
            accessibilityLabel="Back to AI assistant"
            variant="ghost"
          >
            <Text
              style={[typography.bodyBold, { color: colors.primary, fontSize: 16 }]}
            >
              ←
            </Text>
          </IconButton>
          <Text
            style={[typography.h3, { color: colors.text, flex: 1 }]}
            accessibilityRole="header"
          >
            Generate Recipe
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ErrorState
          message={rateLimitError.message}
          onRetry={() => handleGenerate()}
        />
      </SafeAreaView>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* Custom header with back button */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <IconButton
          onPress={() => router.back()}
          accessibilityLabel="Back to AI assistant"
          variant="ghost"
        >
          <Text
            style={[typography.bodyBold, { color: colors.primary, fontSize: 16 }]}
          >
            ←
          </Text>
        </IconButton>
        <Text
          style={[typography.h3, { color: colors.text, flex: 1 }]}
          accessibilityRole="header"
        >
          Generate Recipe
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing['3xl'],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Prompt input */}
        <TextField
          label="What kind of recipe?"
          value={prompt}
          onChangeText={setPrompt}
          placeholder='e.g. "A spicy Thai green curry with chicken and vegetables"'
          editable={!isGenerating}
        />

        <Button
          title="Generate Recipe"
          onPress={handleGenerate}
          variant="primary"
          size="lg"
          disabled={!isValidPrompt(prompt) || isGenerating}
          loading={isGenerating}
        />

        {/* Generic error */}
        {generateRecipe.error && !rateLimitError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.danger + '15',
                borderColor: colors.danger,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Text
              style={[typography.caption, { color: colors.danger }]}
              accessibilityRole="alert"
            >
              {generateRecipe.error instanceof Error
                ? generateRecipe.error.message
                : 'Failed to generate recipe'}
            </Text>
          </View>
        ) : null}

        {/* Loading spinner */}
        {isGenerating ? (
          <View style={[styles.loadingContainer, { marginTop: spacing['3xl'] }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: spacing.md },
              ]}
            >
              Generating your recipe...
            </Text>
          </View>
        ) : null}

        {/* Result preview */}
        {result && !isGenerating ? (
          <View style={{ marginTop: spacing.xl }}>
            {/* Title */}
            {result.title ? (
              <Text
                style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}
              >
                {result.title}
              </Text>
            ) : null}

            {/* Description */}
            {result.description ? (
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    marginBottom: spacing.lg,
                  },
                ]}
              >
                {result.description}
              </Text>
            ) : null}

            {/* Metadata chips */}
            {result.prepTime != null ||
            result.cookTime != null ||
            result.servings != null ? (
              <View style={[styles.chipRow, { marginBottom: spacing.md }]}>
                {result.prepTime != null && result.prepTime > 0 ? (
                  <View
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: 20,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text style={[typography.label, { color: colors.textSecondary }]}>
                      Prep {result.prepTime} min
                    </Text>
                  </View>
                ) : null}
                {result.cookTime != null && result.cookTime > 0 ? (
                  <View
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: 20,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text style={[typography.label, { color: colors.textSecondary }]}>
                      Cook {result.cookTime} min
                    </Text>
                  </View>
                ) : null}
                {result.servings != null && result.servings > 0 ? (
                  <View
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: 20,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text style={[typography.label, { color: colors.textSecondary }]}>
                      Serves {result.servings}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Tags */}
            {result.tags && result.tags.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: spacing.md }}
                contentContainerStyle={{ gap: spacing.sm }}
              >
                {result.tags.map((tag, idx) => (
                  <View
                    key={`${tag}-${idx}`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: 16,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text style={[typography.label, { color: colors.textSecondary }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {/* Ingredients */}
            {result.ingredients && result.ingredients.length > 0 ? (
              <View style={{ marginBottom: spacing.lg }}>
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text, marginBottom: spacing.sm },
                  ]}
                >
                  Ingredients
                </Text>
                {result.ingredients.map((ing, idx) => (
                  <View
                    key={`ing-${idx}`}
                    style={[
                      styles.ingredientRow,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Text style={[typography.body, { color: colors.text }]}>
                      {ing.quantity ? `${ing.quantity} ` : ''}
                      {ing.unit ? `${ing.unit} ` : ''}
                      {ing.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Steps */}
            {result.steps && result.steps.length > 0 ? (
              <View style={{ marginBottom: spacing.lg }}>
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text, marginBottom: spacing.sm },
                  ]}
                >
                  Steps
                </Text>
                {result.steps.map((step, idx) => (
                  <View
                    key={`step-${idx}`}
                    style={[styles.stepRow, { marginBottom: spacing.md }]}
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
                      <Text
                        style={[typography.body, { color: colors.textSecondary }]}
                      >
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
                          ⏱ {step.durationMin} min
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Save as recipe button */}
            <Button
              title="Save as Recipe"
              onPress={handleSaveAsRecipe}
              variant="primary"
              size="lg"
              accessibilityLabel="Save generated recipe as a new recipe"
            />

            {/* Retry / generate another */}
            <View style={{ marginTop: spacing.md }}>
              <Button
                title="Generate Another"
                onPress={() => {
                  setResult(null)
                  setPrompt('')
                }}
                variant="ghost"
                size="md"
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28,
  },
  ingredientRow: {
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
})
