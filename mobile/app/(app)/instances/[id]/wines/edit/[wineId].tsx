import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useTheme } from '@/theme'
import { useWine, useUpdateWine } from '@/hooks/useWines'
import { isValidWineName } from '@tabletop/shared'

import type { Wine } from '@tabletop/shared'

/** Wine type options for the selector. */
const WINE_TYPES: Wine['type'][] = ['red', 'white', 'rose', 'sparkling', 'port']

/** Human-readable labels for wine types. */
const TYPE_LABELS: Record<string, string> = {
  red: 'Red',
  white: 'White',
  rose: 'Rosé',
  sparkling: 'Sparkling',
  port: 'Port',
}

/**
 * Wine edit screen — pushed on the instance stack.
 * Pre-populated with existing wine data.
 */
export default function WineEditScreen() {
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

  const updateWine = useUpdateWine(instanceId)

  const [name, setName] = useState('')
  const [type, setType] = useState<Wine['type']>('red')
  const [cost, setCost] = useState('')
  const [rating, setRating] = useState('')
  const [notes, setNotes] = useState('')
  const [consumedAt, setConsumedAt] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [hasPopulated, setHasPopulated] = useState(false)

  const isSubmitting = updateWine.isPending

  // ── Populate form from wine ───────────────────────────────────────────

  useEffect(() => {
    if (wine && !hasPopulated) {
      setName(wine.name)
      setType(wine.type)
      setCost(wine.cost != null ? String(wine.cost) : '')
      setRating(wine.rating != null ? String(wine.rating) : '')
      setNotes(wine.notes ?? '')
      setConsumedAt(wine.consumedAt ? new Date(wine.consumedAt) : null)
      setHasPopulated(true)
    }
  }, [wine, hasPopulated])

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    setNameError(null)

    if (!isValidWineName(name)) {
      setNameError('Wine name is required (max 200 characters)')
      return
    }

    const payload: {
      name?: string
      type?: Wine['type']
      cost?: number | null
      rating?: number | null
      notes?: string
      consumedAt?: string | null
    } = {}

    if (name.trim() !== wine?.name) {
      payload.name = name.trim()
    }
    if (type !== wine?.type) {
      payload.type = type
    }

    if (cost.trim()) {
      const costNum = parseFloat(cost)
      if (isNaN(costNum) || costNum < 0) {
        setNameError('Cost must be a positive number')
        return
      }
      if (costNum !== (wine?.cost ?? undefined)) {
        payload.cost = costNum
      }
    } else if (wine?.cost != null) {
      payload.cost = undefined
    }

    if (rating.trim()) {
      const ratingNum = parseFloat(rating)
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        setNameError('Rating must be between 0.0 and 5.0')
        return
      }
      const rounded = Math.round(ratingNum * 10) / 10
      if (rounded !== (wine?.rating ?? undefined)) {
        payload.rating = rounded
      }
    } else if (wine?.rating != null) {
      payload.rating = undefined
    }

    const newNotes = notes.trim()
    if (newNotes !== (wine?.notes ?? '')) {
      payload.notes = newNotes || undefined
    }

    const newConsumedAt = consumedAt
      ? consumedAt.toISOString().split('T')[0]
      : undefined
    if (newConsumedAt !== (wine?.consumedAt ?? undefined)) {
      payload.consumedAt = newConsumedAt
    }

    updateWine.mutate(
      { wineId, payload },
      {
        onSuccess: () => {
          router.back()
        },
      },
    )
  }, [name, type, cost, rating, notes, consumedAt, wine, updateWine, wineId, router])

  // ── Date picker handler ───────────────────────────────────────────────

  const onDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false)
      }
      if (selectedDate) {
        setConsumedAt(selectedDate)
      }
    },
    [],
  )

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !wine) {
    return (
      <Screen title="Edit Wine">
        <ErrorState
          message={error?.message ?? 'Wine not found'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading || !wine || !hasPopulated) {
    return (
      <Screen title="Edit Wine">
        <View style={{ padding: spacing.lg }}>
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
        </View>
      </Screen>
    )
  }

  const consumedAtDisplay = consumedAt
    ? consumedAt.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Select date'

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Screen title="Edit Wine">
      {updateWine.error ? (
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
            {updateWine.error instanceof Error
              ? updateWine.error.message
              : 'Failed to update wine'}
          </Text>
        </View>
      ) : null}

      {/* Name */}
      <TextField
        label="Name *"
        value={name}
        onChangeText={(v) => {
          setName(v)
          if (nameError) setNameError(null)
        }}
        placeholder="e.g. Penfolds Grange"
        error={nameError ?? undefined}
        editable={!isSubmitting}
      />

      {/* Type selector */}
      <Text
        style={[
          typography.labelBold,
          { color: colors.textSecondary, marginBottom: spacing.sm },
        ]}
      >
        Type *
      </Text>
      <View style={[styles.typeRow, { marginBottom: spacing.lg }]}>
        {WINE_TYPES.map((t) => {
          const isActive = type === t
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              disabled={isSubmitting}
              accessibilityRole="radio"
              accessibilityLabel={TYPE_LABELS[t]}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.typeChip,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceSecondary,
                  borderRadius: 20,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
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
                {TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Cost */}
      <TextField
        label="Cost ($)"
        value={cost}
        onChangeText={setCost}
        placeholder="0.00"
        keyboardType="numeric"
        editable={!isSubmitting}
      />

      {/* Rating */}
      <TextField
        label="Rating (0.0 - 5.0)"
        value={rating}
        onChangeText={setRating}
        placeholder="4.5"
        keyboardType="numeric"
        editable={!isSubmitting}
      />

      {/* Notes */}
      <TextField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Tasting notes..."
        editable={!isSubmitting}
      />

      {/* Consumed date */}
      <Text
        style={[
          typography.labelBold,
          { color: colors.textSecondary, marginBottom: spacing.sm },
        ]}
      >
        Date Consumed
      </Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Select consumed date"
        style={[
          styles.dateButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text style={[typography.body, { color: colors.text }]}>
          {consumedAtDisplay}
        </Text>
      </TouchableOpacity>

      {showDatePicker ? (
        <View style={{ marginBottom: spacing.lg }}>
          <DateTimePicker
            value={consumedAt ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
          {consumedAt ? (
            <Button
              title="Clear date"
              onPress={() => {
                setConsumedAt(null)
                setShowDatePicker(false)
              }}
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
            />
          ) : null}
        </View>
      ) : null}

      {/* Submit / Cancel */}
      <View
        style={[
          styles.actions,
          { marginTop: spacing.xl, marginBottom: spacing['3xl'] },
        ]}
      >
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
  },
  actions: {
    gap: 12,
  },
})
