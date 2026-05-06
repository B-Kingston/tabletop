import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../theme'

interface ScreenProps {
  title?: string
  children: React.ReactNode
  scrollable?: boolean
  rightAction?: React.ReactNode
}

export function Screen({
  title,
  children,
  scrollable = true,
  rightAction,
}: ScreenProps) {
  const { colors, spacing, typography } = useTheme()

  const headerNode = title ? (
    <View
      style={[
        styles.header,
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      <Text
        style={[typography.h2, { color: colors.text, flex: 1 }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {rightAction ? <View>{rightAction}</View> : null}
    </View>
  ) : null

  const contentContainerStyle: ViewStyle = scrollable
    ? { flexGrow: 1, padding: spacing.lg }
    : { flex: 1, padding: spacing.lg }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {headerNode}
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentContainerStyle}>{children}</View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
})
