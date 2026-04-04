/**
 * ArrayCellRenderer.tsx — AG Grid custom cell renderer for array and scalar values.
 *
 * Applied to all field columns via columnDefBuilder. Behavior:
 *   - Non-array values: renders as plain text (String(value))
 *   - Null/undefined: renders as empty string
 *   - Array values: renders compact "[N items]" summary in accent color
 *     Click opens a MUI Popover with a scrollable list of all elements
 *     Popover is dismissible by clicking outside
 */
import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import type { ICellRendererParams } from 'ag-grid-community'
import { COLORS, SPACING } from '../../../theme/designTokens'

export default function ArrayCellRenderer(params: ICellRendererParams) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const value = params.value

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  if (!Array.isArray(value)) {
    return <span>{value != null ? String(value) : ''}</span>
  }

  const isOpen = Boolean(anchorEl)

  return (
    <>
      <Box
        component="span"
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          color: COLORS.accent,
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        [{value.length} items]
      </Box>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <List dense sx={{ minWidth: 120, maxHeight: 200, overflow: 'auto', py: SPACING.xs }}>
          {value.map((item, i) => (
            <ListItem key={i} sx={{ py: 0 }}>
              <ListItemText
                primary={String(item)}
                primaryTypographyProps={{ fontSize: 12 }}
              />
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  )
}
