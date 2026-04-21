import { describe, it, expect } from 'vitest'
import { useAuthStore } from '../authStore'

describe('authStore', () => {
  it('should initialize with null token', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
  })

  it('should set token', () => {
    useAuthStore.getState().setToken('test-token-123')
    expect(useAuthStore.getState().token).toBe('test-token-123')
  })

  it('should clear token', () => {
    useAuthStore.getState().setToken('test-token-123')
    useAuthStore.getState().setToken(null)
    expect(useAuthStore.getState().token).toBeNull()
  })
})