import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('panel-layout')).toBeInTheDocument()
  })

  it('shows the empty state on initial load', () => {
    render(<App />)
    expect(screen.getByText('Drag fields from the tree to start exploring')).toBeInTheDocument()
  })
})
