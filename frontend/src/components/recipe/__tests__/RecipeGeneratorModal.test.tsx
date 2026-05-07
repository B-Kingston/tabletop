import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/__tests__/setup'
import { RecipeGeneratorModal } from '../RecipeGeneratorModal'

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RecipeGeneratorModal open onClose={vi.fn()} instanceId="inst-1" />
    </QueryClientProvider>
  )
}

describe('RecipeGeneratorModal', () => {
  it('sends simplicity and previews sources as a compact favicon pill', async () => {
    const user = userEvent.setup()
    let requestBody: { prompt?: string; simplicity?: number } | null = null

    server.use(
      http.post('*/v1/instances/:instanceId/recipes/generate', async ({ request }) => {
        requestBody = await request.json() as { prompt?: string; simplicity?: number }
        return HttpResponse.json({
          data: {
            title: 'Lemon Pasta',
            description: 'A bright weeknight pasta.',
            prepTime: 10,
            cookTime: 15,
            servings: 2,
            sourceUrls: [
              'https://example.com/lemon-pasta',
              'https://example.com/pasta-water',
              'https://example.org/too-many',
            ],
            sources: [
              { title: 'Lemon Pasta Method', url: 'https://example.com/lemon-pasta' },
              { title: 'Pasta Water Tips', url: 'https://example.com/pasta-water' },
              { title: 'Extra Source', url: 'https://example.org/too-many' },
            ],
            ingredients: [{ name: 'spaghetti', quantity: '200', unit: 'g', optional: false }],
            steps: [
              { content: 'Boil pasta until al dente.', durationMin: 10 },
              { content: 'Toss with lemon and olive oil.', durationMin: 5 },
            ],
            tags: ['pasta', 'quick'],
          },
          error: null,
        })
      })
    )

    renderModal()

    await user.type(screen.getByLabelText(/what would you like to cook/i), 'quick pasta')
    fireEvent.change(screen.getByLabelText(/recipe simplicity/i), { target: { value: '1' } })
    await user.click(screen.getByRole('button', { name: /generate recipe/i }))

    expect(await screen.findByText('Lemon Pasta')).toBeInTheDocument()
    expect(requestBody).toEqual({ prompt: 'quick pasta', simplicity: 1 })
    expect(screen.getByText('A bright weeknight pasta.')).toBeInTheDocument()
    expect(screen.getByText(/spaghetti/)).toBeInTheDocument()
    expect(screen.getByText(/Boil pasta until al dente/)).toBeInTheDocument()
    expect(screen.getByLabelText(/3 sources searched/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Lemon Pasta Method/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Sources searched')).not.toBeInTheDocument()
  })
})
