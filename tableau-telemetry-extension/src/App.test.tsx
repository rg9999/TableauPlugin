import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('Tableau Telemetry Extension')).toBeInTheDocument()
  })

  it('wraps content in MUI ThemeProvider', () => {
    const { container } = render(<App />)
    // CssBaseline injects a style element — verify it exists
    const styles = container.ownerDocument.querySelectorAll('style')
    expect(styles.length).toBeGreaterThan(0)
  })
})
