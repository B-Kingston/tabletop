import React from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

interface TextFieldProps {
  label?: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  error?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  accessibilityLabel?: string
  editable?: boolean
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  accessibilityLabel,
  editable = true,
}: TextFieldProps) {
  const { colors, spacing, typography } = useTheme()

  const inputAccessibilityLabel = accessibilityLabel ?? label ?? placeholder ?? ''

  return (
    <View style={[styles.container, { marginBottom: spacing.lg }]}>
      {label ? (
        <Text
          style={[
            typography.labelBold,
            { color: colors.textSecondary, marginBottom: spacing.xs },
          ]}
          accessibilityRole="none"
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        accessibilityLabel={inputAccessibilityLabel}
        accessibilityRole="none"
        style={[
          typography.body,
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
          },
        ]}
      />
      {error ? (
        <Text
          style={[
            typography.label,
            { color: colors.danger, marginTop: spacing.xs },
          ]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
  input: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
  },
})
