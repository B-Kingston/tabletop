import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  Switch,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useTheme } from '@/theme'
import { useCreateRecipe } from '@/hooks/useRecipes'
import { getGeneratedRecipe } from '@/stores/generatedRecipeStore'
import { isValidRecipeTitle } from '@tabletop/shared'

// ── Types ─────────────────────────────────────────────────────────────────

interface IngredientDraft {
  key: string
  name: string
  quantity: string
  unit: string
  optional: boolean
}

interface StepDraft {
  key: string
  title: string
  content: string
  durationMin: string
}

let ingredientKeyCounter = 0
function nextIngredientKey(): string {
  return `ing-${++ingredientKeyCounter}-${Date.now()}`
}

let stepKeyCounter = 0
function nextStepKey(): string {
  return `step-${++stepKeyCounter}-${Date.now()}`
}

/**
 * Recipe create screen — pushed on the instance stack.
 * Dynamically add ingredients, steps, and tags.
 */
export default function RecipeCreateScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const createRecipe = useCreateRecipe(instanceId)

  // Read pre-filled AI-generated recipe data (consumed once)
  const prefilled = useRef(getGeneratedRecipe())
  const prefilledData = prefilled.current

  const [title, setTitle] = useState(prefilledData?.title ?? '')
  const [description, setDescription] = useState(prefilledData?.description ?? '')
  const [sourceUrl, setSourceUrl] = useState('')
  const [prepTime, setPrepTime] = useState(
    prefilledData?.prepTime != null ? String(prefilledData.prepTime) : '',
  )
  const [cookTime, setCookTime] = useState(
    prefilledData?.cookTime != null ? String(prefilledData.cookTime) : '',
  )
  const [servings, setServings] = useState(
    prefilledData?.servings != null ? String(prefilledData.servings) : '',
  )
  const [imageUrl, setImageUrl] = useState('')
  const [rating, setRating] = useState('')
  const [review, setReview] = useState('')
  const [tagsInput, setTagsInput] = useState(
    prefilledData?.tags?.join(', ') ?? '',
  )
  const [titleError, setTitleError] = useState<string | null>(null)

  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    prefilledData?.ingredients && prefilledData.ingredients.length > 0
      ? prefilledData.ingredients.map((ing) => ({
          key: nextIngredientKey(),
          name: ing.name,
          quantity: ing.quantity ?? '',
          unit: ing.unit ?? '',
          optional: false,
        }))
      : [
          { key: nextIngredientKey(), name: '', quantity: '', unit: '', optional: false },
        ],
  )

  const [steps, setSteps] = useState<StepDraft[]>(
    prefilledData?.steps && prefilledData.steps.length > 0
      ? prefilledData.steps.map((step) => ({
          key: nextStepKey(),
          title: step.title ?? '',
          content: step.content,
          durationMin: step.durationMin != null ? String(step.durationMin) : '',
        }))
      : [
          { key: nextStepKey(), title: '', content: '', durationMin: '' },
        ],
  )

  const isSubmitting = createRecipe.isPending

  // ── Ingredient management ─────────────────────────────────────────────

  const addIngredient = useCallback(() => {
    setIngredients((prev) => [
      ...prev,
      { key: nextIngredientKey(), name: '', quantity: '', unit: '', optional: false },
    ])
  }, [])

  const removeIngredient = useCallback((key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const updateIngredient = useCallback(
    (key: string, field: keyof IngredientDraft, value: string | boolean) => {
      setIngredients((prev) =>
        prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
      )
    },
    [],
  )

  // ── Step management ───────────────────────────────────────────────────

  const addStep = useCallback(() => {
    setSteps((prev) => [
      ...prev,
      { key: nextStepKey(), title: '', content: '', durationMin: '' },
    ])
  }, [])

  const removeStep = useCallback((key: string) => {
    setSteps((prev) => prev.filter((s) => s.key !== key))
  }, [])

  const updateStep = useCallback(
    (key: string, field: keyof StepDraft, value: string) => {
      setSteps((prev) =>
        prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)),
      )
    },
    [],
  )

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    setTitleError(null)

    if (!isValidRecipeTitle(title)) {
      setTitleError('Recipe title is required (max 200 characters)')
      return
    }

    // Validate at least one step with content
    const hasStep = steps.some((s) => s.content.trim().length > 0)
    if (!hasStep) {
      setTitleError('At least one step with content is required')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      prepTime: prepTime ? parseInt(prepTime, 10) : undefined,
      cookTime: cookTime ? parseInt(cookTime, 10) : undefined,
      servings: servings ? parseInt(servings, 10) : undefined,
      imageUrl: imageUrl.trim() || undefined,
      rating: rating ? parseFloat(rating) : undefined,
      review: review.trim() || undefined,
      ingredients: ingredients
        .filter((i) => i.name.trim().length > 0)
        .map((i) => ({
          name: i.name.trim(),
          quantity: i.quantity.trim() || undefined,
          unit: i.unit.trim() || undefined,
          optional: i.optional,
        })),
      steps: steps
        .filter((s) => s.content.trim().length > 0)
        .map((s, idx) => ({
          orderIndex: idx,
          title: s.title.trim() || undefined,
          content: s.content.trim(),
          durationMin: s.durationMin ? parseInt(s.durationMin, 10) : undefined,
        })),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    }

    createRecipe.mutate(payload, {
      onSuccess: () => {
        router.back()
      },
    })
  }, [
    title,
    description,
    sourceUrl,
    prepTime,
    cookTime,
    servings,
    imageUrl,
    rating,
    review,
    tagsInput,
    ingredients,
    steps,
    createRecipe,
    router,
  ])

  // ── Render ────────────────────────────────────────────────────────────

  const sectionHeader = (label: string) => (
    <Text
      style={[
        typography.h3,
        {
          color: colors.text,
          marginTop: spacing.xl,
          marginBottom: spacing.md,
        },
      ]}
    >
      {label}
    </Text>
  )

  return (
    <Screen title="Create Recipe">
      {createRecipe.error ? (
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
            {createRecipe.error instanceof Error
              ? createRecipe.error.message
              : 'Failed to create recipe'}
          </Text>
        </View>
      ) : null}

      {/* Basic fields */}
      <TextField
        label="Title *"
        value={title}
        onChangeText={(v) => {
          setTitle(v)
          if (titleError) setTitleError(null)
        }}
        placeholder="Recipe name"
        error={titleError ?? undefined}
        editable={!isSubmitting}
      />

      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Brief description"
        editable={!isSubmitting}
      />

      <TextField
        label="Source URL"
        value={sourceUrl}
        onChangeText={setSourceUrl}
        placeholder="https://..."
        keyboardType="default"
        editable={!isSubmitting}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Prep (min)"
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="0"
            keyboardType="numeric"
            editable={!isSubmitting}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Cook (min)"
            value={cookTime}
            onChangeText={setCookTime}
            placeholder="0"
            keyboardType="numeric"
            editable={!isSubmitting}
          />
        </View>
      </View>

      <TextField
        label="Servings"
        value={servings}
        onChangeText={setServings}
        placeholder="4"
        keyboardType="numeric"
        editable={!isSubmitting}
      />

      <TextField
        label="Image URL"
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://..."
        editable={!isSubmitting}
      />

      <TextField
        label="Rating (0.0 - 5.0)"
        value={rating}
        onChangeText={setRating}
        placeholder="4.5"
        keyboardType="numeric"
        editable={!isSubmitting}
      />

      <TextField
        label="Review"
        value={review}
        onChangeText={setReview}
        placeholder="Your review..."
        editable={!isSubmitting}
      />

      <TextField
        label="Tags (comma-separated)"
        value={tagsInput}
        onChangeText={setTagsInput}
        placeholder="Dinner, Quick, Vegetarian"
        editable={!isSubmitting}
      />

      {/* Ingredients */}
      {sectionHeader('Ingredients')}
      {ingredients.map((ing) => (
        <View
          key={ing.key}
          style={[
            styles.dynamicRow,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <TextField
              label="Name *"
              value={ing.name}
              onChangeText={(v) => updateIngredient(ing.key, 'name', v)}
              placeholder="e.g. Onion"
              editable={!isSubmitting}
            />
          </View>
          <View style={styles.ingRowInline}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Qty"
                value={ing.quantity}
                onChangeText={(v) => updateIngredient(ing.key, 'quantity', v)}
                placeholder="2"
                editable={!isSubmitting}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Unit"
                value={ing.unit}
                onChangeText={(v) => updateIngredient(ing.key, 'unit', v)}
                placeholder="cups"
                editable={!isSubmitting}
              />
            </View>
          </View>
          <View style={styles.optionalRow}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Optional
            </Text>
            <Switch
              value={ing.optional}
              onValueChange={(v) => updateIngredient(ing.key, 'optional', v)}
              disabled={isSubmitting}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={ing.optional ? colors.primary : colors.textTertiary}
            />
          </View>
          {ingredients.length > 1 ? (
            <Button
              title="Remove"
              onPress={() => removeIngredient(ing.key)}
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
            />
          ) : null}
        </View>
      ))}
      <Button
        title="+ Add Ingredient"
        onPress={addIngredient}
        variant="secondary"
        size="sm"
        disabled={isSubmitting}
      />

      {/* Steps */}
      {sectionHeader('Steps')}
      {steps.map((step, idx) => (
        <View
          key={step.key}
          style={[
            styles.dynamicRow,
            {
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 8,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Text
            style={[
              typography.labelBold,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            Step {idx + 1}
          </Text>
          <TextField
            label="Title"
            value={step.title}
            onChangeText={(v) => updateStep(step.key, 'title', v)}
            placeholder="e.g. Prep the vegetables"
            editable={!isSubmitting}
          />
          <TextField
            label="Content *"
            value={step.content}
            onChangeText={(v) => updateStep(step.key, 'content', v)}
            placeholder="Describe this step..."
            editable={!isSubmitting}
          />
          <TextField
            label="Duration (min)"
            value={step.durationMin}
            onChangeText={(v) => updateStep(step.key, 'durationMin', v)}
            placeholder="10"
            keyboardType="numeric"
            editable={!isSubmitting}
          />
          {steps.length > 1 ? (
            <Button
              title="Remove"
              onPress={() => removeStep(step.key)}
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
            />
          ) : null}
        </View>
      ))}
      <Button
        title="+ Add Step"
        onPress={addStep}
        variant="secondary"
        size="sm"
        disabled={isSubmitting}
      />

      {/* Submit / Cancel */}
      <View style={[styles.actions, { marginTop: spacing.xl, marginBottom: spacing['3xl'] }]}>
        <Button
          title="Create Recipe"
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dynamicRow: {},
  ingRowInline: {
    flexDirection: 'row',
    gap: 8,
  },
  optionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  actions: {
    gap: 12,
  },
})
