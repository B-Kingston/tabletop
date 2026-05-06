import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  StyleSheet,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useKeepAwake } from 'expo-keep-awake'
import * as Haptics from 'expo-haptics'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useTheme } from '@/theme'
import { useRecipe, useUpdateRecipe } from '@/hooks/useRecipes'
import { useReducedMotion } from '@/hooks/useReducedMotion'

import type { RecipeStep, Ingredient } from '@tabletop/shared'

// ── Timer component ───────────────────────────────────────────────────────

interface TimerState {
  totalSeconds: number
  remaining: number
  running: boolean
  finished: boolean
}

function CookingTimer({
  durationMin,
  onComplete,
}: {
  durationMin: number
  onComplete: () => void
}) {
  const { colors, spacing, typography } = useTheme()
  const [timer, setTimer] = useState<TimerState>({
    totalSeconds: durationMin * 60,
    remaining: durationMin * 60,
    running: false,
    finished: false,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Tick
  useEffect(() => {
    if (timer.running && timer.remaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          const next = prev.remaining - 1
          if (next <= 0) {
            // Completed!
            if (intervalRef.current) clearInterval(intervalRef.current)
            onComplete()
            return { ...prev, remaining: 0, running: false, finished: true }
          }
          return { ...prev, remaining: next }
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timer.running, timer.remaining, onComplete])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (timer.finished) {
      setTimer({
        totalSeconds: durationMin * 60,
        remaining: durationMin * 60,
        running: true,
        finished: false,
      })
    } else {
      setTimer((prev) => ({ ...prev, running: true }))
    }
  }

  const handlePause = () => {
    setTimer((prev) => ({ ...prev, running: false }))
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimer({
      totalSeconds: durationMin * 60,
      remaining: durationMin * 60,
      running: false,
      finished: false,
    })
  }

  const progress = timer.totalSeconds > 0
    ? 1 - timer.remaining / timer.totalSeconds
    : 0

  return (
    <View
      style={[
        styles.timerContainer,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 12,
          padding: spacing.lg,
          marginTop: spacing.lg,
        },
      ]}
    >
      {/* Timer ring/bar */}
      <View style={styles.timerRingContainer}>
        <View
          style={[
            styles.timerRingBg,
            { backgroundColor: colors.border, borderRadius: 60 },
          ]}
        />
        <View
          style={[
            styles.timerRingFill,
            {
              backgroundColor: timer.finished ? colors.secondary : colors.primary,
              borderRadius: 60,
              width: `${progress * 100}%` as unknown as number,
            },
          ]}
        />
      </View>

      {/* Large digits */}
      <Text
        style={[
          styles.timerDigits,
          {
            color: timer.finished ? colors.secondary : colors.text,
            marginVertical: spacing.md,
          },
        ]}
        accessibilityRole="timer"
        accessibilityLabel={`Timer: ${formatTime(timer.remaining)}`}
      >
        {formatTime(timer.remaining)}
      </Text>

      {/* Controls */}
      <View style={[styles.timerControls, { gap: spacing.sm }]}>
        {!timer.running && !timer.finished ? (
          <TouchableOpacity
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Start timer"
            style={[
              styles.timerButton,
              {
                backgroundColor: colors.primary,
                borderRadius: 8,
                minWidth: 80,
                minHeight: 56,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Start</Text>
          </TouchableOpacity>
        ) : timer.running ? (
          <TouchableOpacity
            onPress={handlePause}
            accessibilityRole="button"
            accessibilityLabel="Pause timer"
            style={[
              styles.timerButton,
              {
                backgroundColor: colors.warning,
                borderRadius: 8,
                minWidth: 80,
                minHeight: 56,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Pause</Text>
          </TouchableOpacity>
        ) : null}

        {timer.finished ? (
          <TouchableOpacity
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Restart timer"
            style={[
              styles.timerButton,
              {
                backgroundColor: colors.secondary,
                borderRadius: 8,
                minWidth: 80,
                minHeight: 56,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Restart</Text>
          </TouchableOpacity>
        ) : null}

        {(timer.running || timer.remaining < timer.totalSeconds) && !timer.finished ? (
          <TouchableOpacity
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
            style={[
              styles.timerButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                minWidth: 80,
                minHeight: 56,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

// ── Main cooking view ─────────────────────────────────────────────────────

/**
 * Kitchen-optimized cooking view — THE HERO FEATURE.
 * Full-screen, keeps device awake, one step at a time with huge text.
 */
export default function CookScreen() {
  const { id: instanceId, recipeId } = useLocalSearchParams<{
    id: string
    recipeId: string
  }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const { width } = useWindowDimensions()
  const isWide = width >= 768

  // Keep screen awake while cooking
  useKeepAwake()

  // Suppress unused var warning — reducedMotion is used to disable animations
  void reducedMotion

  const {
    data: recipe,
    isLoading,
    isError,
    error,
    refetch,
  } = useRecipe(instanceId, recipeId)

  const updateRecipe = useUpdateRecipe(instanceId)

  const [currentStep, setCurrentStep] = useState(0)
  const [showRating, setShowRating] = useState(false)
  const [ratingValue, setRatingValue] = useState('')
  const [reviewValue, setReviewValue] = useState('')
  const [showIngredients, setShowIngredients] = useState(false)

  // Sort steps by orderIndex
  const sortedSteps: RecipeStep[] = recipe?.steps
    ? [...recipe.steps].sort((a, b) => a.orderIndex - b.orderIndex)
    : []

  const totalSteps = sortedSteps.length
  const step = sortedSteps[currentStep]
  const isLastStep = currentStep >= totalSteps - 1

  // ── Exit confirmation ────────────────────────────────────────────────

  const handleExit = useCallback(() => {
    Alert.alert(
      'Exit Cooking Mode',
      'Are you sure you want to exit? The timer will stop and your screen will sleep.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    )
  }, [router])

  // ── Step navigation ──────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Finished all steps — show rating quick-action
      setShowRating(true)
    }
  }, [currentStep, totalSteps])

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  // ── Timer completion haptic ──────────────────────────────────────────

  const handleTimerComplete = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  // ── Rating submit ────────────────────────────────────────────────────

  const handleRatingSubmit = useCallback(() => {
    const r = parseFloat(ratingValue)
    updateRecipe.mutate(
      {
        recipeId,
        payload: {
          rating: !isNaN(r) && r >= 0 && r <= 5 ? r : undefined,
          review: reviewValue.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowRating(false)
        },
      },
    )
  }, [ratingValue, reviewValue, updateRecipe, recipeId])

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !recipe) {
    return (
      <Screen title="Cooking">
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
      <Screen title="Cooking">
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={40} style={{ marginBottom: 16 }} />
          <Skeleton height={200} borderRadius={8} style={{ marginBottom: 16 }} />
          <Skeleton height={80} style={{ marginBottom: 16 }} />
        </View>
      </Screen>
    )
  }

  // ── Rating quick-action after last step ──────────────────────────────

  if (showRating) {
    return (
      <Screen title="Review" scrollable={false}>
        <View
          style={[
            styles.ratingContainer,
            { padding: spacing['2xl'] },
          ]}
        >
          <Text
            style={[
              typography.h2,
              { color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
            ]}
          >
            🎉 You finished!
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
            ]}
          >
            How was {recipe.title}?
          </Text>

          <View style={{ marginBottom: spacing.md }}>
            <Text
              style={[
                typography.bodyBold,
                { color: colors.text, marginBottom: spacing.xs },
              ]}
            >
              Rating (0.0 - 5.0)
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingValue(String(star))}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${star} stars`}
                  style={[
                    styles.starButton,
                    {
                      backgroundColor:
                        parseFloat(ratingValue) >= star
                          ? colors.warning
                          : colors.surfaceSecondary,
                      borderRadius: 8,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>
                    {parseFloat(ratingValue) >= star ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick review field */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={[
                typography.bodyBold,
                { color: colors.text, marginBottom: spacing.xs },
              ]}
            >
              Quick Review
            </Text>
            <TextInput
              value={reviewValue}
              onChangeText={setReviewValue}
              placeholder="Your thoughts..."
              placeholderTextColor={colors.textTertiary}
              style={[
                typography.body,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: spacing.md,
                  minHeight: 60,
                },
              ]}
              multiline
            />
          </View>

          <View style={{ gap: spacing.md }}>
            <Button
              title={updateRecipe.isPending ? 'Saving...' : 'Save Review'}
              onPress={handleRatingSubmit}
              variant="primary"
              size="lg"
              loading={updateRecipe.isPending}
            />
            <Button
              title="Skip"
              onPress={() => router.back()}
              variant="ghost"
              size="md"
            />
          </View>
        </View>
      </Screen>
    )
  }

  // ── Ingredients panel ──────────────────────────────────────────────────

  const renderIngredients = () => (
    <View style={{ padding: spacing.md }}>
      <Text
        style={[
          typography.h3,
          { color: colors.text, marginBottom: spacing.sm },
        ]}
      >
        Ingredients
      </Text>
      {recipe.ingredients?.map((ing: Ingredient) => (
        <View
          key={ing.id}
          style={[
            styles.ingredientRow,
            { borderBottomColor: colors.border },
          ]}
        >
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
            {ing.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            {ing.quantity ? (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {ing.quantity}
              </Text>
            ) : null}
            {ing.unit ? (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {ing.unit}
              </Text>
            ) : null}
            {ing.optional ? (
              <Text style={[typography.label, { color: colors.textTertiary }]}>
                opt
              </Text>
            ) : null}
          </View>
        </View>
      )) ?? null}
    </View>
  )

  // ── Progress bar ──────────────────────────────────────────────────────

  const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0

  const progressBar = (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.bodyBold, { color: colors.text, textAlign: 'center' }]}>
        Step {currentStep + 1} of {totalSteps}
      </Text>
      <View
        style={[
          styles.progressBarBg,
          {
            backgroundColor: colors.border,
            borderRadius: 4,
            marginTop: spacing.sm,
          },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.primary,
              borderRadius: 4,
              width: `${progress * 100}%` as unknown as number,
            },
          ]}
        />
      </View>
    </View>
  )

  // ── Tablet layout: two-column ─────────────────────────────────────────

  if (isWide) {
    return (
      <Screen title={recipe.title} scrollable={false}>
        <StatusBar hidden />
        <View style={[styles.tabletLayout, { backgroundColor: colors.background }]}>
          {/* Left: Ingredients */}
          <View
            style={[
              styles.tabletIngredients,
              {
                borderRightColor: colors.border,
                borderRightWidth: 1,
              },
            ]}
          >
            <ScrollView>{renderIngredients()}</ScrollView>
          </View>

          {/* Right: Step */}
          <View style={styles.tabletStep}>
            {/* Exit button */}
            <TouchableOpacity
              onPress={handleExit}
              accessibilityRole="button"
              accessibilityLabel="Exit cooking mode"
              style={[
                styles.exitButton,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 8,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>
                ✕ Exit
              </Text>
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={{ flexGrow: 1, padding: spacing.lg }}
            >
              {progressBar}

              {/* Step content */}
              {step ? (
                <View style={{ flex: 1 }}>
                  {step.title ? (
                    <Text
                      style={[
                        { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
                      ]}
                    >
                      {step.title}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.stepContent,
                      { color: colors.text },
                    ]}
                  >
                    {step.content}
                  </Text>

                  {/* Timer */}
                  {step.durationMin != null && step.durationMin > 0 ? (
                    <CookingTimer
                      durationMin={step.durationMin}
                      onComplete={handleTimerComplete}
                    />
                  ) : null}
                </View>
              ) : (
                <Text style={[typography.body, { color: colors.textSecondary }]}>
                  No steps found.
                </Text>
              )}

              {/* Navigation */}
              <View
                style={[
                  styles.navRow,
                  {
                    marginTop: spacing.xl,
                    gap: spacing.md,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={goPrev}
                  disabled={currentStep === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Previous step"
                  style={[
                    styles.navButton,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: 12,
                      opacity: currentStep === 0 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[typography.h2, { color: colors.text }]}>
                    ← Prev
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goNext}
                  accessibilityRole="button"
                  accessibilityLabel={isLastStep ? 'Finish cooking' : 'Next step'}
                  style={[
                    styles.navButton,
                    {
                      backgroundColor: isLastStep ? colors.secondary : colors.primary,
                      borderRadius: 12,
                    },
                  ]}
                >
                  <Text style={[typography.h2, { color: '#FFFFFF' }]}>
                    {isLastStep ? 'Finish' : 'Next →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Screen>
    )
  }

  // ── Phone layout: single column ──────────────────────────────────────

  return (
    <Screen title={recipe.title} scrollable={false}>
      <StatusBar hidden />
      <View style={{ flex: 1 }}>
        {/* Top bar */}
        <View
          style={[
            styles.phoneTopBar,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleExit}
            accessibilityRole="button"
            accessibilityLabel="Exit cooking mode"
            style={[
              styles.exitButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 8,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>
              ✕ Exit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowIngredients((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showIngredients ? 'Hide ingredients' : 'Show ingredients'}
            style={[
              styles.exitButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 8,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: colors.primary }]}>
              {showIngredients ? 'Hide Ingredients' : 'Ingredients'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ingredients panel (toggleable) */}
        {showIngredients ? (
          <View
            style={{
              maxHeight: '40%',
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            }}
          >
            <ScrollView>{renderIngredients()}</ScrollView>
          </View>
        ) : null}

        {/* Step content */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing.lg,
          }}
        >
          {progressBar}

          {step ? (
            <View style={{ flex: 1 }}>
              {step.title ? (
                <Text
                  style={[
                    {
                      fontSize: 28,
                      fontWeight: '700',
                      color: colors.text,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  {step.title}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.stepContent,
                  { color: colors.text },
                ]}
              >
                {step.content}
              </Text>

              {/* Timer */}
              {step.durationMin != null && step.durationMin > 0 ? (
                <CookingTimer
                  durationMin={step.durationMin}
                  onComplete={handleTimerComplete}
                />
              ) : null}
            </View>
          ) : (
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              No steps found.
            </Text>
          )}

          {/* Navigation */}
          <View
            style={[
              styles.navRow,
              {
                marginTop: spacing.xl,
                marginBottom: spacing['3xl'],
                gap: spacing.md,
              },
            ]}
          >
            <TouchableOpacity
              onPress={goPrev}
              disabled={currentStep === 0}
              accessibilityRole="button"
              accessibilityLabel="Previous step"
              style={[
                styles.navButton,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 12,
                  opacity: currentStep === 0 ? 0.4 : 1,
                },
              ]}
            >
              <Text style={[typography.h2, { color: colors.text }]}>
                ← Prev
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel={isLastStep ? 'Finish cooking' : 'Next step'}
              style={[
                styles.navButton,
                {
                  backgroundColor: isLastStep ? colors.secondary : colors.primary,
                  borderRadius: 12,
                },
              ]}
            >
              <Text style={[typography.h2, { color: '#FFFFFF' }]}>
                {isLastStep ? 'Finish' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Screen>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletIngredients: {
    width: '35%',
    minWidth: 280,
  },
  tabletStep: {
    flex: 1,
  },
  phoneTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
  },
  progressBarFill: {
    height: 6,
  },
  stepContent: {
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 38,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerRingContainer: {
    width: '100%',
    height: 12,
    position: 'relative',
  },
  timerRingBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
  },
  timerRingFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 12,
  },
  timerDigits: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  timerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ratingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  starButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
