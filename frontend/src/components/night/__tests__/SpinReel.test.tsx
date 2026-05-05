import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SpinReel } from '../SpinReel'
import { Wine } from 'lucide-react'

describe('SpinReel', () => {
  it('shows category icon when idle', () => {
    render(
      <SpinReel
        icon={Wine}
        label="Wine"
        items={[{ id: '1', name: 'Barolo' }]}
        finalItem={null}
        isSpinning={false}
        stopDelayMs={0}
        onSettled={vi.fn()}
      />
    )
    expect(screen.getByText('Wine')).toBeInTheDocument()
  })

  it('shows final item name when settled', () => {
    render(
      <SpinReel
        icon={Wine}
        label="Wine"
        items={[{ id: '1', name: 'Barolo' }]}
        finalItem={{ id: '1', name: 'Barolo' }}
        isSpinning={false}
        stopDelayMs={0}
        onSettled={vi.fn()}
      />
    )
    expect(screen.getByText('Barolo')).toBeInTheDocument()
  })

  it('calls onSettled after spin completes', async () => {
    const onSettled = vi.fn()
    render(
      <SpinReel
        icon={Wine}
        label="Wine"
        items={[{ id: '1', name: 'Barolo' }]}
        finalItem={{ id: '1', name: 'Barolo' }}
        isSpinning={true}
        stopDelayMs={50}
        onSettled={onSettled}
      />
    )
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1), { timeout: 200 })
  })
})
