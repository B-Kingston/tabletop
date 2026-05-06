import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

interface IconButtonProps {
  /** Icon component or text label */
  children: React.ReactNode
  onPress: () => void
  accessibilityLabel: string
  disabled?: boolean
  variant?: 'default' | 'ghost'
}

export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  disabled = false,
  variant = 'default',
}: IconButtonProps) {
  const { colors } = useTheme()

  const bg =
    variant === 'ghost'
      ? 'transparent'
      : disabled
        ? colors.surfaceSecondary
        : colors.surfaceSecondary

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      {children}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
