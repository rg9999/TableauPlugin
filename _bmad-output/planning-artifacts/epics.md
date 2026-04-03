---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
inputDocuments: [prd.md, architecture.md, ux-design-specification.md]
---

# TableauPlugin - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for TableauPlugin, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Analyst can browse all available message types in a hierarchical tree view organized by message structure
FR2: Analyst can expand and collapse tree nodes to navigate nested field hierarchies (up to 6 levels)
FR3: Analyst can select/deselect individual fields from any message type for display in the grid
FR4: Analyst can select/deselect entire message types (selecting all fields within that type)
FR5: Analyst can see the full dotted path of any field in the tree view
FR6: Analyst can search or filter within the tree selector to find fields by name
FR7: Analyst can view selected fields from multiple message types in a single grid, interleaved by time (mixed-line sparse model)
FR8: Analyst can see short field names as column headers with full dotted paths available in tooltips
FR9: Analyst can view rows where only the columns belonging to that row's message type are populated (others blank)
FR10: Analyst can distinguish which message type each row belongs to
FR11: Analyst can scroll through up to 35K rows with virtual scrolling
FR12: Analyst can click any row to open a detail view showing all fields and values for that message instance
FR13: Analyst can expand and collapse nested field groups within the row detail tree view
FR14: Analyst can view array fields as a single cell value in the grid
FR15: Analyst can click an array cell to expand and drill into its contents
FR16: Analyst can sort the grid by any column (ascending/descending)
FR17: Analyst can filter the grid by column values
FR18: Analyst can apply multiple simultaneous filters across different columns
FR19: Analyst can clear individual or all filters
FR20: Extension responds to Tableau dashboard time filter changes by updating displayed data
FR21: Extension responds to other Tableau dashboard filter changes (non-time filters)
FR22: Extension receives data exclusively through the Tableau Extensions API (no direct database access)
FR23: Extension uses Tableau's authentication — no separate login required
FR24: Analyst's field selections and configuration persist when the Tableau workbook is saved
FR25: Analyst's field selections and configuration restore when a saved workbook is reopened
FR26: Extension polls for new data at a configurable interval (default 10 seconds)
FR27: New data rows are inserted in correct time-order position in the grid
FR28: Active filters, sorts, and scroll position are preserved during refresh
FR29: Analyst can see a visual indicator when new data has arrived
FR30: Analyst can add the extension to any Tableau dashboard as a dashboard zone
FR31: Extension adapts its layout to the dashboard zone size
FR32: Analyst can collapse the tree selector panel to maximize grid display space
FR33: Analyst can publish dashboards containing the extension to Tableau Server
FR34: IT team can deploy the extension to Tableau Server as a self-contained package
FR35: IT team can register the extension on the Tableau Server allowlist
FR36: Extension operates with zero external network requests (air-gapped compatible)
FR37: IT team can update the extension to a new version without disrupting existing dashboards

### NonFunctional Requirements

NFR1: Grid initial render (10K rows) < 5 seconds
NFR2: Grid initial render (35K rows) functional with acceptable degradation
NFR3: Filter/sort response < 2 seconds
NFR4: Scroll rendering < 250ms (virtual scrolling)
NFR5: Live refresh cycle every 10 seconds without disrupting view state
NFR6: Tree selector expand/collapse < 200ms
NFR7: Row detail tree open < 1 second
NFR8: Extension initial load < 10 seconds
NFR9: Extension inherits Tableau's authentication — no separate credential handling
NFR10: No data leaves the Tableau Server environment — all processing in-browser
NFR11: Extension does not make any external network requests (air-gapped)
NFR12: No user data cached outside the Tableau session
NFR13: Tableau Extensions API — sole data interface; conform to current stable API contract
NFR14: Tableau Filter Events — subscribe to filter change events and re-query accordingly
NFR15: Tableau Settings API — persist extension configuration with the workbook
NFR16: Extension Manifest (.trex) — conform to Tableau extension specification
NFR17: Extension handles Tableau filter changes gracefully — no crashes, no data loss
NFR18: Failed data refresh retains last successful data and retries on next cycle
NFR19: Unrecoverable errors display clear error message rather than blank/broken UI
NFR20: Extension handles edge cases: zero rows, single message type, all blank columns, deeply nested arrays
NFR21: Extension is fully self-contained — single deployable package
NFR22: Package size minimized while maintaining air-gapped functionality
NFR23: Deployment requires no Tableau Server config beyond allowlisting
NFR24: Version updates deployable without requiring dashboard reconfiguration

### Additional Requirements

- ARCH-1: Project scaffolded with Vite + React + TypeScript (npm create vite@latest -- --template react-ts)
- ARCH-2: AG Grid Enterprise, MUI, Zustand, @dnd-kit installed and configured
- ARCH-3: Tableau Extensions API types installed (@tableau/extensions-api-types v1.15.0)
- ARCH-4: Zustand store with slices: fieldSelectionSlice, gridSlice, refreshSlice, settingsSlice
- ARCH-5: tableauAdapter service — single entry point for all Tableau API calls; no component imports tableau.extensions directly
- ARCH-6: DataTransformService with pure functions: parseFieldHierarchy(), buildSparseGridModel(), reconstructNestedObject()
- ARCH-7: @dnd-kit DndContext wrapping TreeSelector + GridArea at App level
- ARCH-8: AG Grid column definitions built via columnDefBuilder from Zustand state
- ARCH-9: Vite configured for air-gapped single-bundle output (base: './', no externals, no code splitting)
- ARCH-10: .trex manifest file for Tableau Server registration
- ARCH-11: Typed error classes (TableauConnectionError, TableauDataError, SettingsPersistError)
- ARCH-12: Logger utility replacing console.log with levels
- ARCH-13: Vitest configured for testing; tests co-located with components
- ARCH-14: ESLint + Prettier configured
- ARCH-15: Tableau Settings API payload size guard in settingsSlice

### UX Design Requirements

UX-DR1: Implement shared design tokens file (designTokens.ts) with color palette, spacing scale, and typography constants consumed by both AG Grid theme and MUI theme
UX-DR2: Configure AG Grid theme (Balham or Alpine base) customized with Tableau-harmonious colors matching design tokens
UX-DR3: Configure MUI createTheme to match AG Grid palette, typography, and spacing from shared design tokens
UX-DR4: Implement PanelLayout component — three-panel flex layout (tree 240px + grid + detail 180px) with ResizeHandle components and collapse/expand behavior
UX-DR5: Tree panel collapses to 32px icon strip with vertical "▶ Fields" label; one click to re-expand to previous width
UX-DR6: Row detail panel hidden by default; appears at bottom on row click (180px); closeable with ✕ button
UX-DR7: Zone-responsive layout — tree auto-collapses below 400px zone width; detail panel disabled below 300px zone height
UX-DR8: Implement DraggableTreeItem component wrapping MUI TreeItem with @dnd-kit useDraggable — ghost preview shows field short name in accent pill
UX-DR9: Implement DropZoneOverlay on grid header — 3px accent insertion line between columns during drag; accent 20% opacity highlight on drop zone
UX-DR10: Drag-back-to-remove — dropping grid column header on tree panel area removes the field; tree node checkmark clears
UX-DR11: Implement message-type color stripes — 4px left border on grid rows using Tableau categorical palette (8 colors defined in design tokens)
UX-DR12: Implement StatusBar component (24px fixed bottom) — row count, message type count, new row count in green, last refresh time, green dot for active refresh, red/orange for errors
UX-DR13: Empty state for grid — centered hint: "Drag fields from the tree to start exploring" with directional icon
UX-DR14: New data row highlighting — subtle green tint (#E8F4E8) on newly inserted rows that fades after 3 seconds via CSS transition
UX-DR15: Column context menu (MUI Menu) — right-click grid column header → "Remove field" option
UX-DR16: Column header tooltips (MUI Tooltip) — hover on column header shows full dotted path

### FR Coverage Map

| FR | Epic | Description |
|----|------|------------|
| FR1 | Epic 2 | Tree view browsing message types |
| FR2 | Epic 2 | Tree expand/collapse nested hierarchies |
| FR3 | Epic 2 | Select/deselect individual fields |
| FR4 | Epic 2 | Select/deselect entire message types |
| FR5 | Epic 2 | Full dotted path visible in tree |
| FR6 | Epic 2 | Search/filter within tree |
| FR7 | Epic 3 | Mixed-line sparse grid display |
| FR8 | Epic 3 | Short column headers with tooltip paths |
| FR9 | Epic 3 | Sparse rows (blank for non-matching types) |
| FR10 | Epic 3 | Visual distinction between row types |
| FR11 | Epic 3 | Virtual scrolling up to 35K rows |
| FR12 | Epic 4 | Click row to open detail view |
| FR13 | Epic 4 | Expand/collapse in row detail tree |
| FR14 | Epic 3 | Array fields as single cell value |
| FR15 | Epic 3 | Array click-to-expand |
| FR16 | Epic 4 | Sort by any column |
| FR17 | Epic 4 | Filter by column values |
| FR18 | Epic 4 | Multiple simultaneous filters |
| FR19 | Epic 4 | Clear individual/all filters |
| FR20 | Epic 5 | Respond to Tableau time filter |
| FR21 | Epic 5 | Respond to other Tableau filters |
| FR22 | Epic 1 | Data via Tableau Extensions API only |
| FR23 | Epic 1 | Tableau authentication inherited |
| FR24 | Epic 6 | State persists on workbook save |
| FR25 | Epic 6 | State restores on workbook reopen |
| FR26 | Epic 5 | Poll for new data (10-second interval) |
| FR27 | Epic 5 | New rows inserted in time-order |
| FR28 | Epic 5 | Filters/sorts/scroll preserved on refresh |
| FR29 | Epic 5 | Visual indicator for new data |
| FR30 | Epic 1 | Add extension to Tableau dashboard |
| FR31 | Epic 1 | Layout adapts to dashboard zone size |
| FR32 | Epic 4 | Collapse tree selector panel |
| FR33 | Epic 6 | Publish dashboards to Tableau Server |
| FR34 | Epic 6 | Deploy as self-contained package |
| FR35 | Epic 6 | Register on Tableau Server allowlist |
| FR36 | Epic 1 | Zero external network requests |
| FR37 | Epic 6 | Update without disrupting dashboards |

## Epic List

### Epic 1: Project Foundation & Extension Shell
A working Tableau Dashboard Extension that loads inside a Tableau dashboard, initializes the Tableau Extensions API, and displays a three-panel layout (tree + grid + detail) — the skeleton that everything else plugs into.
**FRs covered:** FR22, FR23, FR30, FR31, FR36
**Additional:** ARCH-1 through ARCH-14, UX-DR1 through UX-DR5, UX-DR7, UX-DR13

### Epic 2: Field Selection & Tree Navigation
Analysts can browse ~200 message types in a hierarchical tree, search/filter, and drag fields to the grid. The tree-grid selection state stays in sync bidirectionally.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**Additional:** ARCH-5, ARCH-6 (parseFieldHierarchy), ARCH-7, UX-DR8, UX-DR9, UX-DR10

### Epic 3: Mixed-Line Data Grid
Analysts see selected fields from multiple message types interleaved by time in a sparse grid. Rows are visually distinguished by message type. Analysts can scroll through up to 35K rows with responsive virtual scrolling.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR14, FR15
**Additional:** ARCH-6 (buildSparseGridModel), ARCH-8, UX-DR11, UX-DR15, UX-DR16

### Epic 4: Grid Interaction — Filtering, Sorting & Row Detail
Analysts can sort, filter, and inspect any row. Clicking a row opens a detail panel showing the full nested message structure with expand/collapse.
**FRs covered:** FR12, FR13, FR16, FR17, FR18, FR19, FR32
**Additional:** ARCH-6 (reconstructNestedObject), UX-DR6

### Epic 5: Tableau Filter Integration & Live Refresh
The extension responds to Tableau dashboard filters (especially time filter) and polls for new data every 10 seconds. New rows appear in the grid without disrupting the analyst's scroll position, filters, or sorts.
**FRs covered:** FR20, FR21, FR26, FR27, FR28, FR29
**Additional:** UX-DR12, UX-DR14

### Epic 6: State Persistence & Deployment
Analysts' field selections and configuration persist when they save the Tableau workbook. IT team can deploy the extension as a self-contained air-gapped package to Tableau Server.
**FRs covered:** FR24, FR25, FR33, FR34, FR35, FR37
**Additional:** ARCH-9, ARCH-10, ARCH-15

## Epic 1: Project Foundation & Extension Shell

A working Tableau Dashboard Extension that loads inside a Tableau dashboard, initializes the Tableau Extensions API, and displays a three-panel layout with theming — the skeleton that everything else plugs into.

### Story 1.1: Project Scaffold & Tableau Extension Initialization

As a developer,
I want a Vite + React + TypeScript project with Tableau Extensions API initialized,
So that the extension loads inside a Tableau dashboard and establishes the foundation for all features.

**Acceptance Criteria:**

**Given** the project is scaffolded with `npm create vite@latest -- --template react-ts`
**When** all dependencies are installed (AG Grid Enterprise, MUI, Zustand, @dnd-kit, @tableau/extensions-api-types)
**Then** the project compiles with zero errors in TypeScript strict mode
**And** ESLint + Prettier are configured and pass on all files
**And** Vitest is configured with a passing smoke test
**And** a valid `manifest.trex` file exists in `public/`
**And** `src/main.tsx` calls `tableau.extensions.initializeAsync()` on load
**And** the extension loads successfully inside a Tableau dashboard zone (or tabextsandbox)
**And** the Zustand store skeleton exists with empty slices (fieldSelection, grid, refresh, settings)
**And** the logger utility exists in `src/utils/logger.ts`
**And** typed error classes exist in `src/models/errors.ts`

### Story 1.2: Design Tokens & Theming

As a developer,
I want shared design tokens consumed by both AG Grid and MUI themes,
So that the extension has a consistent, Tableau-harmonious visual identity.

**Acceptance Criteria:**

**Given** the design tokens file exists at `src/theme/designTokens.ts`
**When** the tokens define colors (base palette, semantic colors, message-type stripe palette), spacing (4px grid), and typography (system font stack, type scale)
**Then** `src/theme/muiTheme.ts` creates a MUI theme consuming these tokens
**And** `src/theme/agGridTheme.ts` configures AG Grid (Balham or Alpine base) consuming these tokens
**And** the MUI theme and AG Grid theme produce visually consistent results (matching fonts, colors, spacing)
**And** the 8-color message-type stripe palette is defined as an exportable array

### Story 1.3: Panel Layout with Responsive Zone Adaptation

As an analyst,
I want a three-panel layout (tree + grid + detail) that adapts to my Tableau dashboard zone size,
So that I can use the extension in any dashboard layout without content being cut off.

**Acceptance Criteria:**

**Given** the PanelLayout component renders inside the Tableau dashboard zone
**When** the zone is wider than 900px
**Then** the tree panel is 240px (default), the grid fills remaining width, and the detail panel area is reserved at the bottom (hidden until activated)
**And** a ResizeHandle between tree and grid allows dragging to resize
**And** double-clicking the resize handle collapses the tree to a 32px icon strip with vertical "▶ Fields" label
**And** clicking the collapsed strip re-expands to previous width

**Given** the zone width is between 400px and 600px
**When** the extension renders
**Then** the tree panel starts collapsed by default

**Given** the zone width is below 400px
**When** the extension renders
**Then** the tree panel auto-collapses to 32px

**Given** the zone height is below 300px
**When** an analyst would normally see a detail panel
**Then** the detail panel is disabled (not enough vertical space)

**Given** the grid area has no fields selected
**When** the extension first loads
**Then** the grid area shows the empty state: centered hint "Drag fields from the tree to start exploring" with directional icon

### Story 1.4: Tableau API Adapter Service

As a developer,
I want a single adapter service for all Tableau Extensions API calls,
So that no component directly imports Tableau APIs and all data access is centralized and testable.

**Acceptance Criteria:**

**Given** `src/services/tableauAdapter.ts` exists
**When** any component needs Tableau data
**Then** it calls tableauAdapter methods (initialize, getDataSourceSchema, queryData, subscribeToFilterChange, saveSettings, loadSettings)
**And** the adapter translates Tableau types to domain types (ColumnInfo[], FlatRowData[], etc.)
**And** the adapter catches native Tableau errors and re-throws as typed errors (TableauConnectionError, TableauDataError)
**And** no file outside `tableauAdapter.ts` imports `tableau.extensions` directly
**And** the adapter has unit tests with mocked Tableau API

### Story 1.5: Test Mock Data & Tableau API Mock

As a developer,
I want a comprehensive mock data set and a mock Tableau API adapter,
So that all tests across all epics can run without a live Tableau connection and use realistic, consistent test data.

**Acceptance Criteria:**

**Given** a mock data module exists at `src/__mocks__/mockData.ts`
**When** tests need telemetry data
**Then** the module exports realistic mock data including:
**And** at least 15 message types (e.g., Navigation.GPS.Position, Navigation.INS, Navigation.Baro, FlightControl.Actuator, FlightControl.Mode, FlightControl.Surfaces, Sensors.Radar.Track, Sensors.Radar.Search, Sensors.EO, Communications.Radio, Communications.DataLink, SystemLog, Power.Generator, Power.Battery, Payload.Status) with realistic dotted-path field names
**And** each message type has 5-20 fields with nesting up to 4 levels deep
**And** at least one message type contains array fields
**And** a `generateMockRows(count, messageTypes)` function that produces mixed-line sparse row data with realistic timestamps, values, and blank cells for non-matching types
**And** pre-built datasets: `MOCK_ROWS_100` (quick tests), `MOCK_ROWS_1K` (integration tests), `MOCK_ROWS_10K` (performance tests)
**And** a `MOCK_SCHEMA` constant containing the full column schema (all dotted-path field names across all mock message types)

**Given** a mock Tableau adapter exists at `src/__mocks__/mockTableauAdapter.ts`
**When** tests need to call Tableau API methods
**Then** the mock implements the same interface as `tableauAdapter` (initialize, getDataSourceSchema, queryData, subscribeToFilterChange, saveSettings, loadSettings)
**And** `getDataSourceSchema()` returns `MOCK_SCHEMA`
**And** `queryData()` returns rows from the pre-built datasets (configurable per test)
**And** `subscribeToFilterChange()` returns a mock unsubscribe function and allows tests to trigger filter events programmatically
**And** `saveSettings()` / `loadSettings()` use an in-memory store
**And** the mock can be configured to simulate errors (connection failure, data error) for error-path testing

**Given** tests import mock data
**When** they run via Vitest
**Then** all mock data is typed with the same TypeScript interfaces used by production code (FieldNode, FlatRowData, ColumnInfo, etc.)
**And** mock data is deterministic — same output every run (no random values without seeding)

## Epic 2: Field Selection & Tree Navigation

Analysts can browse ~200 message types in a hierarchical tree, search/filter, and drag fields to the grid. The tree-grid selection state stays in sync bidirectionally.

### Story 2.1: Field Hierarchy Parsing & Tree Rendering

As an analyst,
I want to browse all available message types in a hierarchical tree view,
So that I can navigate nested field structures intuitively without memorizing dotted paths.

**Acceptance Criteria:**

**Given** the Tableau data source has columns with dotted-path names (e.g., `navigation.gps.position.latitude`)
**When** the extension loads and calls `tableauAdapter.getDataSourceSchema()`
**Then** `dataTransform.parseFieldHierarchy()` converts flat dotted paths into a tree structure
**And** the TreeSelector component renders the hierarchy using MUI TreeView
**And** tree nodes can be expanded/collapsed up to 6 levels deep (FR2)
**And** each leaf node shows the field short name and the full dotted path is visible in the tree (FR5)
**And** message-type parent nodes are expandable/collapsible with arrow indicators (▶/▼)
**And** the parsed hierarchy is cached (memoized) — not recomputed on every render
**And** `parseFieldHierarchy()` has unit tests with realistic dotted-path data

### Story 2.2: Drag-and-Drop Field to Grid

As an analyst,
I want to drag a field from the tree and drop it on the grid to add it as a column,
So that I can build my view by direct manipulation without forms or apply buttons.

**Acceptance Criteria:**

**Given** the @dnd-kit DndContext wraps TreeSelector and GridArea at the App level
**When** the analyst grabs a leaf field node in the tree
**Then** a DragOverlay shows the field short name in an accent-colored pill following the cursor
**And** when dragging over the grid header area, a DropZoneOverlay shows a 3px accent insertion line between columns at the nearest drop position
**And** on drop, the field is added to Zustand `fieldSelectionSlice.selectedFields`
**And** the tree node immediately shows a checkmark/selected indicator
**And** the timestamp column auto-appears (pinned left) when the first field is dragged
**And** subsequent fields appear at the drop position
**And** column header appears within 100ms of drop (per UX success criteria)

### Story 2.3: Field Removal & Bidirectional Sync

As an analyst,
I want to remove fields from the grid in multiple ways and have the tree stay in sync,
So that I can refine my view without confusion about what's selected.

**Acceptance Criteria:**

**Given** a field is currently displayed as a grid column and checked in the tree
**When** the analyst unchecks the field in the tree
**Then** the column disappears from the grid immediately
**And** the Zustand fieldSelectionSlice is updated

**Given** a field column exists in the grid
**When** the analyst drags the column header back to the tree panel area
**Then** the column is removed from the grid and the tree checkmark clears

**Given** a field column exists in the grid
**When** the analyst right-clicks the column header
**Then** a context menu appears with "Remove field" option (MUI Menu)
**And** clicking "Remove field" removes the column and clears the tree checkmark

**Given** an analyst selects an entire message type (FR4)
**When** they check a parent node in the tree
**Then** all child fields of that message type are added to the grid
**And** unchecking the parent removes all its fields

### Story 2.4: Tree Search & Filter

As an analyst,
I want to search/filter the tree by field name,
So that I can quickly find fields in a tree of ~200 message types without manual browsing.

**Acceptance Criteria:**

**Given** the TreeSearchInput is visible above the tree
**When** the analyst types a search term (e.g., "altitude")
**Then** the tree filters to show only matching nodes and their parent hierarchy
**And** non-matching branches are hidden
**And** filtering is instant (synchronous, no loading state)
**And** clearing the search (✕ button or empty text) restores the full tree
**And** search matches against field short names and full dotted paths

## Epic 3: Mixed-Line Data Grid

Analysts see selected fields from multiple message types interleaved by time in a sparse grid with visual row-type distinction and virtual scrolling.

### Story 3.1: Sparse Grid Model & Data Rendering

As an analyst,
I want to see selected fields from multiple message types in a single grid interleaved by time,
So that I can correlate events across different data streams in one view.

**Acceptance Criteria:**

**Given** the analyst has selected fields from 3+ message types
**When** the grid renders
**Then** `dataTransform.buildSparseGridModel()` transforms flat Tableau data into the mixed-line sparse model
**And** rows are ordered by timestamp
**And** each row only has values in columns belonging to its message type; other columns are blank (FR9)
**And** AG Grid column definitions are built via `columnDefBuilder` from Zustand selectedFields state
**And** column headers show short field names (FR8)
**And** column header tooltips show the full dotted path (MUI Tooltip, UX-DR16)
**And** the timestamp column is pinned left with subtle blue tint and sort ascending by default
**And** `buildSparseGridModel()` has unit tests with multi-message-type test data

### Story 3.2: Row-Type Visual Distinction & Virtual Scrolling

As an analyst,
I want to visually distinguish which message type each row belongs to and scroll smoothly through large datasets,
So that I can scan patterns across interleaved data without confusion.

**Acceptance Criteria:**

**Given** the grid displays mixed-line rows from multiple message types
**When** rows render
**Then** each row has a 4px left-edge color stripe matching its message type (using the 8-color palette from design tokens, UX-DR11)
**And** AG Grid row class rules apply the correct stripe color per message type (FR10)
**And** virtual scrolling is enabled — the grid can render up to 35K rows without loading all into DOM (FR11)
**And** scroll rendering is < 250ms (NFR4)
**And** 10K rows render in < 5 seconds (NFR1)

### Story 3.3: Array Cell Handling

As an analyst,
I want to see array fields as a single cell value with click-to-expand,
So that I can see array data without it cluttering the grid.

**Acceptance Criteria:**

**Given** a message field contains an array value
**When** the grid renders that cell
**Then** the ArrayCellRenderer displays a compact representation (e.g., `[3 items]` or first value + `...`)
**And** clicking the cell expands to show all array elements (FR15)
**And** the expanded view is dismissible
**And** array expansion does not disrupt other cells or grid layout

## Epic 4: Grid Interaction — Filtering, Sorting & Row Detail

Analysts can sort, filter, and inspect any row in detail.

### Story 4.1: Column Sorting & Filtering

As an analyst,
I want to sort and filter the grid by any column,
So that I can focus on specific data patterns and find anomalies quickly.

**Acceptance Criteria:**

**Given** the grid is displaying data
**When** the analyst clicks a column header
**Then** the column sorts ascending → descending → no sort (FR16)
**And** the sort indicator (▲/▼) appears in the header

**Given** the grid is displaying data
**When** the analyst clicks the filter icon on a column header
**Then** AG Grid's built-in filter popup appears (FR17)
**And** the analyst can set filter criteria for that column
**And** multiple columns can be filtered simultaneously (FR18)
**And** a "Clear all filters" action is available (FR19)
**And** filter/sort response is < 2 seconds (NFR3)
**And** sort and filter model changes dispatch to Zustand gridSlice

### Story 4.2: Row Detail Panel

As an analyst,
I want to click a row and see all its fields in a nested tree view,
So that I can inspect the full message structure without adding every field to the grid.

**Acceptance Criteria:**

**Given** the grid is displaying data
**When** the analyst clicks a row
**Then** the DetailPanel opens at the bottom of the grid area (180px, UX-DR6)
**And** `dataTransform.reconstructNestedObject()` builds the full nested message from the flat row
**And** the DetailTreeView (MUI TreeView) displays all fields as a name-value tree
**And** nested groups can be expanded/collapsed (FR13)
**And** the panel header shows the message type name
**And** a ✕ button closes the panel and reclaims grid space
**And** the row detail opens in < 1 second (NFR7)
**And** the selected row is highlighted in the grid with accent background (8% opacity)

### Story 4.3: Tree Panel Collapse from Grid View

As an analyst,
I want to collapse the tree selector panel to maximize grid display space,
So that after I've selected my fields, I can focus entirely on the data.

**Acceptance Criteria:**

**Given** the tree panel is expanded
**When** the analyst clicks the collapse button (◀) in the tree panel header
**Then** the tree collapses to a 32px icon strip
**And** the grid expands to fill the freed horizontal space
**And** clicking ▶ on the collapsed strip re-expands the tree to its previous width (FR32)

## Epic 5: Tableau Filter Integration & Live Refresh

The extension responds to Tableau dashboard filters and polls for live data every 10 seconds.

### Story 5.1: Tableau Filter Event Subscription

As an analyst,
I want the extension to update when I change Tableau dashboard filters,
So that the extension data always matches the time range and filters I've set in the dashboard.

**Acceptance Criteria:**

**Given** the extension is loaded in a Tableau dashboard
**When** the analyst changes the Tableau time filter
**Then** the `useTableauFilters` hook detects the filter change event via `tableauAdapter.subscribeToFilterChange()`
**And** the extension re-queries data from the Tableau data source with the new filter parameters
**And** the grid updates with the filtered data (FR20)
**And** non-time filters (categorical, parameter changes) also trigger re-query (FR21)
**And** if the re-query fails, the last successful data is retained and an error appears in the status bar

### Story 5.2: Live Data Refresh with State Preservation

As an analyst,
I want the extension to poll for new data every 10 seconds without disrupting my current view,
So that I see fresh data while maintaining my scroll position, filters, and sorts.

**Acceptance Criteria:**

**Given** the extension is displaying data
**When** the `useLiveRefresh` hook fires (every 10 seconds, FR26)
**Then** it queries Tableau for current data and diffs against the store
**And** new rows are identified by row identity key (timestamp + message type + sequence)
**And** new rows are inserted via AG Grid `applyTransaction({ add: newRows })` in correct time-order position (FR27)
**And** scroll position is preserved — the grid does not jump (FR28)
**And** active filters and sort model are preserved (FR28)
**And** if no new data, the cycle is a no-op (no re-render)
**And** if refresh fails, the grid retains last good data and retries next cycle
**And** polling pauses when the extension is not visible (Tableau tab not active)

### Story 5.3: Status Bar & New Data Indicators

As an analyst,
I want to see the current grid state and know when new data arrives,
So that I'm always aware of what I'm looking at and what changed.

**Acceptance Criteria:**

**Given** the StatusBar component renders at the bottom of the extension (24px, UX-DR12)
**When** the grid has data
**Then** the status bar shows: `{rowCount} rows | {typeCount} message types | Last refresh: {time}`
**And** a green dot indicates active refresh

**Given** new data arrives from a live refresh
**When** the grid updates
**Then** the status bar shows `+{N} new` in green text (FR29)
**And** newly inserted rows have a subtle green tint (#E8F4E8) that fades after 3 seconds (UX-DR14)

**Given** a refresh fails
**When** the status bar updates
**Then** it shows "Last refresh: Xs ago — retry failed" in orange
**And** after 3 consecutive failures, a persistent red warning appears

## Epic 6: State Persistence & Deployment

Analysts' configurations persist with workbook saves. IT deploys air-gapped packages to Tableau Server.

### Story 6.1: State Persistence via Tableau Settings API

As an analyst,
I want my field selections and configuration to persist when I save the Tableau workbook,
So that I don't have to reconfigure the extension every time I open the dashboard.

**Acceptance Criteria:**

**Given** the analyst has selected fields, reordered columns, and configured panel sizes
**When** the Tableau workbook is saved
**Then** `useSettingsPersistence` serializes the current state (selected field paths, column order, panel widths) to Tableau Settings API via `tableauAdapter.saveSettings()` (FR24)
**And** serialization uses compact format (field paths as strings, not full metadata) to stay under the ~2MB Settings API limit (ARCH-15)
**And** a size guard warns if approaching the limit

**Given** the analyst reopens a saved Tableau workbook
**When** the extension initializes
**Then** `useSettingsPersistence` loads saved settings via `tableauAdapter.loadSettings()`
**And** field selections are restored — tree checkmarks and grid columns reappear (FR25)
**And** column order and panel sizes are restored
**And** if saved settings are corrupted or incompatible, the extension loads with empty state (graceful degradation)

### Story 6.2: Air-Gapped Build Configuration

As an IT team member,
I want the extension to build as a fully self-contained package with zero external dependencies,
So that I can deploy it to our air-gapped Tableau Server.

**Acceptance Criteria:**

**Given** the Vite build configuration in `vite.config.ts`
**When** `npm run build` is executed
**Then** the `dist/` directory contains: `index.html`, `assets/index-[hash].js`, `assets/index-[hash].css`, and `manifest.trex`
**And** `base` is set to `'./'` for relative paths (FR36)
**And** no external dependencies — everything is bundled (no CDN references)
**And** code splitting is disabled (single JS bundle)
**And** AG Grid Enterprise license key is injected via `VITE_AG_GRID_LICENSE_KEY` environment variable
**And** production source maps are excluded from the bundle
**And** the bundle contains zero `fetch()`, `XMLHttpRequest`, or `import()` calls to external URLs
**And** `docs/deployment-guide.md` documents the deployment process

### Story 6.3: Tableau Server Deployment & Version Updates

As an IT team member,
I want to deploy the extension to Tableau Server and update it without disrupting existing dashboards,
So that analysts get new features without losing their configurations.

**Acceptance Criteria:**

**Given** the `dist/` directory from Story 6.2
**When** the IT team copies `dist/` to Tableau Server's extension hosting directory
**Then** the extension is accessible from Tableau dashboards
**And** the IT team can add/update the extension URL in the Tableau Server allowlist (FR35)
**And** no Tableau Server configuration changes are needed beyond allowlisting (FR34)

**Given** a new version of the extension is built
**When** the IT team replaces the `dist/` contents on Tableau Server
**Then** existing dashboards pick up the new version on next load (FR37)
**And** previously saved field selections and configurations still load correctly
**And** analysts do not need to reconfigure their dashboards
