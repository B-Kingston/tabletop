import { create } from 'zustand'

interface InstanceState {
  currentInstanceId: string | null
  sidebarOpen: boolean
  setCurrentInstance: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useInstanceStore = create<InstanceState>((set) => ({
  currentInstanceId: null,
  sidebarOpen: true,
  setCurrentInstance: (id) => set({ currentInstanceId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
