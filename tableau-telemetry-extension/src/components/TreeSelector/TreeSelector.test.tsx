import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { muiTheme } from '../../theme/muiTheme'
import TreeSelector from './TreeSelector'
import { useStore } from '../../store/store'
import { parseFieldHierarchy, clearParseCache } from '../../services/dataTransform'
import { MOCK_SCHEMA } from '../../__mocks__/mockData'
import type { ColumnInfo } from '../../models/tableauTypes'

function renderTreeSelector() {
  return render(
    <ThemeProvider theme={muiTheme}>
      <TreeSelector />
    </ThemeProvider>,
  )
}

/** Small schema for focused tests */
const SMALL_SCHEMA: ColumnInfo[] = [
  { fieldName: 'nav.gps.lat', dataType: 'float', role: 'measure' },
  { fieldName: 'nav.gps.lon', dataType: 'float', role: 'measure' },
  { fieldName: 'nav.ins.roll', dataType: 'float', role: 'measure' },
  { fieldName: 'sensors.radar.range', dataType: 'float', role: 'measure' },
]

describe('TreeSelector', () => {
  beforeEach(() => {
    clearParseCache()
    // Reset Zustand store
    useStore.setState({
      selectedFields: [],
      fieldHierarchy: null,
    })
  })

  it('shows loading message when fieldHierarchy is null', () => {
    renderTreeSelector()
    expect(screen.getByText('Loading fields...')).toBeInTheDocument()
  })

  it('renders top-level message type nodes from hierarchy', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    expect(screen.getByText('nav')).toBeInTheDocument()
    expect(screen.getByText('sensors')).toBeInTheDocument()
  })

  it('expands a branch node on click to show children', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    // Click "nav" to expand
    fireEvent.click(screen.getByText('nav'))
    // Now "gps" and "ins" should be visible
    expect(screen.getByText('gps')).toBeInTheDocument()
    expect(screen.getByText('ins')).toBeInTheDocument()
  })

  it('shows leaf field short names after expanding to leaves', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    // Expand nav → gps
    fireEvent.click(screen.getByText('nav'))
    fireEvent.click(screen.getByText('gps'))
    // Leaf fields
    expect(screen.getByText('lat')).toBeInTheDocument()
    expect(screen.getByText('lon')).toBeInTheDocument()
  })

  it('dispatches addField when clicking a leaf field checkbox', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    // Expand to leaves
    fireEvent.click(screen.getByText('nav'))
    fireEvent.click(screen.getByText('gps'))

    // Click the "lat" row (not the checkbox directly, just the list item)
    fireEvent.click(screen.getByText('lat'))

    const state = useStore.getState()
    expect(state.selectedFields).toHaveLength(1)
    expect(state.selectedFields[0].dottedPath).toBe('nav.gps.lat')
    expect(state.selectedFields[0].shortName).toBe('lat')
  })

  it('dispatches removeField when clicking an already-selected leaf', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({
      fieldHierarchy: hierarchy,
      selectedFields: [
        { shortName: 'lat', dottedPath: 'nav.gps.lat', messageType: 'nav', dataType: 'float' },
      ],
    })

    renderTreeSelector()
    fireEvent.click(screen.getByText('nav'))
    fireEvent.click(screen.getByText('gps'))
    // Click lat again to deselect
    fireEvent.click(screen.getByText('lat'))

    const state = useStore.getState()
    expect(state.selectedFields).toHaveLength(0)
  })

  it('renders with full MOCK_SCHEMA hierarchy', () => {
    const hierarchy = parseFieldHierarchy(MOCK_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    // Should have top-level categories
    expect(screen.getByText('navigation')).toBeInTheDocument()
    expect(screen.getByText('sensors')).toBeInTheDocument()
    expect(screen.getByText('power')).toBeInTheDocument()
  })
})
