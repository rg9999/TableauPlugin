/**
 * DetailPanel.tsx — Bottom panel showing the full nested structure of a clicked row.
 *
 * When the analyst clicks a row in the grid, this 180px panel opens at the bottom.
 * It uses reconstructNestedObject() to convert the flat GridRowData back into a
 * nested object, then renders it via DetailTreeView. Header shows message type name
 * with a ✕ close button that reclaims the space for the grid.
 */
import { useMemo } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { reconstructNestedObject } from '../../services/dataTransform'
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/designTokens'
import type { GridRowData } from '../../models/gridData'
import DetailTreeView from './DetailTreeView'

interface DetailPanelProps {
  row: GridRowData
  onClose: () => void
}

export default function DetailPanel({ row, onClose }: DetailPanelProps) {
  const nested = useMemo(() => reconstructNestedObject(row), [row])

  return (
    <Box
      sx={{
        height: LAYOUT.detailPanelHeight,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: SPACING.sm,
          py: SPACING.xs,
          bgcolor: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          minHeight: 28,
        }}
      >
        <Typography
          sx={{
            fontSize: TYPOGRAPHY.panelHeader.size,
            fontWeight: TYPOGRAPHY.panelHeader.weight,
            color: COLORS.textPrimary,
          }}
        >
          {row.messageType}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="close detail panel">
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: SPACING.xs }}>
        <DetailTreeView data={nested} />
      </Box>
    </Box>
  )
}
