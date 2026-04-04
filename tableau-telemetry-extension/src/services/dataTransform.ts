/**
 * dataTransform.ts — Pure data transformation functions (no React, no side effects).
 *
 * This is the core data pipeline for the extension. Three functions handle
 * the full lifecycle of Tableau data:
 *
 *   1. parseFieldHierarchy()       — Flat dotted-path columns → TreeNode hierarchy
 *                                    (runs once on schema load, result cached)
 *
 *   2. buildSparseGridModel()      — Flat Tableau rows → sparse GridRowData[]
 *                                    (runs on every data fetch/refresh)
 *
 *   3. reconstructNestedObject()   — Flat GridRowData → nested object for detail view
 *                                    (runs on-demand when analyst clicks a row)
 *
 * All functions are pure, independently testable, and have no React dependencies.
 */
import type { ColumnInfo, FlatRowData } from '../models/tableauTypes'
import type { TreeNode } from '../models/fieldHierarchy'
import type { FieldNode } from '../models/fieldHierarchy'
import type { GridRowData } from '../models/gridData'

/**
 * Converts flat dotted-path column names into a hierarchical TreeNode structure.
 * Memoized — returns the same reference for the same input array.
 */
let cachedInput: ColumnInfo[] | null = null
let cachedResult: TreeNode | null = null

export function parseFieldHierarchy(columns: ColumnInfo[]): TreeNode {
  if (cachedInput === columns && cachedResult !== null) {
    return cachedResult
  }

  const root: TreeNode = {
    name: 'root',
    dottedPath: '',
    children: [],
    isField: false,
    messageType: '',
  }

  for (const col of columns) {
    const segments = col.fieldName.split('.')
    if (segments.length === 0) continue

    const messageType = segments[0]
    let current = root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const dottedPath = segments.slice(0, i + 1).join('.')
      const isLeaf = i === segments.length - 1

      let child = current.children.find((c) => c.name === segment && c.dottedPath === dottedPath)

      if (!child) {
        child = {
          name: segment,
          dottedPath,
          children: [],
          isField: isLeaf,
          messageType,
        }
        current.children.push(child)
      } else if (isLeaf) {
        // Node existed as a branch but this column makes it a leaf too
        child.isField = true
      }

      current = child
    }
  }

  sortTree(root)

  cachedInput = columns
  cachedResult = root
  return root
}

/** Sort children alphabetically at each level: branches first, then leaves */
function sortTree(node: TreeNode): void {
  node.children.sort((a, b) => {
    // Branches (has children) before leaves
    const aIsBranch = a.children.length > 0
    const bIsBranch = b.children.length > 0
    if (aIsBranch && !bIsBranch) return -1
    if (!aIsBranch && bIsBranch) return 1
    return a.name.localeCompare(b.name)
  })

  for (const child of node.children) {
    sortTree(child)
  }
}

/**
 * Transforms flat Tableau rows into sparse grid model.
 * Each output row contains only the selected fields that belong to that row's message type.
 * Output is sorted by timestamp ascending.
 */
export function buildSparseGridModel(
  rows: FlatRowData[],
  selectedFields: FieldNode[],
): GridRowData[] {
  if (rows.length === 0 || selectedFields.length === 0) return []

  // Group selected field paths by their dotted path for quick lookup
  const selectedPaths = new Set(selectedFields.map((f) => f.dottedPath))

  const gridRows: GridRowData[] = rows.map((row, index) => {
    const timestamp = String(row.timestamp ?? '')
    const messageType = String(row.messageType ?? '')
    const rowId = `${timestamp}-${messageType}-${index}`

    const gridRow: GridRowData = { rowId, timestamp, messageType }

    // Only include selected fields that exist in this row
    for (const path of selectedPaths) {
      if (row[path] !== undefined) {
        gridRow[path] = row[path]
      }
    }

    return gridRow
  })

  // Sort by timestamp ascending
  gridRows.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return gridRows
}

/**
 * Reconstructs a nested object from a flat GridRowData.
 * Converts dotted-path keys back into a nested structure for detail display.
 * e.g., { "nav.gps.lat": 32.7, "nav.gps.lon": -117.2 } → { nav: { gps: { lat: 32.7, lon: -117.2 } } }
 */
export function reconstructNestedObject(row: GridRowData): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(row)) {
    // Skip metadata fields
    if (key === 'rowId') continue

    const segments = key.split('.')
    if (segments.length === 1) {
      result[key] = value
      continue
    }

    let current: Record<string, unknown> = result
    for (let i = 0; i < segments.length - 1; i++) {
      if (!(segments[i] in current) || typeof current[segments[i]] !== 'object') {
        current[segments[i]] = {}
      }
      current = current[segments[i]] as Record<string, unknown>
    }
    current[segments[segments.length - 1]] = value
  }

  return result
}

/** Reset memoization cache (for testing) */
export function clearParseCache(): void {
  cachedInput = null
  cachedResult = null
}
