import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors, spacing, typography } = useTheme()

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text
        style={[typography.body, { color: colors.danger, textAlign: 'center' }]}
        accessibilityRole="text"
      >
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={[styles.retryButton, { marginTop: spacing.lg }]}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>
            Retry
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
  retryButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
