import type { ColDef } from 'ag-grid-community'
import type { FieldNode } from '../../models/fieldHierarchy'
import { COLORS } from '../../theme/designTokens'
import ArrayCellRenderer from './cellRenderers/ArrayCellRenderer'

/** Shared header style to force text visibility in all environments */
const HEADER_STYLE = {
  color: '#333333',
  fontWeight: '600',
  fontSize: '12px',
}

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
    resizable: true,
    cellStyle: { backgroundColor: `${COLORS.accent}08` },
    headerStyle: HEADER_STYLE,
    minWidth: 140,
    width: 180,
  }

  const fieldCols: ColDef[] = selectedFields.map((field) => ({
    field: field.dottedPath,
    headerName: field.shortName,
    headerTooltip: field.dottedPath,
    minWidth: 70,
    width: 130,
    resizable: true,
    sortable: true,
    filter: true,
    headerStyle: HEADER_STYLE,
    cellRenderer: ArrayCellRenderer,
  }))

  return [timestampCol, ...fieldCols]
}
