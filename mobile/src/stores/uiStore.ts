import { create } from 'zustand'

interface UIState {
  theme: 'light' | 'dark'
  reducedMotion: boolean
  setTheme: (theme: 'light' | 'dark') => void
  setReducedMotion: (reduced: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  reducedMotion: false,
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  setReducedMotion: (reduced: boolean) => set({ reducedMotion: reduced }),
}))
