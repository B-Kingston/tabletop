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
import { useSignIn } from '@clerk/clerk-expo'

import { useTheme } from '@/theme'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'

export default function SignInScreen() {
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const { signIn, setActive, isLoaded } = useSignIn()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return

    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }

    setIsSubmitting(true)
    try {
      const completeSignIn = await signIn.create({
        identifier: email.trim(),
        password,
      })

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId })
        router.replace('/(app)')
      } else {
        setError('Sign-in is not complete. Please try again.')
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message || 'Sign-in failed. Please check your credentials.')
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
          {/* Logo / Title */}
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
              Sign in to continue
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
            placeholder="Your password"
            secureTextEntry
            editable={!isSubmitting}
          />

          <Button
            title={isSubmitting ? 'Signing in…' : 'Sign In'}
            onPress={handleSignIn}
            disabled={isSubmitting}
            loading={isSubmitting}
            size="lg"
          />

          {/* Create account link */}
          <View style={[styles.footer, { marginTop: spacing['2xl'] }]}>
            <Text
              style={[typography.body, { color: colors.textSecondary }]}
            >
              Don't have an account?
            </Text>
            <Button
              title="Create account"
              onPress={() => router.push('/(auth)/sign-up')}
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
