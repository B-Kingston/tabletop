import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

interface TabBarIconProps {
  /** Text label shown below the icon dot */
  label?: string
  /** Whether this tab is currently active */
  focused: boolean
  /** Short text or emoji to display as the icon */
  icon: string
}

/**
 * Placeholder tab bar icon component.
 * Renders a colored dot with a text label.
 * Vector icons will replace this in a later stage.
 */
export function TabBarIcon({ label, focused, icon }: TabBarIconProps) {
  const { colors, spacing } = useTheme()

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: focused ? colors.primary : colors.surfaceSecondary,
            marginBottom: spacing.xs,
          },
        ]}
      >
        <Text
          style={[
            styles.iconText,
            { color: focused ? '#FFFFFF' : colors.textSecondary },
          ]}
          accessibilityRole="none"
        >
          {icon}
        </Text>
      </View>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: focused ? colors.primary : colors.textTertiary,
              fontWeight: focused ? '600' : '400',
            },
          ]}
          accessibilityRole="none"
        >
          {label}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
  },
})
