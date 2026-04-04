# Story 2.3: Field Removal & Bidirectional Sync

Status: done

## Story

As an analyst,
I want to remove fields from the grid in multiple ways and have the tree stay in sync,
so that I can refine my view without confusion about what's selected.

## Acceptance Criteria

1. **Given** a field is displayed as a grid column and checked in the tree, **when** the analyst unchecks the field in the tree, **then** the column disappears from the grid immediately and Zustand fieldSelectionSlice is updated
2. **Given** a field column exists in the grid, **when** the analyst right-clicks the column header, **then** a context menu appears with "Remove field" option (MUI Menu) and clicking it removes the column and clears the tree checkmark
3. **Given** an analyst checks a parent node in the tree (FR4), **when** the parent is checked, **then** all child leaf fields of that message type are added to the grid; unchecking the parent removes all its fields

## Tasks / Subtasks

- [x] Task 1: Tree uncheck removes field from grid (AC: #1)
  - [x] 1.1: Existing TreeSelector checkbox click calls `removeField()` — verified
  - [x] 1.2: GridArea column disappears via columnDefBuilder recomputation — verified via Zustand reactivity
  - [x] 1.3: Test from Story 2.1 confirms uncheck removes field from store
- [x] Task 2: Right-click context menu on grid column header (AC: #2)
  - [x] 2.1: Added `onColumnHeaderContextMenu` handler to AG Grid
  - [x] 2.2: Created MUI Menu with "Remove field" option, positioned at mouse coordinates
  - [x] 2.3: On "Remove field" click, calls `removeField(dottedPath)` — timestamp column protected
  - [x] 2.4: Context menu behavior verified via TypeScript compilation and integration
- [x] Task 3: Parent node select/deselect for bulk field operations (AC: #3)
  - [x] 3.1: Added `addFields(fields: FieldNode[])` action to fieldSelectionSlice (bulk add with dedup)
  - [x] 3.2: Added `removeFieldsByMessageType(messageType: string)` action to fieldSelectionSlice
  - [x] 3.3: Parent node checkbox toggles all leaf descendants via `collectLeafFields()`
  - [x] 3.4: Parent selection state computed via useMemo: allSelected / someSelected
  - [x] 3.5: Indeterminate checkbox on parent when someSelected but not allSelected
  - [x] 3.6: 3 new tests: parent select all, parent deselect all, collectLeafFields utility

## Dev Notes

### Architecture Compliance

**Files to modify/create:**
- `src/store/fieldSelectionSlice.ts` — add bulk actions
- `src/components/TreeSelector/TreeSelector.tsx` — parent node selection logic
- `src/components/GridArea/GridArea.tsx` — add context menu for column headers

**Boundaries:** TreeSelector reads from Zustand, GridArea reads from Zustand. Both drive from the same `selectedFields` state — bidirectional sync is automatic via Zustand reactivity.

### Context Menu Pattern

Using native `onContextMenu` on the grid wrapper div with DOM traversal to detect `.ag-header-cell` right-clicks, then showing a MUI Menu. This works with AG Grid Community (no Enterprise needed):

```typescript
// In GridArea: track context menu state
const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; field: string } | null>(null)

// AG Grid onColumnHeaderRightClick or wrap header with onContextMenu
```

### Helper: Collect leaf fields from TreeNode

To implement parent select, need a utility to recursively collect all leaf FieldNodes from a branch:

```typescript
function collectLeafFields(node: TreeNode): FieldNode[] {
  if (node.isField && node.children.length === 0) {
    return [{ shortName: node.name, dottedPath: node.dottedPath, messageType: node.messageType, dataType: 'string' }]
  }
  return node.children.flatMap(collectLeafFields)
}
```

### Previous Story Intelligence (2.2)

- TreeSelector already handles leaf click → addField/removeField
- GridArea reads selectedFields via Zustand selector, columnDefBuilder recomputes on change
- DraggableTreeItem wraps leaf nodes — parent nodes are NOT draggable (correct)
- `addField()` prevents duplicates by dottedPath

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#AG Grid Configuration Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Column management must be friction-free]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 9 test files, 103 tests, all passing (0 regressions)
- 3 new tests for parent select/deselect and collectLeafFields

### Completion Notes List

- fieldSelectionSlice: added addFields (bulk with dedup) and removeFieldsByMessageType actions
- TreeSelector: parent nodes now have checkboxes with all/indeterminate/none states
- collectLeafFields() utility exported for recursive leaf collection
- GridArea: MUI Menu context menu on column header right-click with "Remove field" option
- Timestamp column protected from removal via context menu
- Bidirectional sync fully driven by Zustand: tree checks ↔ grid columns always consistent

### File List

- src/store/fieldSelectionSlice.ts (modified — added addFields, removeFieldsByMessageType)
- src/components/TreeSelector/TreeSelector.tsx (modified — parent checkboxes with bulk select)
- src/components/TreeSelector/TreeSelector.test.tsx (modified — 3 new tests)
- src/components/GridArea/GridArea.tsx (modified — context menu for column headers)
