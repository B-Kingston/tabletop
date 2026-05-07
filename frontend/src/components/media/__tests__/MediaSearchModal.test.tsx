import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { server } from '@/__tests__/setup'
import { MediaSearchModal } from '../MediaSearchModal'

const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/v1`

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MediaSearchModal open onClose={vi.fn()} instanceId="inst-1" />
    </QueryClientProvider>
  )
}

describe('MediaSearchModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('searches OMDb and adds media with OMDb identifiers', async () => {
    const user = userEvent.setup()
    const addPayloads: unknown[] = []

    server.use(
      http.get(`${BASE}/instances/:instanceId/omdb/search`, ({ request, params }) => {
        const url = new URL(request.url)

        expect(params.instanceId).toBe('inst-1')
        expect(url.searchParams.get('q')).toBe('arrival')

        return HttpResponse.json({
          data: {
            page: 1,
            results: [
              {
                omdbId: 'tt2543164',
                title: 'Arrival',
                type: 'movie',
                releaseYear: '2016',
              },
            ],
            totalResults: 1,
          },
          error: null,
        })
      }),
      http.post(`${BASE}/instances/:instanceId/media`, async ({ request }) => {
        const body = await request.json()
        addPayloads.push(body)

        return HttpResponse.json({
          data: {
            id: 'media-new',
            instanceId: 'inst-1',
            omdbId: 'tt2543164',
            type: 'movie',
            title: 'Arrival',
            overview: '',
            releaseYear: '2016',
            planToWatchDate: null,
            status: 'planning',
            rating: null,
            review: '',
            createdById: 'user-1',
            updatedById: 'user-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          error: null,
        }, { status: 201 })
      })
    )

    renderModal()

    await user.type(screen.getByPlaceholderText(/search movies and tv shows/i), 'arrival')

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(await screen.findByText(/Arrival/)).toBeInTheDocument()
    expect(screen.getByText('(2016)')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add arrival/i }))

    await waitFor(() => {
      expect(addPayloads).toEqual([
        {
          omdbId: 'tt2543164',
          type: 'movie',
          title: 'Arrival',
          overview: '',
          releaseYear: '2016',
        },
      ])
    })
  })
})
