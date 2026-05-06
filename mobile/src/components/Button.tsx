import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useTheme } from '../theme'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  size?: ButtonSize
  accessibilityLabel?: string
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme()

  const variantConfig: Record<
    ButtonVariant,
    { bg: string; fg: string; borderColor?: string }
  > = {
    primary: { bg: colors.primary, fg: '#FFFFFF' },
    secondary: {
      bg: colors.surfaceSecondary,
      fg: colors.text,
      borderColor: colors.border,
    },
    danger: { bg: colors.danger, fg: '#FFFFFF' },
    ghost: { bg: 'transparent', fg: colors.primary },
  }

  const sizeConfig: Record<
    ButtonSize,
    { pv: number; ph: number; fs: number }
  > = {
    sm: { pv: 8, ph: 12, fs: 14 },
    md: { pv: 12, ph: 20, fs: 16 },
    lg: { pv: 16, ph: 24, fs: 18 },
  }

  const v = variantConfig[variant]
  const s = sizeConfig[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.surfaceSecondary : v.bg,
          paddingVertical: s.pv,
          paddingHorizontal: s.ph,
          minHeight: 44,
          borderRadius: 8,
          borderWidth: v.borderColor ? 1 : 0,
          borderColor: v.borderColor,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            { color: disabled ? colors.textTertiary : v.fg, fontSize: s.fs },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
})
