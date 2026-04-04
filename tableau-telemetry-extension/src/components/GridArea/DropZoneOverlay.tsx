import { useDroppable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import { COLORS } from '../../theme/designTokens'

export const GRID_DROP_ZONE_ID = 'grid-drop-zone'

export default function DropZoneOverlay() {
  const { setNodeRef, isOver } = useDroppable({ id: GRID_DROP_ZONE_ID })

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        border: isOver ? `3px solid ${COLORS.accent}` : 'none',
        backgroundColor: isOver ? 'rgba(78, 121, 167, 0.2)' : 'transparent',
        transition: 'all 0.15s ease',
      }}
    />
  )
}
