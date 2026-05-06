import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo'

import { useTheme } from '@/theme'
import { Screen } from '@/components/Screen'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'

export default function ProfileScreen() {
  const { colors, spacing, typography } = useTheme()
  const router = useRouter()
  const { user, isLoaded: isUserLoaded } = useUser()
  const { signOut } = useClerkAuth()

  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      // Router redirect is handled by (app)/_layout.tsx guard
    } catch {
      setIsSigningOut(false)
    }
  }

  if (!isUserLoaded) {
    return (
      <Screen title="Profile">
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.profileHeader}>
            <Skeleton
              width={64}
              height={64}
              borderRadius={32}
            />
            <View style={styles.profileInfo}>
              <Skeleton height={20} width="60%" />
              <Skeleton
                height={14}
                width="80%"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        </Card>
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen title="Profile">
        <View style={styles.centered}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Unable to load profile.
          </Text>
          <Button
            title="Go back"
            onPress={() => router.back()}
            variant="ghost"
            size="md"
          />
        </View>
      </Screen>
    )
  }

  const displayName =
    user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'User'
  const email = user.primaryEmailAddress?.emailAddress ?? ''

  return (
    <Screen title="Profile">
      {/* User info card */}
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={styles.profileHeader}>
          {user.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={[
                styles.avatar,
                { borderColor: colors.border },
              ]}
              accessibilityLabel={`${displayName}'s avatar`}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text
                style={[typography.h2, { color: colors.primaryDark }]}
              >
                {(displayName.charAt(0) ?? '?').toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text
              style={[typography.h3, { color: colors.text }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {email ? (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, marginTop: spacing.xs },
                ]}
              >
                {email}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      {/* Settings section */}
      <Card style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.labelBold,
            {
              color: colors.textSecondary,
              marginBottom: spacing.md,
              textTransform: 'uppercase',
            },
          ]}
        >
          Account
        </Text>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[typography.body, { color: colors.text }]}>
            User ID
          </Text>
          <Text
            style={[typography.caption, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {user.id}
          </Text>
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[typography.body, { color: colors.text }]}>
            Email
          </Text>
          <Text
            style={[typography.caption, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {email}
          </Text>
        </View>
      </Card>

      {/* Sign out */}
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="danger"
        disabled={isSigningOut}
        loading={isSigningOut}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
})
