import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ArrayCellRenderer from './ArrayCellRenderer'
import type { ICellRendererParams } from 'ag-grid-community'

function makeParams(value: unknown): ICellRendererParams {
  return { value } as unknown as ICellRendererParams
}

describe('ArrayCellRenderer', () => {
  it('renders non-array values as plain text', () => {
    render(<ArrayCellRenderer {...makeParams(42)} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders null values as empty', () => {
    const { container } = render(<ArrayCellRenderer {...makeParams(null)} />)
    expect(container.textContent).toBe('')
  })

  it('renders array values as "[N items]" summary', () => {
    render(<ArrayCellRenderer {...makeParams([10, 20, 30])} />)
    expect(screen.getByText('[3 items]')).toBeInTheDocument()
  })

  it('shows popover with array elements on click', () => {
    render(<ArrayCellRenderer {...makeParams([100, 200])} />)
    fireEvent.click(screen.getByText('[2 items]'))
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('renders empty array as "[0 items]"', () => {
    render(<ArrayCellRenderer {...makeParams([])} />)
    expect(screen.getByText('[0 items]')).toBeInTheDocument()
  })
})
