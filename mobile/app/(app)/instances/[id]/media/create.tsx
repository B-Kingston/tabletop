import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'

import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { useTheme } from '@/theme'
import { useOMDBSearch, useOMDBDetail } from '@/hooks/useOMDB'
import { useAddMedia } from '@/hooks/useMedia'

import type { OMDBSearchResult } from '@/hooks/useOMDB'

const FALLBACK_ICON: Record<string, string> = {
  movie: '🎬',
  tv: '📺',
}

/**
 * Media create screen — OMDb search + add flow.
 */
export default function MediaCreateScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResult, setSelectedResult] = useState<OMDBSearchResult | null>(null)

  const {
    data: searchResults,
    isLoading: isSearching,
    isError: isSearchError,
    error: searchError,
    refetch,
  } = useOMDBSearch(instanceId, searchQuery, 1)

  const { data: selectedDetail, isLoading: detailLoading } = useOMDBDetail(
    instanceId,
    selectedResult?.omdbId,
  )

  const addMedia = useAddMedia(instanceId)

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSelectResult = useCallback((result: OMDBSearchResult) => {
    setSelectedResult(result)
  }, [])

  const handleAddToCollection = useCallback(() => {
    if (!selectedResult) return

    addMedia.mutate(
      {
        omdbId: selectedResult.omdbId,
        type: selectedResult.type,
        title: selectedResult.title,
        releaseYear: selectedResult.releaseYear || undefined,
      },
      {
        onSuccess: () => {
          router.back()
        },
      },
    )
  }, [selectedResult, addMedia, router])

  const handleClearSelection = useCallback(() => {
    setSelectedResult(null)
  }, [])

  // ── Render: search result card ────────────────────────────────────────

  const renderResultCard = useCallback(
    ({ item }: { item: OMDBSearchResult }) => {
      const typeLabel = item.type === 'tv' ? 'TV' : 'Movie'
      const isSelected = selectedResult?.omdbId === item.omdbId

      return (
        <TouchableOpacity
          onPress={() => handleSelectResult(item)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${item.title}`}
          style={[
            styles.resultCard,
            {
              backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
              borderColor: isSelected ? colors.primary : colors.border,
              borderRadius: 8,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View style={styles.resultRow}>
            <View
              style={[
                styles.resultPoster,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>
                {FALLBACK_ICON[item.type] ?? '🎬'}
              </Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.resultMeta, { marginTop: spacing.xs }]}>
                {item.releaseYear ? (
                  <Text style={[typography.label, { color: colors.textSecondary }]}>
                    {item.releaseYear}
                  </Text>
                ) : null}
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: 8,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  <Text style={[typography.labelBold, { color: colors.textSecondary }]}>
                    {typeLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [colors, spacing, typography, handleSelectResult, selectedResult],
  )

  // ── Render: detail preview ────────────────────────────────────────────

  const renderDetailPreview = () => {
    if (!selectedResult) return null

    const hasPoster = selectedDetail?.poster && selectedDetail.poster !== 'N/A'

    return (
      <View
        style={[
          styles.preview,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: spacing.lg,
            paddingBottom: spacing.lg,
            marginTop: spacing.md,
          },
        ]}
      >
        {/* Preview header */}
        <View style={styles.previewHeader}>
          <Text
            style={[typography.h3, { color: colors.text, flex: 1 }]}
            numberOfLines={2}
          >
            {selectedResult.title}
          </Text>
          <TouchableOpacity
            onPress={handleClearSelection}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            style={[
              styles.closePreview,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: 20,
                width: 32,
                height: 32,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview poster + info */}
        <View style={styles.previewRow}>
          {hasPoster ? (
            <Image
              source={{ uri: selectedDetail!.poster }}
              style={[styles.previewPoster, { borderRadius: 8 }]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.previewPoster,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text style={{ fontSize: 40 }}>
                {FALLBACK_ICON[selectedResult.type] ?? '🎬'}
              </Text>
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {selectedResult.type === 'tv' ? 'TV' : 'Movie'}
            </Text>
            {selectedResult.releaseYear ? (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {selectedResult.releaseYear}
              </Text>
            ) : null}
            {selectedDetail?.imdbRating && selectedDetail.imdbRating !== 'N/A' && (
              <Text style={[typography.labelBold, { color: '#854D0E', marginTop: spacing.xs }]}>
                IMDb {selectedDetail.imdbRating}
              </Text>
            )}
            {detailLoading && (
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>
                Loading details...
              </Text>
            )}
          </View>
        </View>

        {/* Plot snippet */}
        {selectedDetail?.plot && selectedDetail.plot !== 'N/A' && (
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.md },
            ]}
            numberOfLines={3}
          >
            {selectedDetail.plot}
          </Text>
        )}

        {/* Add button */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Add to Collection"
            onPress={handleAddToCollection}
            variant="primary"
            size="lg"
            loading={addMedia.isPending}
            disabled={addMedia.isPending}
          />
          {addMedia.error ? (
            <Text
              style={[
                typography.caption,
                { color: colors.danger, marginTop: spacing.sm, textAlign: 'center' },
              ]}
              accessibilityRole="alert"
            >
              {addMedia.error instanceof Error
                ? addMedia.error.message
                : 'Failed to add media'}
            </Text>
          ) : null}
        </View>
      </View>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────

  const hasQuery = searchQuery.trim().length > 0
  const showResults = hasQuery && searchResults && searchResults.length > 0
  const showEmpty = hasQuery && searchResults && searchResults.length === 0 && !isSearching

  return (
    <Screen title="Add Media" scrollable={false}>
      {/* Search input */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search OMDb..."
          placeholderTextColor={colors.textTertiary}
          style={[
            typography.body,
            styles.searchInput,
            { color: colors.text },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search OMDb"
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
      </View>

      {/* Error state */}
      {isSearchError ? (
        <ErrorState
          message={searchError?.message ?? 'Search failed'}
          onRetry={() => refetch()}
        />
      ) : null}

      {/* Results */}
      {showResults ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `omdb-${item.omdbId}`}
            renderItem={renderResultCard}
            ListHeaderComponent={
              <Text
                style={[
                  typography.labelBold,
                  { color: colors.textSecondary, marginBottom: spacing.sm },
                ]}
              >
                Results ({searchResults.length})
              </Text>
            }
            ListFooterComponent={renderDetailPreview}
            contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : showEmpty ? (
        <EmptyState message={`No results for "${searchQuery.trim()}".`} />
      ) : !hasQuery ? (
        <EmptyState message="Search for movies and TV shows to add to your collection." />
      ) : isSearching ? (
        // Skeleton results while searching
        <View>
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <View style={styles.resultRow}>
                <Skeleton width={50} height={75} borderRadius={4} />
                <View style={[styles.resultInfo, { gap: 6 }]}>
                  <Skeleton width="80%" height={16} />
                  <Skeleton width="40%" height={12} />
                  <Skeleton width="100%" height={12} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
  },
  resultCard: {
    borderWidth: 1,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resultPoster: {
    width: 50,
    height: 75,
  },
  resultInfo: {
    flex: 1,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typeBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 18,
  },
  preview: {},
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  closePreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewPoster: {
    width: 100,
    height: 150,
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
})
