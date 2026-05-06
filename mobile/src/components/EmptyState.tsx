import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme()

  return (
    <View style={styles.container} accessibilityRole="none">
      <Text
        style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}
        accessibilityRole="text"
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={[styles.actionButton, { marginTop: spacing.lg }]}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  actionButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
