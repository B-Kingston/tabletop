import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

import { useTheme } from '@/theme'
import { Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useCreateInstance } from '@/hooks/useInstances'
import { isValidInstanceName, isValidPassword } from '@tabletop/shared'

export default function CreateGroupScreen() {
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const createInstance = useCreateInstance()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const isSubmitting = createInstance.isPending

  const handleSubmit = () => {
    setNameError(null)
    setPasswordError(null)

    let hasError = false

    if (!isValidInstanceName(name)) {
      setNameError('Group name is required (max 100 characters)')
      hasError = true
    }

    if (!isValidPassword(password)) {
      setPasswordError('Password must be at least 4 characters')
      hasError = true
    }

    if (hasError) return

    createInstance.mutate(
      { name: name.trim(), password },
      {
        onSuccess: () => {
          router.back()
        },
        onError: (err) => {
          // Show any API-level errors on the name field
          setNameError(err.message || 'Failed to create group')
        },
      },
    )
  }

  return (
    <Screen title="Create Group" scrollable={false}>
      <View style={styles.content}>
        {/* Server error banner */}
        {createInstance.error ? (
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
              {createInstance.error instanceof Error
                ? createInstance.error.message
                : 'An unexpected error occurred'}
            </Text>
          </View>
        ) : null}

        <TextField
          label="Group Name"
          value={name}
          onChangeText={(text) => {
            setName(text)
            if (nameError) setNameError(null)
          }}
          placeholder="My Game Night"
          error={nameError ?? undefined}
          editable={!isSubmitting}
        />

        <TextField
          label="Join Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            if (passwordError) setPasswordError(null)
          }}
          placeholder="At least 4 characters"
          secureTextEntry
          error={passwordError ?? undefined}
          editable={!isSubmitting}
        />

        <View style={[styles.actions, { marginTop: spacing.xl }]}>
          <Button
            title="Create Group"
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
