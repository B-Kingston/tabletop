import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'

import { useTheme } from '@/theme'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { Skeleton } from '@/components/Skeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { useInstances, useLeaveInstance } from '@/hooks/useInstances'
import { useInstanceStore } from '@/stores/instanceStore'

import type { Instance } from '@tabletop/shared'

export default function GroupsScreen() {
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const setCurrentInstance = useInstanceStore((s) => s.setCurrentInstance)

  const {
    data: instances,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useInstances()

  const leaveInstance = useLeaveInstance()

  const handleTapGroup = useCallback(
    (instance: Instance) => {
      setCurrentInstance(instance.id)
      router.push(`/(app)/instances/${instance.id}/(tabs)/recipes`)
    },
    [router, setCurrentInstance],
  )

  const handleLeaveGroup = useCallback(
    (instance: Instance) => {
      Alert.alert(
        'Leave group',
        `Are you sure you want to leave "${instance.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              leaveInstance.mutate({ instanceId: instance.id })
            },
          },
        ],
      )
    },
    [leaveInstance],
  )

  const renderInstance = useCallback(
    ({ item }: { item: Instance }) => (
      <Card
        onPress={() => handleTapGroup(item)}
        style={{ marginBottom: spacing.md }}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text
              style={[typography.h3, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.owner ? (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, marginTop: spacing.xs },
                ]}
              >
                Owned by {item.owner.name}
              </Text>
            ) : null}
            {item.members ? (
              <Text
                style={[
                  typography.label,
                  { color: colors.textTertiary, marginTop: spacing.xs },
                ]}
              >
                {item.members.length} member{item.members.length !== 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>

          <IconButton
            onPress={() => handleLeaveGroup(item)}
            accessibilityLabel={`Leave ${item.name}`}
            variant="ghost"
          >
            <Text style={[typography.label, { color: colors.danger }]}>
              Leave
            </Text>
          </IconButton>
        </View>
      </Card>
    ),
    [
      colors,
      spacing,
      typography,
      handleTapGroup,
      handleLeaveGroup,
    ],
  )

  const keyExtractor = useCallback((item: Instance) => item.id, [])

  // Loading state — skeleton cards
  if (isLoading) {
    return (
      <Screen title="Groups">
        {[1, 2, 3].map((i) => (
          <Card key={i} style={{ marginBottom: spacing.md }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={14} width="40%" style={{ marginTop: spacing.sm }} />
            <Skeleton height={12} width="30%" style={{ marginTop: spacing.xs }} />
          </Card>
        ))}
      </Screen>
    )
  }

  // Error state
  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load groups'
    return (
      <Screen title="Groups">
        <ErrorState message={errorMessage} onRetry={() => refetch()} />
      </Screen>
    )
  }

  const instanceList = instances ?? []

  return (
    <Screen
      title="Groups"
      rightAction={
        <View style={styles.headerActions}>
          <Button
            title="Join"
            onPress={() => router.push('/(app)/join-group')}
            variant="ghost"
            size="sm"
          />
          <Button
            title="+"
            onPress={() => router.push('/(app)/create-group')}
            size="sm"
            accessibilityLabel="Create group"
          />
        </View>
      }
    >
      <FlatList
        data={instanceList}
        renderItem={renderInstance}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <EmptyState
            message="No groups yet"
            actionLabel="Create your first group"
            onAction={() => router.push('/(app)/create-group')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          instanceList.length === 0 ? styles.emptyContainer : undefined
        }
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
})
