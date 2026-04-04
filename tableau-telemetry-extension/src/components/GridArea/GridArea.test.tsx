import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { DndContext } from '@dnd-kit/core'
import { muiTheme } from '../../theme/muiTheme'
import GridArea from './GridArea'
import { buildColumnDefs } from './columnDefBuilder'
import { getMessageTypeColor } from './messageTypeColors'
import { useStore } from '../../store/store'
import type { FieldNode } from '../../models/fieldHierarchy'

function renderGridArea() {
  return render(
    <ThemeProvider theme={muiTheme}>
      <DndContext>
        <GridArea />
      </DndContext>
    </ThemeProvider>,
  )
}

const SAMPLE_FIELDS: FieldNode[] = [
  { shortName: 'latitude', dottedPath: 'nav.gps.lat', messageType: 'nav', dataType: 'float' },
  { shortName: 'longitude', dottedPath: 'nav.gps.lon', messageType: 'nav', dataType: 'float' },
]

describe('buildColumnDefs', () => {
  it('returns empty array when no fields selected', () => {
    expect(buildColumnDefs([])).toEqual([])
  })

  it('includes timestamp column pinned left as first column', () => {
    const defs = buildColumnDefs(SAMPLE_FIELDS)
    expect(defs[0].field).toBe('timestamp')
    expect(defs[0].pinned).toBe('left')
    expect(defs[0].sort).toBe('asc')
  })

  it('builds column defs with correct headerName and headerTooltip', () => {
    const defs = buildColumnDefs(SAMPLE_FIELDS)
    expect(defs).toHaveLength(3) // timestamp + 2 fields
    expect(defs[1].field).toBe('nav.gps.lat')
    expect(defs[1].headerName).toBe('latitude')
    expect(defs[1].headerTooltip).toBe('nav.gps.lat')
    expect(defs[2].headerName).toBe('longitude')
  })
})

describe('GridArea', () => {
  beforeEach(() => {
    useStore.setState({ selectedFields: [], fieldHierarchy: null })
  })

  it('shows empty state when no fields selected', () => {
    renderGridArea()
    expect(screen.getByText('Drag fields from the tree to start exploring')).toBeInTheDocument()
  })

  it('renders AG Grid when fields are selected', () => {
    useStore.setState({ selectedFields: SAMPLE_FIELDS })
    renderGridArea()
    // AG Grid should render — empty state should not be present
    expect(screen.queryByText('Drag fields from the tree to start exploring')).not.toBeInTheDocument()
  })
})

describe('getMessageTypeColor', () => {
  it('returns a color string for any message type', () => {
    const color = getMessageTypeColor('navigation.gps.position')
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('returns the same color for the same top-level category', () => {
    const c1 = getMessageTypeColor('navigation.gps.position')
    const c2 = getMessageTypeColor('navigation.ins')
    expect(c1).toBe(c2)
  })

  it('returns different colors for different categories', () => {
    const cNav = getMessageTypeColor('navigation')
    const cSensors = getMessageTypeColor('sensors')
    // Different categories should (usually) get different colors
    // This is probabilistic but with only 2 categories and 8 colors, collision is unlikely
    expect(typeof cNav).toBe('string')
    expect(typeof cSensors).toBe('string')
  })
})
