import type { ColDef } from 'ag-grid-community'
import type { FieldNode } from '../../models/fieldHierarchy'
import { COLORS } from '../../theme/designTokens'

/**
 * Builds AG Grid column definitions from selected fields.
 * Timestamp column is auto-added and pinned left when fields are selected.
 */
export function buildColumnDefs(selectedFields: FieldNode[]): ColDef[] {
  if (selectedFields.length === 0) return []

  const timestampCol: ColDef = {
    field: 'timestamp',
    headerName: 'Timestamp',
    pinned: 'left',
    sort: 'asc',
    sortIndex: 0,
    cellStyle: { backgroundColor: `${COLORS.accent}08` },
    minWidth: 160,
  }

  const fieldCols: ColDef[] = selectedFields.map((field) => ({
    field: field.dottedPath,
    headerName: field.shortName,
    headerTooltip: field.dottedPath,
    minWidth: 80,
    flex: 1,
  }))

  return [timestampCol, ...fieldCols]
}
