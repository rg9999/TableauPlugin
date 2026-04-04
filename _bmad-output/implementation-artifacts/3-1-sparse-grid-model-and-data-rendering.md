# Story 3.1: Sparse Grid Model & Data Rendering

Status: done

## Story

As an analyst,
I want to see selected fields from multiple message types in a single grid interleaved by time,
so that I can correlate events across different data streams in one view.

## Acceptance Criteria

1. `dataTransform.buildSparseGridModel()` transforms flat Tableau data (FlatRowData[]) into GridRowData[] — rows ordered by timestamp, only fields from each row's message type populated, others blank
2. AG Grid column definitions built via `columnDefBuilder` from Zustand selectedFields state (already done in 2.2)
3. Column headers show short field names with full dotted path in tooltips (already done in 2.2)
4. Timestamp column pinned left with subtle blue tint and sort ascending by default (already done in 2.2)
5. `buildSparseGridModel()` has unit tests with multi-message-type test data
6. GridArea displays actual row data from Zustand store

## Tasks / Subtasks

- [x] Task 1: Implement buildSparseGridModel in dataTransform.ts (AC: #1)
  - [x] 1.1: Added `buildSparseGridModel(rows, selectedFields)` returning GridRowData[]
  - [x] 1.2: Creates GridRowData with rowId, timestamp, messageType; only includes selected fields present in each row
  - [x] 1.3: Sorts output by timestamp ascending
- [x] Task 2: Write tests for buildSparseGridModel (AC: #5)
  - [x] 2.1: Tested with MOCK_ROWS_100 and 3 fields from 2 message types
  - [x] 2.2: Verified timestamp sort order
  - [x] 2.3: Verified sparse model — only matching fields populated
  - [x] 2.4: Tested empty inputs
  - [x] 2.5: Verified unique rowIds
- [x] Task 3: Add grid data to Zustand and wire into GridArea (AC: #6)
  - [x] 3.1: Added `gridData` and `setGridData` to gridSlice
  - [x] 3.2: Created `useTableauData` hook — loads data, transforms, stores
  - [x] 3.3: GridArea reads gridData from store

## Dev Notes

### buildSparseGridModel algorithm

```
For each FlatRowData row:
  1. Extract timestamp, messageType from row
  2. Generate rowId = `${timestamp}-${messageType}-${index}`
  3. For each selectedField:
     - If field.messageType matches row.messageType AND row[field.dottedPath] exists:
       → include in GridRowData
     - Else: field is absent (sparse — AG Grid shows blank)
  4. Sort all GridRowData by timestamp ascending
```

**Key insight:** The `messageType` field in FlatRowData uses the full dotted prefix (e.g., "navigation.gps.position"), while FieldNode.messageType is the first segment only (e.g., "navigation"). Need to check if the row's field path starts with the selected field's path prefix.

Actually looking at mock data more carefully: `row.messageType` = "navigation.gps.position" and `row["navigation.gps.position.latitude"]` = value. A selected FieldNode has `dottedPath: "navigation.gps.position.latitude"`. So the check is: does `row[field.dottedPath]` exist (is not undefined)?

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — buildSparseGridModel()]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 9 test files, 116 tests, all passing

### Completion Notes List

- buildSparseGridModel: transforms FlatRowData[] + FieldNode[] → GridRowData[] (sparse model, sorted by timestamp)
- gridSlice: populated with gridData state and setGridData action
- useTableauData: fetches from adapter, transforms, stores in Zustand; re-fetches on selectedFields change
- GridArea now reads gridData from Zustand store

### File List

- src/services/dataTransform.ts (modified — added buildSparseGridModel)
- src/services/dataTransform.test.ts (modified — 6 new tests)
- src/store/gridSlice.ts (modified — populated from skeleton)
- src/hooks/useTableauData.ts (created)
- src/components/GridArea/GridArea.tsx (modified — reads gridData)
- src/App.tsx (modified — added useTableauData)
