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
import { useTMDBSearch, useTMDBMovieDetails, useTMDBTVDetails } from '@/hooks/useTMDB'
import { useAddMedia } from '@/hooks/useMedia'
import { getMediaLabel } from '@tabletop/shared'

import type { TMDBSearchResult } from '@tabletop/shared'

// ── Constants ─────────────────────────────────────────────────────────────

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w200'
const TMDB_POSTER_LARGE_BASE = 'https://image.tmdb.org/t/p/w342'

const FALLBACK_ICON: Record<string, string> = {
  movie: '🎬',
  tv: '📺',
}

/**
 * Media create screen — TMDB search + add flow.
 */
export default function MediaCreateScreen() {
  const { id: instanceId } = useLocalSearchParams<{ id: string }>()
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResult, setSelectedResult] = useState<TMDBSearchResult | null>(null)

  const {
    data: searchResults,
    isLoading: isSearching,
    isError: isSearchError,
    error: searchError,
    refetch,
  } = useTMDBSearch(instanceId, searchQuery, 1)

  const addMedia = useAddMedia(instanceId)

  // When a result is selected, show its detail preview
  const selectedTmdbId = selectedResult?.id ?? 0
  const selectedType = selectedResult?.media_type === 'tv'
    ? 'tv'
    : selectedResult?.media_type === 'movie'
      ? 'movie'
      : null

  const {
    data: movieDetails,
    isLoading: isLoadingMovie,
  } = useTMDBMovieDetails(instanceId, selectedType === 'movie' ? selectedTmdbId : 0)

  const {
    data: tvDetails,
    isLoading: isLoadingTV,
  } = useTMDBTVDetails(instanceId, selectedType === 'tv' ? selectedTmdbId : 0)

  const detailData = selectedType === 'movie' ? movieDetails : tvDetails
  const isLoadingDetail = selectedType === 'movie' ? isLoadingMovie : isLoadingTV

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSelectResult = useCallback((result: TMDBSearchResult) => {
    setSelectedResult(result)
  }, [])

  const handleAddToCollection = useCallback(() => {
    if (!selectedResult) return

    const releaseDate =
      selectedResult.release_date || selectedResult.first_air_date || undefined
    const displayTitle = getMediaLabel(
      selectedResult.media_type === 'tv' ? 'tv' : 'movie',
      selectedResult.title ?? '',
      selectedResult.name ?? undefined,
    )

    addMedia.mutate(
      {
        tmdbId: selectedResult.id,
        type: selectedResult.media_type === 'tv' ? 'tv' : 'movie',
        title: displayTitle,
        overview: selectedResult.overview || undefined,
        posterPath: selectedResult.poster_path || undefined,
        releaseDate,
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
    ({ item }: { item: TMDBSearchResult }) => {
      const posterUri = item.poster_path
        ? `${TMDB_POSTER_BASE}${item.poster_path}`
        : null
      const displayTitle = getMediaLabel(
        item.media_type === 'tv' ? 'tv' : 'movie',
        item.title ?? '',
        item.name ?? undefined,
      )
      const year = item.release_date
        ? item.release_date.slice(0, 4)
        : item.first_air_date
          ? item.first_air_date.slice(0, 4)
          : null
      const typeLabel = item.media_type === 'tv' ? 'TV' : 'Movie'
      const isSelected = selectedResult?.id === item.id

      return (
        <TouchableOpacity
          onPress={() => handleSelectResult(item)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${displayTitle}`}
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
            {posterUri ? (
              <Image
                source={{ uri: posterUri }}
                style={[styles.resultPoster, { borderRadius: 4 }]}
                contentFit="cover"
                transition={200}
              />
            ) : (
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
                  {FALLBACK_ICON[item.media_type === 'tv' ? 'tv' : 'movie'] ?? '🎬'}
                </Text>
              </View>
            )}
            <View style={styles.resultInfo}>
              <Text style={[typography.bodyBold, { color: colors.text }]} numberOfLines={2}>
                {displayTitle}
              </Text>
              <View style={[styles.resultMeta, { marginTop: spacing.xs }]}>
                {year ? (
                  <Text style={[typography.label, { color: colors.textSecondary }]}>
                    {year}
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
                {item.vote_average > 0 ? (
                  <Text style={[typography.label, { color: colors.warning }]}>
                    ★ {item.vote_average.toFixed(1)}
                  </Text>
                ) : null}
              </View>
              {item.overview ? (
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginTop: spacing.xs },
                  ]}
                  numberOfLines={2}
                >
                  {item.overview}
                </Text>
              ) : null}
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

    const displayTitle = getMediaLabel(
      selectedResult.media_type === 'tv' ? 'tv' : 'movie',
      selectedResult.title ?? '',
      selectedResult.name ?? undefined,
    )
    const posterUri = selectedResult.poster_path
      ? `${TMDB_POSTER_LARGE_BASE}${selectedResult.poster_path}`
      : null
    const year = selectedResult.release_date
      ? selectedResult.release_date.slice(0, 4)
      : selectedResult.first_air_date
        ? selectedResult.first_air_date.slice(0, 4)
        : null

    // Additional details from the TMDB detail endpoint
    const extraInfo =
      detailData && 'runtime' in detailData
        ? `${detailData.runtime} min`
        : detailData && 'number_of_seasons' in detailData
          ? `${detailData.number_of_seasons} season${detailData.number_of_seasons !== 1 ? 's' : ''}`
          : null

    const genres =
      detailData?.genres && detailData.genres.length > 0
        ? detailData.genres.map((g) => g.name).join(', ')
        : null

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
            {displayTitle}
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
          {posterUri ? (
            <Image
              source={{ uri: posterUri }}
              style={[styles.previewPoster, { borderRadius: 8 }]}
              contentFit="cover"
              transition={300}
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
                {FALLBACK_ICON[selectedResult.media_type === 'tv' ? 'tv' : 'movie'] ?? '🎬'}
              </Text>
            </View>
          )}
          <View style={styles.previewInfo}>
            {year ? (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {year}
              </Text>
            ) : null}
            {selectedResult.vote_average > 0 ? (
              <Text style={[typography.caption, { color: colors.warning, marginTop: spacing.xs }]}>
                ★ {selectedResult.vote_average.toFixed(1)} / 10
              </Text>
            ) : null}
            {isLoadingDetail ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.sm }} />
            ) : extraInfo ? (
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {extraInfo}
              </Text>
            ) : null}
            {!isLoadingDetail && genres ? (
              <Text style={[typography.label, { color: colors.textTertiary, marginTop: spacing.xs }]}>
                {genres}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Overview */}
        {selectedResult.overview ? (
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: spacing.md },
            ]}
          >
            {selectedResult.overview}
          </Text>
        ) : null}

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
          placeholder="Search TMDB..."
          placeholderTextColor={colors.textTertiary}
          style={[
            typography.body,
            styles.searchInput,
            { color: colors.text },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search TMDB"
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
            keyExtractor={(item) => `tmdb-${item.id}-${item.media_type ?? 'unknown'}`}
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
