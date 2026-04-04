# Story 6.1: State Persistence via Tableau Settings API

Status: done

## Story

As an analyst, I want my field selections and configuration to persist when I save the Tableau workbook, so that I don't have to reconfigure the extension every time I open the dashboard.

## Tasks / Subtasks

- [x] Task 1: Populate settingsSlice — isSavingSettings, settingsLoaded states
- [x] Task 2: Create useSettingsPersistence hook
  - [x] 2.1: On init (when hierarchy loaded), loads settings from Tableau adapter
  - [x] 2.2: Resolves saved field paths back to FieldNode objects via tree walk
  - [x] 2.3: Restores field selections via addFields
  - [x] 2.4: Debounced save (2s) on selectedFields changes
  - [x] 2.5: Uses compact format (paths only) to stay under ~2MB limit
  - [x] 2.6: Graceful degradation — corrupted settings → empty state
- [x] Task 3: Wire into App.tsx

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- src/store/settingsSlice.ts (modified — populated)
- src/hooks/useSettingsPersistence.ts (created)
- src/App.tsx (modified)
