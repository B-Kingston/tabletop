import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

export function LoadingScreen() {
  const { colors } = useTheme()

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
