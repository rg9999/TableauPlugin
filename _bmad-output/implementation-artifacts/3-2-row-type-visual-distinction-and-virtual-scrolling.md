# Story 3.2: Row-Type Visual Distinction & Virtual Scrolling

Status: done

## Story

As an analyst,
I want to visually distinguish which message type each row belongs to and scroll smoothly through large datasets,
so that I can scan patterns across interleaved data without confusion.

## Tasks / Subtasks

- [x] Task 1: Message type color stripes on grid rows
  - [x] 1.1: Created messageTypeColors.ts utility — maps message type to 8-color palette via deterministic hash
  - [x] 1.2: Added getRowStyle to AG Grid — applies 4px left border with message type color (UX-DR11)
  - [x] 1.3: Same top-level category always gets same color
- [x] Task 2: Virtual scrolling and performance
  - [x] 2.1: AG Grid handles virtual scrolling natively (rowBuffer=20 for smooth scroll)
  - [x] 2.2: Set rowHeight=28 for dense display
  - [x] 2.3: getRowId uses rowId field for stable row identity
- [x] Task 3: Tests
  - [x] 3.1: getMessageTypeColor returns valid hex color
  - [x] 3.2: Same category returns same color
  - [x] 3.3: Different categories produce colors (string validation)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 9 test files, 119 tests, all passing

### Completion Notes List

- messageTypeColors.ts: deterministic hash maps top-level message type to 8-color palette
- GridArea: getRowStyle applies 4px left border per message type
- AG Grid: getRowId for stable identity, rowBuffer=20, rowHeight=28

### File List

- src/components/GridArea/GridArea.tsx (modified — getRowStyle, getRowId, rowBuffer, rowHeight)
- src/components/GridArea/messageTypeColors.ts (created)
- src/components/GridArea/GridArea.test.tsx (modified — 3 new tests)
