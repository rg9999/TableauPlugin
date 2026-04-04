import { describe, it, expect, beforeEach } from 'vitest'
import { parseFieldHierarchy, clearParseCache, buildSparseGridModel } from './dataTransform'
import { MOCK_SCHEMA, MOCK_ROWS_100 } from '../__mocks__/mockData'
import type { ColumnInfo } from '../models/tableauTypes'
import type { FieldNode } from '../models/fieldHierarchy'

describe('parseFieldHierarchy', () => {
  beforeEach(() => {
    clearParseCache()
  })

  it('produces a root node with children for each top-level message type', () => {
    const tree = parseFieldHierarchy(MOCK_SCHEMA)
    expect(tree.name).toBe('root')
    expect(tree.dottedPath).toBe('')
    expect(tree.isField).toBe(false)
    // MOCK_SCHEMA has: timestamp, messageType (single-segment), plus 15 message type groups
    // Single-segment fields (timestamp, messageType) become top-level leaf nodes
    expect(tree.children.length).toBeGreaterThanOrEqual(8)
  })

  it('parses all 15 message type groups from MOCK_SCHEMA', () => {
    const tree = parseFieldHierarchy(MOCK_SCHEMA)
    const topLevelNames = tree.children.map((c) => c.name)
    // Major top-level categories
    expect(topLevelNames).toContain('navigation')
    expect(topLevelNames).toContain('flightcontrol')
    expect(topLevelNames).toContain('sensors')
    expect(topLevelNames).toContain('communications')
    expect(topLevelNames).toContain('systemlog')
    expect(topLevelNames).toContain('power')
    expect(topLevelNames).toContain('payload')
  })

  it('creates correct hierarchy depth for deeply nested fields', () => {
    const tree = parseFieldHierarchy(MOCK_SCHEMA)
    // navigation.gps.position.latitude is 4 levels deep
    const nav = tree.children.find((c) => c.name === 'navigation')!
    expect(nav).toBeDefined()
    const gps = nav.children.find((c) => c.name === 'gps')!
    expect(gps).toBeDefined()
    const pos = gps.children.find((c) => c.name === 'position')!
    expect(pos).toBeDefined()
    const lat = pos.children.find((c) => c.name === 'latitude')!
    expect(lat).toBeDefined()
    expect(lat.isField).toBe(true)
    expect(lat.dottedPath).toBe('navigation.gps.position.latitude')
  })

  it('marks only leaf nodes as isField: true', () => {
    const tree = parseFieldHierarchy(MOCK_SCHEMA)
    const nav = tree.children.find((c) => c.name === 'navigation')!
    expect(nav.isField).toBe(false)
    const gps = nav.children.find((c) => c.name === 'gps')!
    expect(gps.isField).toBe(false)
    const pos = gps.children.find((c) => c.name === 'position')!
    expect(pos.isField).toBe(false)
    // All position children should be fields
    for (const child of pos.children) {
      expect(child.isField).toBe(true)
    }
  })

  it('sets messageType correctly from the first path segment', () => {
    const tree = parseFieldHierarchy(MOCK_SCHEMA)
    const nav = tree.children.find((c) => c.name === 'navigation')!
    expect(nav.messageType).toBe('navigation')
    const gps = nav.children.find((c) => c.name === 'gps')!
    expect(gps.messageType).toBe('navigation')
    const lat = nav.children
      .find((c) => c.name === 'gps')!
      .children.find((c) => c.name === 'position')!
      .children.find((c) => c.name === 'latitude')!
    expect(lat.messageType).toBe('navigation')

    const sensors = tree.children.find((c) => c.name === 'sensors')!
    expect(sensors.messageType).toBe('sensors')
  })

  it('handles empty columns array', () => {
    const tree = parseFieldHierarchy([])
    expect(tree.name).toBe('root')
    expect(tree.children).toHaveLength(0)
  })

  it('handles single-segment field names (e.g., "timestamp")', () => {
    const cols: ColumnInfo[] = [
      { fieldName: 'timestamp', dataType: 'string', role: 'dimension' },
    ]
    const tree = parseFieldHierarchy(cols)
    expect(tree.children).toHaveLength(1)
    expect(tree.children[0].name).toBe('timestamp')
    expect(tree.children[0].isField).toBe(true)
    expect(tree.children[0].dottedPath).toBe('timestamp')
  })

  it('handles deeply nested fields up to 6 levels', () => {
    const cols: ColumnInfo[] = [
      { fieldName: 'a.b.c.d.e.f', dataType: 'float', role: 'measure' },
    ]
    const tree = parseFieldHierarchy(cols)
    let node = tree.children[0]
    expect(node.name).toBe('a')
    expect(node.isField).toBe(false)
    node = node.children[0]
    expect(node.name).toBe('b')
    node = node.children[0]
    expect(node.name).toBe('c')
    node = node.children[0]
    expect(node.name).toBe('d')
    node = node.children[0]
    expect(node.name).toBe('e')
    expect(node.isField).toBe(false)
    node = node.children[0]
    expect(node.name).toBe('f')
    expect(node.isField).toBe(true)
    expect(node.dottedPath).toBe('a.b.c.d.e.f')
  })

  it('shares common prefixes without duplicating nodes', () => {
    const cols: ColumnInfo[] = [
      { fieldName: 'nav.gps.lat', dataType: 'float', role: 'measure' },
      { fieldName: 'nav.gps.lon', dataType: 'float', role: 'measure' },
      { fieldName: 'nav.ins.roll', dataType: 'float', role: 'measure' },
    ]
    const tree = parseFieldHierarchy(cols)
    expect(tree.children).toHaveLength(1) // only "nav"
    const nav = tree.children[0]
    expect(nav.children).toHaveLength(2) // "gps" and "ins"
    const gps = nav.children.find((c) => c.name === 'gps')!
    expect(gps.children).toHaveLength(2) // "lat" and "lon"
  })

  it('sorts branches before leaves and alphabetically within each group', () => {
    const cols: ColumnInfo[] = [
      { fieldName: 'z.value', dataType: 'float', role: 'measure' },
      { fieldName: 'a.sub.value', dataType: 'float', role: 'measure' },
      { fieldName: 'a.value', dataType: 'float', role: 'measure' },
      { fieldName: 'm_leaf', dataType: 'string', role: 'dimension' },
    ]
    const tree = parseFieldHierarchy(cols)
    // Branches first (a, z have children), then leaves (m_leaf)
    const names = tree.children.map((c) => c.name)
    expect(names[0]).toBe('a')
    expect(names[1]).toBe('z')
    expect(names[2]).toBe('m_leaf')

    // Within 'a': branch 'sub' first, then leaf 'value'
    const a = tree.children[0]
    expect(a.children[0].name).toBe('sub')
    expect(a.children[1].name).toBe('value')
  })

  it('returns same reference for same input (memoization)', () => {
    const result1 = parseFieldHierarchy(MOCK_SCHEMA)
    const result2 = parseFieldHierarchy(MOCK_SCHEMA)
    expect(result1).toBe(result2) // same reference
  })

  it('returns different reference for different input', () => {
    const cols1: ColumnInfo[] = [
      { fieldName: 'a.b', dataType: 'float', role: 'measure' },
    ]
    const cols2: ColumnInfo[] = [
      { fieldName: 'x.y', dataType: 'float', role: 'measure' },
    ]
    const result1 = parseFieldHierarchy(cols1)
    clearParseCache()
    const result2 = parseFieldHierarchy(cols2)
    expect(result1).not.toBe(result2)
  })

  it('counts total leaf fields matching MOCK_SCHEMA field count', () => {
    const tree = parseFieldHierarchy(MOCK_SCHEMA)
    let leafCount = 0
    function countLeaves(node: typeof tree): void {
      if (node.isField) leafCount++
      for (const child of node.children) countLeaves(child)
    }
    countLeaves(tree)
    // MOCK_SCHEMA has timestamp + messageType + all field paths
    expect(leafCount).toBe(MOCK_SCHEMA.length)
  })
})

describe('buildSparseGridModel', () => {
  const SELECTED_FIELDS: FieldNode[] = [
    { shortName: 'latitude', dottedPath: 'navigation.gps.position.latitude', messageType: 'navigation', dataType: 'float' },
    { shortName: 'roll', dottedPath: 'navigation.ins.roll', messageType: 'navigation', dataType: 'float' },
    { shortName: 'target_id', dottedPath: 'sensors.radar.track.target_id', messageType: 'sensors', dataType: 'float' },
  ]

  it('returns empty array for empty rows', () => {
    expect(buildSparseGridModel([], SELECTED_FIELDS)).toEqual([])
  })

  it('returns empty array for empty selected fields', () => {
    expect(buildSparseGridModel(MOCK_ROWS_100, [])).toEqual([])
  })

  it('transforms MOCK_ROWS_100 into GridRowData with correct structure', () => {
    const result = buildSparseGridModel(MOCK_ROWS_100, SELECTED_FIELDS)
    expect(result.length).toBe(100)
    for (const row of result) {
      expect(row.rowId).toBeDefined()
      expect(row.timestamp).toBeDefined()
      expect(row.messageType).toBeDefined()
    }
  })

  it('sorts rows by timestamp ascending', () => {
    const result = buildSparseGridModel(MOCK_ROWS_100, SELECTED_FIELDS)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].timestamp >= result[i - 1].timestamp).toBe(true)
    }
  })

  it('only populates selected fields that belong to the row message type', () => {
    const result = buildSparseGridModel(MOCK_ROWS_100, SELECTED_FIELDS)

    for (const row of result) {
      if (row.messageType === 'navigation.gps.position') {
        // latitude should be populated
        expect(row['navigation.gps.position.latitude']).toBeDefined()
        // target_id should NOT be populated (different message type)
        expect(row['sensors.radar.track.target_id']).toBeUndefined()
      }
      if (row.messageType === 'sensors.radar.track') {
        expect(row['sensors.radar.track.target_id']).toBeDefined()
        expect(row['navigation.gps.position.latitude']).toBeUndefined()
      }
    }
  })

  it('generates unique rowIds', () => {
    const result = buildSparseGridModel(MOCK_ROWS_100, SELECTED_FIELDS)
    const ids = result.map((r) => r.rowId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
