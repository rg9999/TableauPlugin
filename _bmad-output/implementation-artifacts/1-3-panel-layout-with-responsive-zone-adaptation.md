# Story 1.3: Panel Layout with Responsive Zone Adaptation

Status: done

## Story

As an analyst,
I want a three-panel layout (tree + grid + detail) that adapts to my Tableau dashboard zone size,
so that I can use the extension in any dashboard layout without content being cut off.

## Acceptance Criteria

1. PanelLayout renders tree panel (240px default), grid (fills remaining), detail area (hidden by default)
2. ResizeHandle between tree and grid allows dragging to resize
3. Double-clicking resize handle collapses tree to 32px icon strip with vertical "Fields" label
4. Clicking collapsed strip re-expands to previous width
5. Zone width 400-600px: tree starts collapsed
6. Zone width below 400px: tree auto-collapses to 32px
7. Zone height below 300px: detail panel disabled
8. Empty state: centered hint "Drag fields from the tree to start exploring"

## Tasks / Subtasks

- [x] Task 1: PanelLayout component with flexbox layout (AC: #1)
- [x] Task 2: ResizeHandle with drag-to-resize (AC: #2)
- [x] Task 3: Tree panel collapse/expand (AC: #3, #4)
- [x] Task 4: Zone-responsive behavior (AC: #5, #6, #7)
- [x] Task 5: Empty state for grid area (AC: #8)
- [x] Task 6: Tests — 11 PanelLayout tests + 2 App tests

## Dev Notes

### Architecture
- PanelLayout is a custom React component using CSS flexbox
- Uses design tokens from designTokens.ts (LAYOUT.treePanelWidth, LAYOUT.treePanelCollapsedWidth, etc.)
- ResizeHandle: mouse drag on border between tree and grid panels
- ResizeObserver or Tableau zone resize events for responsive behavior
- Tree panel content will be placeholder for now — actual TreeSelector is Epic 2
- Grid panel content will be placeholder — actual AG Grid is Epic 3
- Detail panel area reserved but hidden by default — activated in Epic 4

### Files
- src/components/PanelLayout/PanelLayout.tsx (created)
- src/components/PanelLayout/PanelLayout.test.tsx (created)
- src/components/PanelLayout/ResizeHandle.tsx (created)
- src/App.tsx (modified — use PanelLayout)

### References
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout Foundation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 3 test files, 22 tests, all passing
- Build: 333KB JS + 215KB CSS

### Completion Notes List

- PanelLayout: three-panel flex layout (tree + grid + detail) with status bar
- ResizeHandle: mouse-drag resize between tree and grid panels
- Tree collapse: double-click handle to collapse to 32px strip, click strip to expand
- Zone-responsive: auto-collapse below 600px width, detail disabled below 300px height
- Empty state: centered "Drag fields from the tree to start exploring" hint
- ResizeObserver mock added to test-setup.ts for jsdom compatibility
- App.tsx updated to use PanelLayout as root component

### File List

- src/components/PanelLayout/PanelLayout.tsx (created)
- src/components/PanelLayout/PanelLayout.test.tsx (created)
- src/components/PanelLayout/ResizeHandle.tsx (created)
- src/App.tsx (modified — use PanelLayout)
- src/App.test.tsx (modified — test PanelLayout integration)
- src/test-setup.ts (modified — ResizeObserver mock)
