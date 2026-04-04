import { useMemo, useState, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import type { ColumnHeaderClickedEvent, RowClassParams, GetRowIdParams } from 'ag-grid-community'
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

export default function GridArea() {
  const selectedFields = useStore((state) => state.selectedFields)
  const gridData = useStore((state) => state.gridData)
  const removeField = useStore((state) => state.removeField)
  const columnDefs = useMemo(() => buildColumnDefs(selectedFields), [selectedFields])
  const hasFields = selectedFields.length > 0
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const handleHeaderContextMenu = useCallback((event: ColumnHeaderClickedEvent) => {
    const field = event.column.getColDef().field
    if (!field || field === 'timestamp') return
    const mouseEvent = event.event as MouseEvent
    mouseEvent.preventDefault()
    setContextMenu({ mouseX: mouseEvent.clientX, mouseY: mouseEvent.clientY, field })
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
    return { borderLeft: `4px solid ${color}` }
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
        <Box className={AG_GRID_THEME} sx={{ height: '100%', width: '100%' }}>
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
            onColumnHeaderContextMenu={handleHeaderContextMenu}
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
      </Menu>
    </Box>
  )
}
