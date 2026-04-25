import { describe, it, expect } from 'vitest'
import { useInstanceStore } from '../instanceStore'
import { useUIStore } from '../uiStore'
import { useAuthStore } from '../authStore'

describe('instanceStore', () => {
  it('should initialize with null instance and open sidebar', () => {
    const state = useInstanceStore.getState()
    expect(state.currentInstanceId).toBeNull()
    expect(state.sidebarOpen).toBe(true)
  })

  it('should set current instance', () => {
    useInstanceStore.getState().setCurrentInstance('inst-1')
    expect(useInstanceStore.getState().currentInstanceId).toBe('inst-1')
    useInstanceStore.getState().setCurrentInstance(null)
  })

  it('should toggle sidebar', () => {
    const initial = useInstanceStore.getState().sidebarOpen
    useInstanceStore.getState().toggleSidebar()
    expect(useInstanceStore.getState().sidebarOpen).toBe(!initial)
    useInstanceStore.getState().toggleSidebar()
  })

  it('should set sidebar open', () => {
    useInstanceStore.getState().setSidebarOpen(false)
    expect(useInstanceStore.getState().sidebarOpen).toBe(false)
    useInstanceStore.getState().setSidebarOpen(true)
    expect(useInstanceStore.getState().sidebarOpen).toBe(true)
  })
})

describe('uiStore', () => {
  it('should initialize with light theme and empty toasts', () => {
    const state = useUIStore.getState()
    expect(state.theme).toBe('light')
    expect(state.toasts).toEqual([])
    expect(state.activeModal).toBeNull()
  })

  it('should set theme', () => {
    useUIStore.getState().setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')
    useUIStore.getState().setTheme('light')
  })

  it('should add and remove toasts', () => {
    useUIStore.getState().addToast({ message: 'Test toast', type: 'info' })
    const toasts = useUIStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Test toast')
    expect(toasts[0].type).toBe('info')

    useUIStore.getState().removeToast(toasts[0].id)
    expect(useUIStore.getState().toasts).toHaveLength(0)
  })

  it('should set active modal', () => {
    useUIStore.getState().setActiveModal('create-instance')
    expect(useUIStore.getState().activeModal).toBe('create-instance')
    useUIStore.getState().setActiveModal(null)
    expect(useUIStore.getState().activeModal).toBeNull()
  })
})

describe('authStore', () => {
  it('should initialize with hasSynced false', () => {
    expect(useAuthStore.getState().hasSynced).toBe(false)
  })

  it('should set hasSynced', () => {
    useAuthStore.getState().setHasSynced(true)
    expect(useAuthStore.getState().hasSynced).toBe(true)
    useAuthStore.getState().setHasSynced(false)
  })
})
