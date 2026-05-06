import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, type ViewStyle } from 'react-native'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useTheme } from '../theme'

interface SkeletonProps {
  width?: ViewStyle['width']
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const { colors } = useTheme()
  const reducedMotion = useReducedMotion()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.5)
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [reducedMotion, opacity])

  return (
    <Animated.View
      accessibilityRole="none"
      accessibilityLabel="Loading"
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceSecondary,
          opacity: reducedMotion ? 0.5 : opacity,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {},
})
