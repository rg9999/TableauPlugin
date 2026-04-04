import { useMemo, useState, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import type {
  RowClassParams,
  GetRowIdParams,
  SortChangedEvent,
  FilterChangedEvent,
  RowClickedEvent,
  GridApi,
} from 'ag-grid-community'
import { useStore } from '../../store/store'
import { buildColumnDefs } from './columnDefBuilder'
import { getMessageTypeColor } from './messageTypeColors'
import DropZoneOverlay from './DropZoneOverlay'
import { AG_GRID_THEME } from '../../theme/agGridTheme'
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme/designTokens'
import type { GridRowData } from '../../models/gridData'

interface ContextMenuState {
  mouseX: number
  mouseY: number
  field: string
}

interface GridAreaProps {
  onRowClick?: (row: GridRowData) => void
}

export default function GridArea({ onRowClick }: GridAreaProps) {
  const selectedFields = useStore((state) => state.selectedFields)
  const gridData = useStore((state) => state.gridData)
  const removeField = useStore((state) => state.removeField)
  const setSortModel = useStore((state) => state.setSortModel)
  const setFilterModel = useStore((state) => state.setFilterModel)
  const columnDefs = useMemo(() => buildColumnDefs(selectedFields), [selectedFields])
  const hasFields = selectedFields.length > 0
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const gridApiRef = useRef<GridApi | null>(null)

  // Native right-click handler on the grid wrapper — detects column header clicks
  const handleGridContextMenu = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    const headerCell = target.closest('.ag-header-cell')
    if (!headerCell) return

    const colId = headerCell.getAttribute('col-id')
    if (!colId || colId === 'timestamp') return

    event.preventDefault()
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, field: colId })
  }, [])

  const handleRemoveField = useCallback(() => {
    if (contextMenu) {
      removeField(contextMenu.field)
      setContextMenu(null)
    }
  }, [contextMenu, removeField])

  const handleCloseMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const getRowId = useCallback((params: GetRowIdParams<GridRowData>) => params.data.rowId, [])

  const getRowStyle = useCallback((params: RowClassParams<GridRowData>) => {
    if (!params.data) return undefined
    const color = getMessageTypeColor(params.data.messageType)
    const isSelected = params.data.rowId === selectedRowId
    return {
      borderLeft: `4px solid ${color}`,
      backgroundColor: isSelected ? `${COLORS.accent}14` : undefined,
    }
  }, [selectedRowId])

  const handleSortChanged = useCallback((event: SortChangedEvent) => {
    const sortModel = event.api.getColumnState()
      .filter((col) => col.sort != null)
      .map((col) => ({ colId: col.colId, sort: col.sort! }))
    setSortModel(sortModel)
  }, [setSortModel])

  const handleFilterChanged = useCallback((event: FilterChangedEvent) => {
    const filterModel = event.api.getFilterModel()
    setFilterModel(filterModel as Record<string, unknown>)
  }, [setFilterModel])

  const handleRowClicked = useCallback((event: RowClickedEvent<GridRowData>) => {
    if (!event.data) return
    setSelectedRowId(event.data.rowId)
    onRowClick?.(event.data)
  }, [onRowClick])

  const handleClearFilters = useCallback(() => {
    gridApiRef.current?.setFilterModel(null)
  }, [])

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <DropZoneOverlay />

      {!hasFields ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.textMuted,
            fontSize: TYPOGRAPHY.emptyState.size,
            textAlign: 'center',
            p: SPACING.xl,
          }}
        >
          <Typography variant="body1" sx={{ color: COLORS.textMuted }}>
            Drag fields from the tree to start exploring
          </Typography>
        </Box>
      ) : (
        <Box
          className={AG_GRID_THEME}
          sx={{ height: '100%', width: '100%' }}
          onContextMenu={handleGridContextMenu}
        >
          <AgGridReact
            columnDefs={columnDefs}
            rowData={gridData}
            getRowId={getRowId}
            getRowStyle={getRowStyle}
            headerHeight={32}
            rowHeight={28}
            rowBuffer={20}
            suppressMovableColumns={false}
            animateRows={false}
            rowSelection="single"
            onGridReady={(params) => { gridApiRef.current = params.api }}
            onSortChanged={handleSortChanged}
            onFilterChanged={handleFilterChanged}
            onRowClicked={handleRowClicked}
          />
        </Box>
      )}

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={handleRemoveField}>Remove field</MenuItem>
        <MenuItem onClick={handleClearFilters}>Clear all filters</MenuItem>
      </Menu>
    </Box>
  )
}
