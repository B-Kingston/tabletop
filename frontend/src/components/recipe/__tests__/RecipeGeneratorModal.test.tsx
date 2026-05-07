import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
  it('generates and previews a recipe from the recipes generate endpoint', async () => {
    const user = userEvent.setup()

    renderModal()

    await user.type(screen.getByLabelText(/what would you like to cook/i), 'quick pasta')
    await user.click(screen.getByRole('button', { name: /generate recipe/i }))

    expect(await screen.findByText('Lemon Pasta')).toBeInTheDocument()
    expect(screen.getByText('A bright weeknight pasta.')).toBeInTheDocument()
    expect(screen.getByText(/spaghetti/)).toBeInTheDocument()
    expect(screen.getByText(/Boil pasta until al dente/)).toBeInTheDocument()
  })
})
