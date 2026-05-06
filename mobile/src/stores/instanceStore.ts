import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const INSTANCE_STORE_KEY = 'tabletop-current-instance-id'

interface InstanceState {
  currentInstanceId: string | null
  isHydrated: boolean
  setCurrentInstance: (id: string | null) => void
  _hydrate: (id: string | null) => void
}

export const useInstanceStore = create<InstanceState>((set) => ({
  currentInstanceId: null,
  isHydrated: false,

  setCurrentInstance: (id: string | null) => {
    set({ currentInstanceId: id })
    if (id !== null) {
      void SecureStore.setItemAsync(INSTANCE_STORE_KEY, id)
    } else {
      void SecureStore.deleteItemAsync(INSTANCE_STORE_KEY)
    }
  },

  _hydrate: (id: string | null) => {
    set({ currentInstanceId: id, isHydrated: true })
  },
}))
