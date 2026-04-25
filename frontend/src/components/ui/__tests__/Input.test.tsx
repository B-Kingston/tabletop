import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '../Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Test input" />)
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Test" />)
    expect(screen.getByPlaceholderText('Test')).toHaveClass('custom-class')
  })

  it('passes type prop', () => {
    render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
  })
})
