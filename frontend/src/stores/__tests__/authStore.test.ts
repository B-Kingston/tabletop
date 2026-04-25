import { describe, it, expect } from 'vitest'
import { useAuthStore } from '../authStore'

describe('authStore', () => {
  it('should initialize with hasSynced false', () => {
    const state = useAuthStore.getState()
    expect(state.hasSynced).toBe(false)
  })

  it('should set hasSynced', () => {
    useAuthStore.getState().setHasSynced(true)
    expect(useAuthStore.getState().hasSynced).toBe(true)
  })
})
