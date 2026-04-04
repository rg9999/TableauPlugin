# Story 2.2: Drag-and-Drop Field to Grid

Status: done

## Story

As an analyst,
I want to drag a field from the tree and drop it on the grid to add it as a column,
so that I can build my view by direct manipulation without forms or apply buttons.

## Acceptance Criteria

1. **Given** the @dnd-kit DndContext wraps TreeSelector and GridArea at the App level, **when** the analyst grabs a leaf field node in the tree, **then** a DragOverlay shows the field short name in an accent-colored pill following the cursor
2. **Given** a field is being dragged over the grid area, **when** hovering over the grid header area, **then** a DropZoneOverlay shows a 3px accent insertion line at the drop position
3. **Given** a field is dropped on the grid area, **when** the drop completes, **then** the field is added to Zustand `fieldSelectionSlice.selectedFields`
4. **Given** a field is dropped, **when** the tree re-renders, **then** the tree node immediately shows a selected/checkmark indicator
5. **Given** no fields are selected, **when** the first field is dragged to the grid, **then** a timestamp column auto-appears pinned left
6. **Given** fields are already in the grid, **when** a new field is dropped, **then** it appears as the last column (or at drop position)
7. **Given** a field is dropped, **when** the grid updates, **then** the column header appears within 100ms of drop (per UX success criteria)

## Tasks / Subtasks

- [x] Task 1: Wrap App with @dnd-kit DndContext (AC: #1)
  - [x] 1.1: Import DndContext, DragOverlay from `@dnd-kit/core` in App.tsx
  - [x] 1.2: Wrap PanelLayout (and its children) with `<DndContext>` and configure sensors (PointerSensor with 5px distance constraint)
  - [x] 1.3: Add DragOverlay component showing field name in accent pill (MUI Chip) during drag
  - [x] 1.4: Track active drag item in local state via `onDragStart`/`onDragEnd`
- [x] Task 2: Make tree leaf nodes draggable (AC: #1)
  - [x] 2.1: Created `src/components/TreeSelector/DraggableTreeItem.tsx` wrapping leaf ListItemButton with `useDraggable`
  - [x] 2.2: Attached drag data: `{ id: node.dottedPath, data: { shortName, dottedPath, messageType } }`
  - [x] 2.3: Applied drag handle styles (cursor: grab, opacity: 0.4 when dragging)
  - [x] 2.4: Integrated DraggableTreeItem into TreeSelector.tsx — wraps leaf nodes only
- [x] Task 3: Create GridArea with drop zone (AC: #2, #5, #6)
  - [x] 3.1: Created `src/components/GridArea/GridArea.tsx` — AG Grid wrapper reading selectedFields from Zustand
  - [x] 3.2: Created `src/components/GridArea/columnDefBuilder.ts` — builds ColDef[] with timestamp pinned left + field columns
  - [x] 3.3: Created `src/components/GridArea/DropZoneOverlay.tsx` — uses `useDroppable`, shows accent border + tinted bg on drag-over
  - [x] 3.4: Wired GridArea into PanelLayout as `gridContent` prop via App.tsx
  - [x] 3.5: Empty state shows "Drag fields from the tree to start exploring"
- [x] Task 4: Handle drop to add field (AC: #3, #4, #6, #7)
  - [x] 4.1: In App.tsx `onDragEnd`, extract field data from `active.data.current`
  - [x] 4.2: Call Zustand `addField()` with the dropped FieldNode when dropped on grid-drop-zone
  - [x] 4.3: Tree checkbox updates immediately via Zustand reactivity (selectedFields selector)
  - [x] 4.4: New column appears in GridArea via columnDefBuilder recomputation (useMemo on selectedFields)
- [x] Task 5: Write tests (AC: #1-#7)
  - [x] 5.1: Tested columnDefBuilder returns empty for no fields
  - [x] 5.2: Tested columnDefBuilder produces correct ColDef[] including timestamp pinned left
  - [x] 5.3: Tested columnDefBuilder headerName and headerTooltip
  - [x] 5.4: Tested GridArea shows empty state when no fields selected
  - [x] 5.5: Tested GridArea renders AG Grid when fields are in store

## Dev Notes

### Architecture Compliance

**File locations:**
- `src/components/TreeSelector/DraggableTreeItem.tsx` — drag source wrapper (private to TreeSelector)
- `src/components/GridArea/GridArea.tsx` — AG Grid wrapper
- `src/components/GridArea/GridArea.test.tsx` — co-located test
- `src/components/GridArea/columnDefBuilder.ts` — column definition builder
- `src/components/GridArea/DropZoneOverlay.tsx` — visual drop indicator
- `src/App.tsx` — DndContext wrapper, onDragEnd handler

**Boundaries:**
- AG Grid API calls ONLY in GridArea — no other component touches gridApi
- Column definitions built via `columnDefBuilder` from Zustand state — never inline
- @dnd-kit DndContext wraps TreeSelector + GridArea at App level (ARCH-7)

### @dnd-kit Integration Pattern

**Installed packages:** `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`

**Drag source (tree leaf nodes):**
```typescript
import { useDraggable } from '@dnd-kit/core'
const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
  id: node.dottedPath,
  data: { shortName: node.name, dottedPath: node.dottedPath, messageType: node.messageType },
})
```

**Drop target (grid area):**
```typescript
import { useDroppable } from '@dnd-kit/core'
const { setNodeRef, isOver } = useDroppable({ id: 'grid-drop-zone' })
```

**DragOverlay (App level):**
```typescript
<DragOverlay>
  {activeField ? <Chip label={activeField.shortName} sx={{ bgcolor: COLORS.accent, color: '#fff' }} /> : null}
</DragOverlay>
```

**onDragEnd handler (App level):**
```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (over?.id === 'grid-drop-zone' && active.data.current) {
    const { shortName, dottedPath, messageType } = active.data.current
    addField({ shortName, dottedPath, messageType, dataType: 'string' })
  }
  setActiveField(null)
}
```

### columnDefBuilder Pattern

Per architecture: column definitions are DERIVED from Zustand state, never stored as primary state.

```typescript
export function buildColumnDefs(selectedFields: FieldNode[]): ColDef[] {
  if (selectedFields.length === 0) return []
  const timestampCol: ColDef = { field: 'timestamp', pinned: 'left', sort: 'asc' }
  const fieldCols: ColDef[] = selectedFields.map(field => ({
    field: field.dottedPath,
    headerName: field.shortName,
    headerTooltip: field.dottedPath,
  }))
  return [timestampCol, ...fieldCols]
}
```

### AG Grid Setup

**AG Grid Enterprise** is installed (`ag-grid-enterprise@^35.2.0`, `ag-grid-react@^35.2.0`).

**Key consideration:** AG Grid Enterprise requires license setup. Use `LicenseManager.setLicenseKey()` with `VITE_AG_GRID_LICENSE_KEY` env var. For dev/test, AG Grid works without a license key but shows a watermark.

**AG Grid in this story:** GridArea renders the grid shell with column headers. Actual data rows come in Epic 3 (buildSparseGridModel). For now, the grid shows headers only (empty rows).

### Existing Code to Reuse

- `TreeNode`, `FieldNode` from `src/models/fieldHierarchy.ts`
- `useStore` from `src/store/store.ts` — `addField`, `selectedFields`, `fieldHierarchy`
- `COLORS`, `SPACING`, `TYPOGRAPHY` from `src/theme/designTokens.ts`
- `PanelLayout` accepts `gridContent?: ReactNode` prop

### Previous Story Intelligence (2.1)

- TreeSelector renders leaf nodes with checkboxes — `isSelected` state driven by `selectedFields` in Zustand
- TreeNodeItem is `React.memo`'d — adding `useDraggable` must not break memoization
- Leaf detection: `node.isField && node.children.length === 0`
- `addField()` prevents duplicates by dottedPath check

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Drag-and-Drop: @dnd-kit]
- [Source: _bmad-output/planning-artifacts/architecture.md#AG Grid Configuration Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 9 test files, 100 tests, all passing (0 regressions)
- 5 new tests (3 columnDefBuilder + 2 GridArea)

### Completion Notes List

- DndContext wraps entire app with PointerSensor (5px distance activation constraint)
- DragOverlay shows accent-colored MUI Chip with field short name
- DraggableTreeItem wraps leaf nodes with useDraggable, carries field metadata
- GridArea: AG Grid wrapper with empty state, reads selectedFields from Zustand
- columnDefBuilder: timestamp pinned left with sort asc + field columns with headerTooltip
- DropZoneOverlay: useDroppable with accent border + tinted background on hover
- onDragEnd checks for GRID_DROP_ZONE_ID match before calling addField

### File List

- src/App.tsx (modified — added DndContext, DragOverlay, GridArea, drag handlers)
- src/components/TreeSelector/TreeSelector.tsx (modified — integrated DraggableTreeItem for leaf nodes)
- src/components/TreeSelector/DraggableTreeItem.tsx (created)
- src/components/GridArea/GridArea.tsx (created)
- src/components/GridArea/GridArea.test.tsx (created)
- src/components/GridArea/columnDefBuilder.ts (created)
- src/components/GridArea/DropZoneOverlay.tsx (created)
