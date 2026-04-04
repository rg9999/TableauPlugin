# Story 4.1: Column Sorting & Filtering

Status: done

## Story

As an analyst,
I want to sort and filter the grid by any column,
so that I can focus on specific data patterns and find anomalies quickly.

## Tasks / Subtasks

- [x] Task 1: Enable AG Grid sorting and filtering
  - [x] 1.1: Added `sortable: true` and `filter: true` to all column defs in columnDefBuilder
  - [x] 1.2: AG Grid provides built-in sort (click header: asc → desc → none) with sort indicators
  - [x] 1.3: AG Grid provides built-in filter popup on column header filter icon
- [x] Task 2: Sync sort/filter state to Zustand
  - [x] 2.1: Added `sortModel`, `filterModel`, `setSortModel`, `setFilterModel`, `clearFilters` to gridSlice
  - [x] 2.2: Added `onSortChanged` handler — extracts sort state from AG Grid API → Zustand
  - [x] 2.3: Added `onFilterChanged` handler — extracts filter model → Zustand
- [x] Task 3: Clear all filters action
  - [x] 3.1: Added "Clear all filters" option to column header context menu
  - [x] 3.2: Calls `gridApi.setFilterModel(null)` which triggers onFilterChanged → Zustand sync
- [x] Task 4: Row click handling (prep for Story 4.2)
  - [x] 4.1: Added `onRowClicked` handler and `onRowClick` prop to GridArea
  - [x] 4.2: Selected row highlighted with accent background (8% opacity)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- src/store/gridSlice.ts (modified — added sortModel, filterModel, setSortModel, setFilterModel, clearFilters)
- src/components/GridArea/GridArea.tsx (modified — sort/filter event handlers, row click, clear filters menu item)
- src/components/GridArea/columnDefBuilder.ts (modified — sortable + filter on all columns)
