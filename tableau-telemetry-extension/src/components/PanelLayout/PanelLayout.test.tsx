import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import { muiTheme } from '../../theme/muiTheme'
import PanelLayout from './PanelLayout'

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={muiTheme}>{ui}</ThemeProvider>)
}

describe('PanelLayout', () => {
  it('renders the three-panel layout', () => {
    renderWithTheme(<PanelLayout />)
    expect(screen.getByTestId('panel-layout')).toBeInTheDocument()
    expect(screen.getByTestId('tree-panel')).toBeInTheDocument()
    expect(screen.getByTestId('grid-panel')).toBeInTheDocument()
    expect(screen.getByTestId('status-bar')).toBeInTheDocument()
  })

  it('shows empty state when no grid content', () => {
    renderWithTheme(<PanelLayout />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Drag fields from the tree to start exploring')).toBeInTheDocument()
  })

  it('renders tree content when provided', () => {
    renderWithTheme(<PanelLayout treeContent={<div>Tree Content</div>} />)
    expect(screen.getByText('Tree Content')).toBeInTheDocument()
  })

  it('renders grid content when provided', () => {
    renderWithTheme(<PanelLayout gridContent={<div>Grid Content</div>} />)
    expect(screen.getByText('Grid Content')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })

  it('does not show detail panel by default', () => {
    renderWithTheme(<PanelLayout />)
    expect(screen.queryByTestId('detail-panel')).not.toBeInTheDocument()
  })

  it('shows detail panel when detailOpen is true', () => {
    renderWithTheme(
      <PanelLayout detailOpen={true} detailContent={<div>Detail Content</div>} />,
    )
    expect(screen.getByTestId('detail-panel')).toBeInTheDocument()
    expect(screen.getByText('Detail Content')).toBeInTheDocument()
  })

  it('shows resize handle when tree is expanded', () => {
    renderWithTheme(<PanelLayout />)
    expect(screen.getByTestId('resize-handle')).toBeInTheDocument()
  })

  it('collapses tree on double-click of resize handle', () => {
    renderWithTheme(<PanelLayout />)
    const handle = screen.getByTestId('resize-handle')
    fireEvent.doubleClick(handle)
    expect(screen.getByTestId('tree-panel-collapsed')).toBeInTheDocument()
    expect(screen.queryByTestId('tree-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resize-handle')).not.toBeInTheDocument()
  })

  it('re-expands tree when clicking collapsed strip', () => {
    renderWithTheme(<PanelLayout />)
    // Collapse
    fireEvent.doubleClick(screen.getByTestId('resize-handle'))
    expect(screen.getByTestId('tree-panel-collapsed')).toBeInTheDocument()
    // Re-expand
    fireEvent.click(screen.getByTestId('tree-panel-collapsed'))
    expect(screen.getByTestId('tree-panel')).toBeInTheDocument()
    expect(screen.getByTestId('resize-handle')).toBeInTheDocument()
  })

  it('shows Fields label on collapsed strip', () => {
    renderWithTheme(<PanelLayout />)
    fireEvent.doubleClick(screen.getByTestId('resize-handle'))
    expect(screen.getByText(/Fields/)).toBeInTheDocument()
  })

  it('displays status bar with Ready text', () => {
    renderWithTheme(<PanelLayout />)
    expect(screen.getByTestId('status-bar')).toHaveTextContent('Ready')
  })
})
