# Story 5.3: Status Bar & New Data Indicators

Status: done

## Story

As an analyst,
I want to see the current grid state and know when new data arrives,
so that I'm always aware of what I'm looking at and what changed.

## Tasks / Subtasks

- [x] Task 1: Create StatusBar component
  - [x] 1.1: Shows row count, message type count, last refresh time
  - [x] 1.2: Green dot for active refresh (pulses when refreshing)
  - [x] 1.3: "+N new" in green text when new rows arrive
  - [x] 1.4: Orange "retry failed" on single failure
  - [x] 1.5: Red persistent error after 3 consecutive failures
- [x] Task 2: Add statusBarContent prop to PanelLayout
  - [x] 2.1: PanelLayout accepts statusBarContent ReactNode prop
  - [x] 2.2: Falls back to "Ready" when no content provided
- [x] Task 3: Wire StatusBar into App.tsx via PanelLayout
- [x] Task 4: Tests — 6 new tests covering all status states

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- src/components/StatusBar/StatusBar.tsx (created)
- src/components/StatusBar/StatusBar.test.tsx (created)
- src/components/PanelLayout/PanelLayout.tsx (modified — added statusBarContent prop)
- src/App.tsx (modified — passes StatusBar to PanelLayout)
