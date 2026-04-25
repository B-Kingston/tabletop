import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  theme: 'light' | 'dark'
  toasts: Toast[]
  activeModal: string | null
  setTheme: (theme: 'light' | 'dark') => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setActiveModal: (modal: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  toasts: [],
  activeModal: null,
  setTheme: (theme) => set({ theme }),
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setActiveModal: (modal) => set({ activeModal: modal }),
}))
