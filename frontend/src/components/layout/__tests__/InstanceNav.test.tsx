import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstanceNav } from '../InstanceNav'
import type { ReactNode } from 'react'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useMatchRoute: () => () => false,
}))

describe('InstanceNav', () => {
  it('separates member messages from AI assistant', () => {
    render(<InstanceNav instanceId="inst-1" />)

    expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ai assistant/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^chat$/i })).not.toBeInTheDocument()
  })
})
