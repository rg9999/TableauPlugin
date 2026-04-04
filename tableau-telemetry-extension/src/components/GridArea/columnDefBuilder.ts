/**
 * columnDefBuilder.ts — Builds AG Grid ColDef[] from selected fields.
 *
 * Column definitions are DERIVED from Zustand state — never stored as primary state.
 * Timestamp column is auto-added and pinned left when any field is selected.
 * All field columns use ArrayCellRenderer (handles both arrays and primitives).
 * Sort and filter are enabled on every column.
 */
import type { ColDef } from 'ag-grid-community'
import type { FieldNode } from '../../models/fieldHierarchy'
import { COLORS } from '../../theme/designTokens'
import ArrayCellRenderer from './cellRenderers/ArrayCellRenderer'

/**
 * Builds AG Grid column definitions from selected fields.
 * Timestamp column is auto-added and pinned left when fields are selected.
 * All field columns use ArrayCellRenderer which gracefully handles both
 * array and non-array values.
 */
export function buildColumnDefs(selectedFields: FieldNode[]): ColDef[] {
  if (selectedFields.length === 0) return []

  const timestampCol: ColDef = {
    field: 'timestamp',
    headerName: 'Timestamp',
    pinned: 'left',
    sort: 'asc',
    sortIndex: 0,
    sortable: true,
    filter: true,
    cellStyle: { backgroundColor: `${COLORS.accent}08` },
    minWidth: 160,
  }

  const fieldCols: ColDef[] = selectedFields.map((field) => ({
    field: field.dottedPath,
    headerName: field.shortName,
    headerTooltip: field.dottedPath,
    minWidth: 80,
    flex: 1,
    sortable: true,
    filter: true,
    cellRenderer: ArrayCellRenderer,
  }))

  return [timestampCol, ...fieldCols]
}
