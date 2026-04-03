import { useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import { COLORS } from '../../theme/designTokens'

interface ResizeHandleProps {
  onResize: (deltaX: number) => void
  onDoubleClick: () => void
}

export default function ResizeHandle({ onResize, onDoubleClick }: ResizeHandleProps) {
  const startXRef = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current
        startXRef.current = moveEvent.clientX
        onResize(delta)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [onResize],
  )

  return (
    <Box
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      sx={{
        width: '4px',
        cursor: 'col-resize',
        backgroundColor: COLORS.border,
        flexShrink: 0,
        '&:hover': {
          backgroundColor: COLORS.accent,
        },
      }}
      data-testid="resize-handle"
    />
  )
}
