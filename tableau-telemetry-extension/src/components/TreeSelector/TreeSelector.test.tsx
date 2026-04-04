import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { muiTheme } from '../../theme/muiTheme'
import TreeSelector, { collectLeafFields, filterTree } from './TreeSelector'
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

  it('selects all leaf fields when parent checkbox is clicked', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    // The "nav" node should have a checkbox — click it to select all nav leaves
    const checkboxes = screen.getAllByRole('checkbox')
    // First checkbox should be the "nav" parent checkbox
    fireEvent.click(checkboxes[0])

    const state = useStore.getState()
    // nav has 3 leaves: lat, lon, roll
    expect(state.selectedFields).toHaveLength(3)
    expect(state.selectedFields.map((f) => f.dottedPath).sort()).toEqual([
      'nav.gps.lat',
      'nav.gps.lon',
      'nav.ins.roll',
    ])
  })

  it('deselects all leaf fields when parent checkbox is clicked again', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    const navLeaves = collectLeafFields(hierarchy.children.find((c) => c.name === 'nav')!)
    useStore.setState({ fieldHierarchy: hierarchy, selectedFields: navLeaves })

    renderTreeSelector()
    // Click the nav parent checkbox to deselect all
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    const state = useStore.getState()
    expect(state.selectedFields).toHaveLength(0)
  })

  it('collectLeafFields collects all leaves from a branch', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    const navNode = hierarchy.children.find((c) => c.name === 'nav')!
    const leaves = collectLeafFields(navNode)
    expect(leaves).toHaveLength(3)
    expect(leaves.map((l) => l.dottedPath).sort()).toEqual(['nav.gps.lat', 'nav.gps.lon', 'nav.ins.roll'])
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

  it('renders search input above the tree', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    expect(screen.getByPlaceholderText('Search fields...')).toBeInTheDocument()
  })

  it('filters tree when search term is entered', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    const searchInput = screen.getByPlaceholderText('Search fields...')
    fireEvent.change(searchInput, { target: { value: 'lat' } })

    // "nav" should still be visible (ancestor of "lat")
    expect(screen.getByText('nav')).toBeInTheDocument()
    // "lat" should be visible (matches)
    expect(screen.getByText('lat')).toBeInTheDocument()
    // "sensors" should be hidden (no match)
    expect(screen.queryByText('sensors')).not.toBeInTheDocument()
  })

  it('restores full tree when search is cleared', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    const searchInput = screen.getByPlaceholderText('Search fields...')

    // Filter first
    fireEvent.change(searchInput, { target: { value: 'lat' } })
    expect(screen.queryByText('sensors')).not.toBeInTheDocument()

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(screen.getByText('sensors')).toBeInTheDocument()
    expect(screen.getByText('nav')).toBeInTheDocument()
  })

  it('shows "No matching fields" when search has no results', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    useStore.setState({ fieldHierarchy: hierarchy })

    renderTreeSelector()
    const searchInput = screen.getByPlaceholderText('Search fields...')
    fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } })

    expect(screen.getByText('No matching fields')).toBeInTheDocument()
  })
})

describe('filterTree', () => {
  it('returns null when no nodes match', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    const result = filterTree(hierarchy, 'nonexistent')
    // Root may be returned but with empty children
    expect(result === null || result.children.length === 0).toBe(true)
  })

  it('preserves parent hierarchy for matching leaves', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    const result = filterTree(hierarchy, 'lat')
    expect(result).not.toBeNull()
    // Should have nav → gps → lat path
    const nav = result!.children.find((c) => c.name === 'nav')
    expect(nav).toBeDefined()
    const gps = nav!.children.find((c) => c.name === 'gps')
    expect(gps).toBeDefined()
    const lat = gps!.children.find((c) => c.name === 'lat')
    expect(lat).toBeDefined()
  })

  it('matches against dotted paths', () => {
    const hierarchy = parseFieldHierarchy(SMALL_SCHEMA)
    // Search by dotted path segment "gps" — should match nav.gps.lat and nav.gps.lon
    const result = filterTree(hierarchy, 'gps')
    expect(result).not.toBeNull()
    const nav = result!.children.find((c) => c.name === 'nav')
    expect(nav).toBeDefined()
    const gps = nav!.children.find((c) => c.name === 'gps')
    expect(gps).toBeDefined()
    // "ins" should not be present (doesn't match "gps")
    const ins = nav!.children.find((c) => c.name === 'ins')
    expect(ins).toBeUndefined()
  })
})
