import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useStore } from '../../store/store'
import { buildColumnDefs } from './columnDefBuilder'
import DropZoneOverlay from './DropZoneOverlay'
import { AG_GRID_THEME } from '../../theme/agGridTheme'
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme/designTokens'

export default function GridArea() {
  const selectedFields = useStore((state) => state.selectedFields)
  const columnDefs = useMemo(() => buildColumnDefs(selectedFields), [selectedFields])
  const hasFields = selectedFields.length > 0

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
            rowData={[]}
            headerHeight={32}
            suppressMovableColumns={false}
            animateRows={false}
          />
        </Box>
      )}
    </Box>
  )
}
