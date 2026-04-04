import { useState, useCallback } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Chip from '@mui/material/Chip'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { muiTheme } from './theme/muiTheme'
import './theme/agGridTheme'
import './theme/agGridStyles.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import PanelLayout from './components/PanelLayout/PanelLayout'
import TreeSelector from './components/TreeSelector/TreeSelector'
import GridArea from './components/GridArea/GridArea'
import { GRID_DROP_ZONE_ID } from './components/GridArea/DropZoneOverlay'
import { useFieldHierarchy } from './hooks/useFieldHierarchy'
import { useStore } from './store/store'
import { COLORS } from './theme/designTokens'

interface ActiveDragData {
  shortName: string
  dottedPath: string
  messageType: string
}

function App() {
  useFieldHierarchy()

  const addField = useStore((state) => state.addField)
  const [activeDrag, setActiveDrag] = useState<ActiveDragData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as ActiveDragData | undefined
    if (data) {
      setActiveDrag(data)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over?.id === GRID_DROP_ZONE_ID && active.data.current) {
        const { shortName, dottedPath, messageType } = active.data.current as ActiveDragData
        addField({ shortName, dottedPath, messageType, dataType: 'string' })
      }
      setActiveDrag(null)
    },
    [addField],
  )

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <PanelLayout treeContent={<TreeSelector />} gridContent={<GridArea />} />
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <Chip
              label={activeDrag.shortName}
              size="small"
              sx={{
                bgcolor: COLORS.accent,
                color: '#fff',
                fontWeight: 600,
                fontSize: 12,
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </ThemeProvider>
  )
}

export default App
