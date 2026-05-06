/** Light theme color palette */
export const light = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceSecondary: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  primary: '#6366F1',
  primaryLight: '#A5B4FC',
  primaryDark: '#4338CA',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const

/** Dark theme color palette */
export const dark = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',
  secondary: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  border: '#334155',
  borderLight: '#1E293B',
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const

export type ColorPalette = typeof light
