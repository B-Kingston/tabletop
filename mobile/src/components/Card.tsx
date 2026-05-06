import React from 'react'
import {
  View,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'
import { useTheme } from '../theme'

interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
}

export function Card({ children, onPress, style }: CardProps) {
  const { colors, spacing } = useTheme()

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow on iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // Elevation on Android
    elevation: 2,
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View style={[cardStyle, style]}>{children}</View>
}
