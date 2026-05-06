import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useTheme } from '@/theme'
import { useMediaItem, useUpdateMedia } from '@/hooks/useMedia'
import { formatDate, isValidRating } from '@tabletop/shared'
import type { MediaItem } from '@tabletop/shared'

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
] as const

const STATUS_COLORS: Record<string, string> = {
  planning: '#6366F1',
  watching: '#F59E0B',
  completed: '#10B981',
  dropped: '#EF4444',
}

/**
 * Media edit screen — pushed on the instance stack.
 * Pre-populated with current media values.
 */
export default function MediaEditScreen() {
  const { id: instanceId, mediaId } = useLocalSearchParams<{
    id: string
    mediaId: string
  }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const {
    data: mediaItem,
    isLoading,
    isError,
    error,
    refetch,
  } = useMediaItem(instanceId, mediaId)

  const updateMedia = useUpdateMedia(instanceId)

  // Local form state
  const [status, setStatus] = useState<MediaItem['status']>('planning')
  const [ratingText, setRatingText] = useState('')
  const [review, setReview] = useState('')
  const [planToWatchDate, setPlanToWatchDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

  // Track whether we've populated from the fetched data
  const hasPopulated = useRef(false)

  // Populate form when data arrives
  useEffect(() => {
    if (mediaItem && !hasPopulated.current) {
      hasPopulated.current = true
      setStatus(mediaItem.status)
      setRatingText(mediaItem.rating != null ? String(mediaItem.rating) : '')
      setReview(mediaItem.review ?? '')
      if (mediaItem.planToWatchDate) {
        const d = new Date(mediaItem.planToWatchDate)
        if (!isNaN(d.getTime())) {
          setPlanToWatchDate(d)
        }
      }
    }
  }, [mediaItem])

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false)
      }
      if (selectedDate) {
        setPlanToWatchDate(selectedDate)
      }
    },
    [],
  )

  const handleClearDate = useCallback(() => {
    setPlanToWatchDate(null)
  }, [])

  const handleSubmit = useCallback(() => {
    setRatingError(null)

    // Validate rating if provided
    const ratingVal = ratingText.trim()
    if (ratingVal.length > 0) {
      const parsed = parseFloat(ratingVal)
      if (!isValidRating(parsed)) {
        setRatingError('Rating must be between 0.0 and 5.0')
        return
      }
    }

    const payload: {
      status?: MediaItem['status']
      rating?: number | null
      review?: string
      planToWatchDate?: string
    } = {}

    if (status !== mediaItem?.status) {
      payload.status = status
    }

    if (ratingVal.length > 0) {
      payload.rating = parseFloat(ratingVal)
    } else if (mediaItem?.rating != null) {
      // User cleared the rating → send null to remove it
      payload.rating = null
    }

    if (review !== (mediaItem?.review ?? '')) {
      payload.review = review
    }

    const newDateStr = planToWatchDate
      ? planToWatchDate.toISOString().slice(0, 10)
      : null
    const oldDateStr = mediaItem?.planToWatchDate ?? null
    if (newDateStr !== oldDateStr) {
      payload.planToWatchDate = newDateStr ?? undefined
    }

    // If nothing changed, just go back
    if (Object.keys(payload).length === 0) {
      router.back()
      return
    }

    Keyboard.dismiss()

    updateMedia.mutate(
      { mediaId, payload },
      {
        onSuccess: () => {
          router.back()
        },
      },
    )
  }, [status, ratingText, review, planToWatchDate, mediaItem, mediaId, updateMedia, router])

  // ── Error state ───────────────────────────────────────────────────────

  if (isError && !mediaItem) {
    return (
      <Screen title="Edit Media">
        <ErrorState
          message={error?.message ?? 'Media not found'}
          onRetry={() => refetch()}
        />
      </Screen>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading || !mediaItem) {
    return (
      <Screen title="Edit Media">
        <View style={{ padding: spacing.lg }}>
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={44} />
        </View>
      </Screen>
    )
  }

  const isSubmitting = updateMedia.isPending

  return (
    <Screen title="Edit Media">
      {/* Mutation error banner */}
      {updateMedia.error ? (
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
            {updateMedia.error instanceof Error
              ? updateMedia.error.message
              : 'Failed to update media'}
          </Text>
        </View>
      ) : null}

      {/* Title (read-only) */}
      <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.lg }]}>
        {mediaItem.title}
      </Text>

      {/* Status picker */}
      <Text style={[typography.labelBold, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
        Status
      </Text>
      <View style={[styles.statusRow, { marginBottom: spacing.lg }]}>
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => !isSubmitting && setStatus(opt.value)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={`Status: ${opt.label}`}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.statusChip,
                {
                  backgroundColor: isActive
                    ? STATUS_COLORS[opt.value]
                    : colors.surfaceSecondary,
                  borderRadius: 20,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.labelBold,
                  {
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Rating */}
      <TextField
        label="Rating (0.0 – 5.0)"
        value={ratingText}
        onChangeText={(v) => {
          setRatingText(v)
          if (ratingError) setRatingError(null)
        }}
        placeholder="e.g. 4.5"
        keyboardType="numeric"
        error={ratingError ?? undefined}
        editable={!isSubmitting}
      />

      {/* Review */}
      <TextField
        label="Review"
        value={review}
        onChangeText={setReview}
        placeholder="Your review..."
        editable={!isSubmitting}
      />

      {/* Plan to watch date */}
      <Text style={[typography.labelBold, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
        Plan to watch date
      </Text>
      <View style={[styles.dateRow, { marginBottom: spacing.lg }]}>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Select plan to watch date"
          style={[
            styles.dateButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flex: 1,
            },
          ]}
        >
          <Text
            style={[
              typography.body,
              {
                color: planToWatchDate ? colors.text : colors.textTertiary,
              },
            ]}
          >
            {planToWatchDate ? formatDate(planToWatchDate.toISOString()) : 'Not set'}
          </Text>
        </TouchableOpacity>
        {planToWatchDate ? (
          <Button
            title="Clear"
            onPress={handleClearDate}
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
          />
        ) : null}
      </View>

      {/* Native date picker */}
      {showDatePicker ? (
        <DateTimePicker
          value={planToWatchDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(1900, 0, 1)}
          style={Platform.OS === 'ios' ? { marginBottom: spacing.lg } : undefined}
        />
      ) : null}

      {/* Action buttons */}
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
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  actions: {
    gap: 12,
  },
})
