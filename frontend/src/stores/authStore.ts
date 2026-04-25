import { create } from 'zustand'

interface AuthState {
  hasSynced: boolean
  setHasSynced: (synced: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  hasSynced: false,
  setHasSynced: (synced) => set({ hasSynced: synced }),
}))
