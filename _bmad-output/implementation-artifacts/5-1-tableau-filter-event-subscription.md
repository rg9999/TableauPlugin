# Story 5.1: Tableau Filter Event Subscription

Status: done

## Story

As an analyst,
I want the extension to update when I change Tableau dashboard filters,
so that the extension data always matches the time range and filters I've set in the dashboard.

## Tasks / Subtasks

- [x] Task 1: Populate refreshSlice with state and actions
  - [x] 1.1: isRefreshing, lastRefreshTime, newRowCount, consecutiveFailures, errorMessage
  - [x] 1.2: recordRefreshFailure increments consecutive failures
  - [x] 1.3: recordRefreshSuccess resets failures and updates lastRefreshTime
- [x] Task 2: Create useTableauFilters hook
  - [x] 2.1: Subscribes to filter changes via tableauAdapter.subscribeToFilterChange()
  - [x] 2.2: On filter change, re-queries data and rebuilds sparse grid model
  - [x] 2.3: On failure, retains last good data and records failure in refresh state
  - [x] 2.4: Cleans up subscription on unmount
- [x] Task 3: Wire into App.tsx

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- src/store/refreshSlice.ts (modified — populated from skeleton)
- src/hooks/useTableauFilters.ts (created)
- src/App.tsx (modified — added useTableauFilters)
