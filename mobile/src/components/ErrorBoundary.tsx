import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { Button } from './Button'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Catches React render errors and shows a friendly error screen.
 * Includes a "Restart app" button that forces a remount (reloads via key).
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRestart = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} onRestart={this.handleRestart} />
    }

    return this.props.children
  }
}

/** Inner component so we can use hooks (useTheme). */
function ErrorScreen({
  error,
  onRestart,
}: {
  error: Error | null
  onRestart: () => void
}) {
  const { colors, spacing, typography } = useTheme()

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[typography.h1, { color: colors.danger, textAlign: 'center' }]}>
          Something went wrong
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.lg,
            },
          ]}
        >
          The app encountered an unexpected error.
        </Text>
        {error ? (
          <Text
            style={[
              typography.caption,
              {
                color: colors.textTertiary,
                textAlign: 'center',
                marginTop: spacing.md,
                paddingHorizontal: spacing.lg,
              },
            ]}
            numberOfLines={4}
          >
            {error.message}
          </Text>
        ) : null}
        <View style={{ marginTop: spacing['2xl'] }}>
          <Button
            title="Restart App"
            onPress={onRestart}
            variant="primary"
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
})
