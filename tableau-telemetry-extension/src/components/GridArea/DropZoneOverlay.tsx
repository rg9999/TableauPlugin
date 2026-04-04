/**
 * DropZoneOverlay.tsx — Visual drop target overlay for the grid area.
 *
 * Uses @dnd-kit's useDroppable to register the grid as a valid drop zone.
 * When a tree field is dragged over the grid, shows a 3px accent border
 * and 20% opacity tinted background as visual feedback. The overlay is
 * transparent to pointer events (pointerEvents: 'none') so it doesn't
 * interfere with normal grid interaction.
 */
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
