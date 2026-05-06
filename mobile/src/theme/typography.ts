import { TextStyle, Platform } from 'react-native'

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
})

export const typography: Record<string, TextStyle> = {
  h1: { fontFamily, fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontFamily, fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontFamily, fontSize: 14, fontWeight: '400', lineHeight: 20 },
  captionBold: { fontFamily, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  label: { fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  labelBold: { fontFamily, fontSize: 12, fontWeight: '700', lineHeight: 16 },
} as const
