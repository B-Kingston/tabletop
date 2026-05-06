import { useColorScheme } from 'react-native'
import { light, dark } from './colors'
import { spacing } from './spacing'
import { typography } from './typography'
import { useUIStore } from '../stores/uiStore'

export function useTheme() {
  const systemScheme = useColorScheme()
  const themePreference = useUIStore((s) => s.theme)

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'light' ? false : systemScheme === 'dark')

  const colors = isDark ? dark : light

  return { colors, spacing, typography, isDark } as const
}

export { light, dark, spacing, typography }
export type { ColorPalette } from './colors'
export type Theme = ReturnType<typeof useTheme>
