import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

import { useTheme } from '@/theme'
import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useJoinInstance } from '@/hooks/useInstances'

/**
 * Basic UUID v4 format check.
 * Does not validate the UUID itself — the backend will reject invalid ones.
 */
function looksLikeUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export default function JoinGroupScreen() {
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const joinInstance = useJoinInstance()

  const [instanceId, setInstanceId] = useState('')
  const [password, setPassword] = useState('')
  const [idError, setIdError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const isSubmitting = joinInstance.isPending

  const handleSubmit = () => {
    setIdError(null)
    setPasswordError(null)

    let hasError = false

    if (!instanceId.trim() || !looksLikeUUID(instanceId.trim())) {
      setIdError('Enter a valid group ID (UUID format)')
      hasError = true
    }

    if (!password) {
      setPasswordError('Password is required')
      hasError = true
    }

    if (hasError) return

    joinInstance.mutate(
      { instanceId: instanceId.trim(), password },
      {
        onSuccess: () => {
          router.back()
        },
        onError: (err) => {
          const msg = err.message || 'Failed to join group'
          // Show server error prominently
          setIdError(msg)
        },
      },
    )
  }

  return (
    <Screen title="Join Group" scrollable={false}>
      <View style={styles.content}>
        {/* Server error banner */}
        {joinInstance.error && !idError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.danger + '15',
                borderColor: colors.danger,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text
              style={[typography.caption, { color: colors.danger }]}
              accessibilityRole="alert"
            >
              {joinInstance.error instanceof Error
                ? joinInstance.error.message
                : 'An unexpected error occurred'}
            </Text>
          </View>
        ) : null}

        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              marginBottom: spacing.lg,
              textAlign: 'center',
            },
          ]}
        >
          Enter the group ID and password shared by the group owner.
        </Text>

        <TextField
          label="Group ID"
          value={instanceId}
          onChangeText={(text) => {
            setInstanceId(text)
            if (idError) setIdError(null)
          }}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          autoCapitalize="none"
          error={idError ?? undefined}
          editable={!isSubmitting}
        />

        <TextField
          label="Group Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            if (passwordError) setPasswordError(null)
          }}
          placeholder="Group join password"
          secureTextEntry
          error={passwordError ?? undefined}
          editable={!isSubmitting}
        />

        <View style={[styles.actions, { marginTop: spacing.xl }]}>
          <Button
            title="Join Group"
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            size="lg"
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="ghost"
            disabled={isSubmitting}
            size="md"
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actions: {
    gap: 12,
  },
})
