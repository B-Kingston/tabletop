/** Standard spacing scale (multiples of 4) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const

export type SpacingScale = typeof spacing
export type SpacingKey = keyof SpacingScale
