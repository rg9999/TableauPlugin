# Story 2.1: Field Hierarchy Parsing & Tree Rendering

Status: done

## Story

As an analyst,
I want to browse all available message types in a hierarchical tree view,
so that I can navigate nested field structures intuitively without memorizing dotted paths.

## Acceptance Criteria

1. **Given** the Tableau data source has columns with dotted-path names (e.g., `navigation.gps.position.latitude`), **when** the extension loads and calls `tableauAdapter.getDataSourceSchema()`, **then** `dataTransform.parseFieldHierarchy()` converts flat dotted paths into a `TreeNode` hierarchy
2. **Given** the hierarchy is parsed, **when** the TreeSelector component renders, **then** it displays the hierarchy using MUI TreeView with expand/collapse up to 6 levels deep (FR2)
3. **Given** a tree node is a leaf field, **when** it renders, **then** it shows the field short name and the full dotted path is visible in the tree (FR5)
4. **Given** a tree node is a message-type parent, **when** it renders, **then** it is expandable/collapsible with arrow indicators
5. **Given** the hierarchy is parsed, **when** subsequent renders occur, **then** the parsed hierarchy is cached (memoized) and not recomputed on every render
6. **Given** `parseFieldHierarchy()` is called with realistic dotted-path data, **when** unit tests run, **then** all tests pass confirming correct tree structure, depth handling, and edge cases

## Tasks / Subtasks

- [x] Task 1: Create `src/services/dataTransform.ts` with `parseFieldHierarchy()` (AC: #1, #5)
  - [x] 1.1: Implement `parseFieldHierarchy(columns: ColumnInfo[]): TreeNode` — converts flat `ColumnInfo[]` into `TreeNode` tree
  - [x] 1.2: Handle edge cases: empty columns, single-segment paths, duplicate prefixes, 6-level nesting
  - [x] 1.3: Sort nodes alphabetically at each level (message types first, fields after)
  - [x] 1.4: Set `isField: true` only on leaf nodes; set `messageType` on all nodes from the top-level segment
  - [x] 1.5: Memoize with a simple cache (same input → same output reference)
- [x] Task 2: Create `src/services/dataTransform.test.ts` with unit tests (AC: #6)
  - [x] 2.1: Test with `MOCK_SCHEMA` from `src/__mocks__/mockData.ts` — verify 15 message types produce correct tree
  - [x] 2.2: Test edge cases: empty array, single field, deeply nested (6 levels), fields sharing common prefixes
  - [x] 2.3: Test that leaf nodes have `isField: true`, branch nodes have `isField: false`
  - [x] 2.4: Test that `messageType` is set correctly on all nodes
  - [x] 2.5: Test memoization — same input returns same reference
- [x] Task 3: Populate `src/store/fieldSelectionSlice.ts` with state and actions (AC: #5)
  - [x] 3.1: Add state: `selectedFields: FieldNode[]`, `fieldHierarchy: TreeNode | null`
  - [x] 3.2: Add actions: `addField(field: FieldNode)`, `removeField(fieldPath: string)`, `setFieldHierarchy(hierarchy: TreeNode)`, `clearAllFields()`
  - [x] 3.3: Ensure `addField` prevents duplicates (check by `dottedPath`)
  - [x] 3.4: Update `AppState` type in `src/store/store.ts` if needed
- [x] Task 4: Create `src/components/TreeSelector/TreeSelector.tsx` (AC: #2, #3, #4)
  - [x] 4.1: Built custom recursive tree with MUI List/ListItemButton/Collapse (no @mui/x-tree-view needed)
  - [x] 4.2: Render branch nodes with expand/collapse arrows; render leaf nodes with checkboxes
  - [x] 4.3: Show `node.name` as the display text for all nodes
  - [x] 4.4: Show full `dottedPath` on leaf nodes as secondary text + MUI Tooltip (FR5)
  - [x] 4.5: Read `fieldHierarchy` from Zustand `useStore(state => state.fieldHierarchy)`
  - [x] 4.6: Read `selectedFields` from Zustand to show selected state on leaf nodes
  - [x] 4.7: On leaf node click/check, call `addField()` or `removeField()` depending on current selection state
- [x] Task 5: Create `src/hooks/useFieldHierarchy.ts` — load and parse schema on mount (AC: #1, #5)
  - [x] 5.1: Call `tableauAdapter.getDataSourceSchema()` on mount
  - [x] 5.2: Pass result through `dataTransform.parseFieldHierarchy()`
  - [x] 5.3: Store result in Zustand via `setFieldHierarchy()`
  - [x] 5.4: Handle errors: catch `TableauDataError`, log via `logger.warn`, set hierarchy to null
  - [x] 5.5: Use `useRef` guard to avoid re-parsing on re-renders
- [x] Task 6: Wire TreeSelector into PanelLayout (AC: #2)
  - [x] 6.1: In `App.tsx`, call `useFieldHierarchy()` to load schema on init
  - [x] 6.2: Pass `<TreeSelector />` as `treeContent` prop to `<PanelLayout />`
  - [x] 6.3: Verify tree renders in the 240px left panel
- [x] Task 7: Create `src/components/TreeSelector/TreeSelector.test.tsx` (AC: #2, #3, #4)
  - [x] 7.1: Test that TreeSelector renders hierarchy from mock data
  - [x] 7.2: Test expand/collapse of parent nodes
  - [x] 7.3: Test that leaf nodes show field short names
  - [x] 7.4: Test that clicking a leaf node dispatches `addField` action

## Dev Notes

### Architecture Compliance

**File locations (MUST follow exactly):**
- `src/services/dataTransform.ts` — pure function service, no React dependency
- `src/services/dataTransform.test.ts` — co-located test
- `src/components/TreeSelector/TreeSelector.tsx` — component
- `src/components/TreeSelector/TreeSelector.test.tsx` — co-located test
- `src/hooks/useFieldHierarchy.ts` — shared hook (will be used by multiple components)
- `src/store/fieldSelectionSlice.ts` — modify existing skeleton

**Naming conventions:**
- Functions: `parseFieldHierarchy()` (verb-first camelCase)
- Interfaces: `TreeNode`, `FieldNode` (PascalCase) — already defined in `src/models/fieldHierarchy.ts`
- Component event handlers: `handleNodeToggle`, `handleFieldSelect` (handle prefix)
- Boolean state: `isExpanded`, `isSelected` (is/has prefix)

**Boundaries:**
- `dataTransform.ts` must NOT import React or Zustand — pure functions only
- `TreeSelector.tsx` must NOT import `tableau.extensions` — get data from Zustand store
- Use `useStore(state => state.fieldHierarchy)` selector pattern — never destructure entire store

### Data Transformation — `parseFieldHierarchy()`

**Input:** `ColumnInfo[]` from `tableauAdapter.getDataSourceSchema()`
- Each `ColumnInfo` has `fieldName` (dotted path like `navigation.gps.position.latitude`), `dataType`, and `role`

**Output:** `TreeNode` (root node with children representing the full hierarchy)

**Algorithm:**
1. For each `ColumnInfo`, split `fieldName` by `.` to get path segments
2. Walk/create the tree: for each segment, find or create a child `TreeNode`
3. The first segment is the `messageType` for all descendant nodes
4. Only the terminal (leaf) segment gets `isField: true`
5. All intermediate segments get `isField: false`
6. The root `TreeNode` has `name: "root"`, `dottedPath: ""`, and all message types as children

**Example:**
```
Input columns: ["navigation.gps.position.latitude", "navigation.gps.position.longitude", "sensors.radar.track.target_id"]

Output tree:
root
├── navigation (isField: false, messageType: "navigation")
│   └── gps
│       └── position
│           ├── latitude (isField: true, messageType: "navigation")
│           └── longitude (isField: true, messageType: "navigation")
└── sensors (isField: false, messageType: "sensors")
    └── radar
        └── track
            └── target_id (isField: true, messageType: "sensors")
```

### Existing Code to Reuse

**MUST use these existing types — do NOT redefine:**
- `TreeNode` from `src/models/fieldHierarchy.ts` (lines 1-13)
- `FieldNode` from `src/models/fieldHierarchy.ts` (lines 15-25)
- `ColumnInfo` from `src/models/tableauTypes.ts` (lines 7-14)

**MUST use these existing services:**
- `tableauAdapter.getDataSourceSchema()` from `src/services/tableauAdapter.ts` — returns `Promise<ColumnInfo[]>`
- `logger` from `src/utils/logger.ts` — for error/debug logging

**MUST use this mock data for tests:**
- `MOCK_SCHEMA` from `src/__mocks__/mockData.ts` — 124+ columns with realistic dotted paths across 15 message types

**MUST modify this existing file:**
- `src/store/fieldSelectionSlice.ts` — currently an empty skeleton, populate with state and actions

### MUI TreeView — Library Notes

**Installed packages:** `@mui/material@^7.3.9`, `@mui/icons-material@^7.3.9`

**IMPORTANT:** MUI v7 moved TreeView to `@mui/x-tree-view`. Check if `@mui/x-tree-view` is installed in `package.json`. If NOT installed:
- Install `@mui/x-tree-view` as a dependency
- Import: `import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'`
- OR use `RichTreeView` with items array for data-driven rendering

**If @mui/x-tree-view is NOT available**, fall back to building a custom recursive tree with MUI `List`, `ListItem`, `ListItemButton`, `Collapse`, and `IconButton` components. This is straightforward and avoids adding a dependency.

**Tree node rendering pattern:**
```typescript
// Each TreeNode maps to a TreeItem (or recursive ListItem)
// nodeId should be the dottedPath (unique identifier)
// label shows node.name
// Leaf nodes additionally show selection state (checkbox or highlight)
```

### Performance Considerations

- `parseFieldHierarchy()` runs ONCE on schema load — cache the result
- TreeSelector renders ~200 top-level nodes, each with nested children — use `React.memo` on tree item components
- MUI TreeView handles virtualization for large trees — leverage built-in performance
- Do NOT re-parse hierarchy on every render — store in Zustand and read via selector

### Testing Standards

- Test framework: Vitest (already configured)
- Component tests: `@testing-library/react` (already installed)
- Co-locate tests: `*.test.ts` / `*.test.tsx` next to source files
- Use `MOCK_SCHEMA` from `src/__mocks__/mockData.ts` for realistic test data
- Use `mockTableauAdapter` from `src/__mocks__/mockTableauAdapter.ts` for adapter mocking

### Previous Story Intelligence

**From Story 1.4 (Tableau API Adapter):**
- `tableauAdapter.getDataSourceSchema()` uses `getSummaryColumnsInfoAsync()` internally
- Returns `ColumnInfo[]` with `fieldName` (dotted path), `dataType`, `role`
- Errors throw `TableauDataError` — handle this in `useFieldHierarchy`
- The adapter is the SOLE entry point for Tableau API — never call `tableau.extensions` directly
- 18 adapter tests provide good coverage — follow the same mock pattern

**From Story 1.5 (Mock Data):**
- `MOCK_SCHEMA` contains 124+ columns across 15 message types
- Message types include: navigation.gps.position, navigation.ins, sensors.radar.track, etc.
- Array fields exist in `sensors.radar.track.history` and `payload.status.stations`
- All mock data is typed with production interfaces

**From Story 1.3 (PanelLayout):**
- `PanelLayout` accepts `treeContent?: ReactNode` prop — pass `<TreeSelector />` here
- Tree panel is 240px default width, 32px when collapsed
- Auto-collapses below 600px zone width
- ResizeHandle between tree and grid already implemented

### Project Structure Notes

- Alignment with unified project structure: all new files go in established directories
- `src/services/dataTransform.ts` is specified in architecture — this is the correct location
- `src/components/TreeSelector/` directory already exists (empty stub) — create files there
- `src/hooks/useFieldHierarchy.ts` goes in shared hooks since multiple components may need hierarchy state

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — parseFieldHierarchy()]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns — Structure Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience]
- [Source: _bmad-output/implementation-artifacts/1-4-tableau-api-adapter-service.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 8 test files, 95 tests, all passing (0 regressions)
- 13 dataTransform tests: hierarchy parsing, edge cases, memoization
- 7 TreeSelector tests: rendering, expand/collapse, selection, dispatch

### Completion Notes List

- dataTransform.ts: `parseFieldHierarchy()` pure function with module-level memoization cache
- Sort order: branches before leaves, alphabetical within each group
- fieldSelectionSlice.ts: populated with selectedFields/fieldHierarchy state and addField/removeField/setFieldHierarchy/clearAllFields actions
- addField prevents duplicates by dottedPath check
- TreeSelector.tsx: custom recursive tree using MUI List/Collapse (no @mui/x-tree-view dependency needed)
- TreeNodeItem is React.memo'd for performance with ~200 message types
- Leaf nodes show checkboxes + secondary text with full dotted path + MUI Tooltip
- useFieldHierarchy.ts: loads schema via tableauAdapter, parses, stores in Zustand, with useRef guard and error handling
- App.tsx: wired useFieldHierarchy() + TreeSelector as treeContent prop to PanelLayout

### File List

- src/services/dataTransform.ts (created)
- src/services/dataTransform.test.ts (created)
- src/store/fieldSelectionSlice.ts (modified — populated from skeleton)
- src/components/TreeSelector/TreeSelector.tsx (created)
- src/components/TreeSelector/TreeSelector.test.tsx (created)
- src/hooks/useFieldHierarchy.ts (created)
- src/App.tsx (modified — added useFieldHierarchy + TreeSelector)
