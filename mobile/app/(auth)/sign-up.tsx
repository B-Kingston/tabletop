import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useSignUp } from '@clerk/clerk-expo'

import { useTheme } from '@/theme'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'

export default function SignUpScreen() {
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const { signUp, setActive, isLoaded } = useSignUp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return

    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const completeSignUp = await signUp.create({
        emailAddress: email.trim(),
        password,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        router.replace('/(app)')
      } else {
        setError('Sign-up is not complete. Please try again.')
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message || 'Sign-up failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.text }]}>
              Tabletop
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: spacing.sm },
              ]}
            >
              Create your account
            </Text>
          </View>

          {/* Error banner */}
          {error ? (
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
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSubmitting}
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            editable={!isSubmitting}
          />

          <Button
            title={isSubmitting ? 'Creating account…' : 'Create Account'}
            onPress={handleSignUp}
            disabled={isSubmitting}
            loading={isSubmitting}
            size="lg"
          />

          {/* Sign in link */}
          <View style={[styles.footer, { marginTop: spacing['2xl'] }]}>
            <Text
              style={[typography.body, { color: colors.textSecondary }]}
            >
              Already have an account?
            </Text>
            <Button
              title="Sign in"
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  footer: {
    alignItems: 'center',
  },
})
