# Story 5.2: Live Data Refresh with State Preservation

Status: done

## Story

As an analyst,
I want the extension to poll for new data every 10 seconds without disrupting my current view,
so that I see fresh data while maintaining my scroll position, filters, and sorts.

## Tasks / Subtasks

- [x] Task 1: Create useLiveRefresh hook
  - [x] 1.1: Polls every 10 seconds via setInterval
  - [x] 1.2: Diffs new data against existing by rowId — only inserts truly new rows
  - [x] 1.3: Merges new rows and re-sorts by timestamp
  - [x] 1.4: Sets newRowCount for StatusBar display
  - [x] 1.5: Pauses when document.hidden (tab not active)
  - [x] 1.6: On failure, retains last good data and records failure
  - [x] 1.7: No-op when no new data (no unnecessary re-renders)
- [x] Task 2: Wire into App.tsx

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- src/hooks/useLiveRefresh.ts (created)
- src/App.tsx (modified — added useLiveRefresh)
