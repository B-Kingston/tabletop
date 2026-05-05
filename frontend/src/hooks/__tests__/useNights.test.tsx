import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNights, useNight, useCreateNight, useUpdateNight, useDeleteNight } from '../useNights'
import { ReactNode } from 'react'

const mockNight = {
  id: 'night-1',
  instanceId: 'inst-1',
  name: 'Barolo & Bolognese Night',
  wineId: 'wine-1',
  recipeId: 'recipe-1',
  mediaId: null,
  createdById: 'user-1',
  updatedById: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockNightList = [mockNight]

let shouldError = false

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (shouldError) return Promise.reject(new Error('Network error'))
      if (url.includes('/nights/night-1')) {
        return Promise.resolve({ data: { data: mockNight } })
      }
      if (url.includes('/nights')) {
        return Promise.resolve({ data: { data: mockNightList } })
      }
      return Promise.resolve({ data: { data: null } })
    }),
    post: vi.fn(() =>
      shouldError
        ? Promise.reject(new Error('Network error'))
        : Promise.resolve({
            data: {
              data: {
                id: 'night-new',
                instanceId: 'inst-1',
                name: 'Test Night',
                wineId: null,
                recipeId: null,
                mediaId: null,
                createdById: 'user-1',
                updatedById: 'user-1',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
            },
          })
    ),
    patch: vi.fn(() =>
      shouldError
        ? Promise.reject(new Error('Network error'))
        : Promise.resolve({
            data: {
              data: {
                ...mockNight,
                name: 'Updated Night',
              },
            },
          })
    ),
    delete: vi.fn(() =>
      shouldError ? Promise.reject(new Error('Network error')) : Promise.resolve({ data: { data: null } })
    ),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useNights', () => {
  beforeEach(() => {
    shouldError = false
  })

  it('returns a list of nights', async () => {
    const { result } = renderHook(() => useNights('inst-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].name).toBe('Barolo & Bolognese Night')
  })

  it('create returns new night', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateNight('inst-1'), {
      wrapper,
    })

    result.current.mutate({ name: 'Test Night' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Test Night')
  })

  it('delete succeeds', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useDeleteNight('inst-1'), {
      wrapper,
    })

    result.current.mutate('night-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useNight', () => {
  beforeEach(() => {
    shouldError = false
  })

  it('returns a single night', async () => {
    const { result } = renderHook(() => useNight('inst-1', 'night-1'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Barolo & Bolognese Night')
    expect(result.current.data?.id).toBe('night-1')
  })
})

describe('useUpdateNight', () => {
  beforeEach(() => {
    shouldError = false
  })

  it('updates a night and returns updated data', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useUpdateNight('inst-1'), {
      wrapper,
    })

    result.current.mutate({
      nightId: 'night-1',
      name: 'Updated Night',
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Updated Night')
  })

  it('rolls back optimistic update on error', async () => {
    const wrapper = createWrapper()

    // First: load the list successfully
    const { result: listResult } = renderHook(() => useNights('inst-1'), {
      wrapper,
    })
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true))
    const originalName = listResult.current.data?.[0].name
    expect(originalName).toBe('Barolo & Bolognese Night')

    // Now enable error mode for the mutation
    shouldError = true

    const { result: updateResult } = renderHook(() => useUpdateNight('inst-1'), {
      wrapper,
    })

    updateResult.current.mutate({
      nightId: 'night-1',
      name: 'Should Rollback',
    })

    await waitFor(() => expect(updateResult.current.isError).toBe(true))
    // After error, cache should be restored to original
    expect(listResult.current.data?.[0].name).toBe('Barolo & Bolognese Night')
  })
})

describe('useCreateNight error rollback', () => {
  beforeEach(() => {
    shouldError = false
  })

  it('restores cache on mutation error', async () => {
    const wrapper = createWrapper()

    // First: load the list successfully
    const { result: listResult } = renderHook(() => useNights('inst-1'), {
      wrapper,
    })
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true))
    const originalLength = listResult.current.data?.length
    expect(originalLength).toBe(1)

    // Now enable error mode for the mutation
    shouldError = true

    const { result: createResult } = renderHook(() => useCreateNight('inst-1'), {
      wrapper,
    })

    createResult.current.mutate({ name: 'Should Fail' })

    await waitFor(() => expect(createResult.current.isError).toBe(true))
    // Optimistic entry should have been rolled back
    expect(listResult.current.data?.length).toBe(1)
  })
})
