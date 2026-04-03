---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-03'
inputDocuments: [prd.md, ux-design-specification.md, product-brief-TableauPlugin.md, product-brief-TableauPlugin-distillate.md, project-context.md]
workflowType: 'architecture'
project_name: 'TableauPlugin'
user_name: 'Rgamz'
date: '2026-04-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
37 FRs across 8 capability areas: Field & Message Selection (FR1-6), Data Grid Display (FR7-11), Row Detail & Inspection (FR12-15), Filtering & Sorting (FR16-19), Tableau Integration (FR20-25), Live Data Refresh (FR26-29), Dashboard Building & Sharing (FR30-33), Deployment & Administration (FR34-37).

Architecturally, these map to ~4 major subsystems: **data layer** (Tableau API, data transformation, polling), **tree selector** (hierarchy management, search, drag source), **grid engine** (AG Grid configuration, sparse model, column management, drop target), and **state management** (tree-grid sync, Tableau settings persistence, live refresh state).

**Non-Functional Requirements:**
- Performance: 10K rows < 5s render, < 2s filter/sort, < 250ms scroll, < 10s initial load
- Live refresh: 10-second polling cycle with full state preservation
- Security: Tableau-inherited auth, no external network requests, no data caching beyond session
- Reliability: graceful error handling, retry on refresh failure, retain last good data
- Deployability: single self-contained package, air-gapped, zero external dependencies at runtime

**UX Architectural Implications:**
- Drag-and-drop from MUI TreeView to AG Grid header — custom bridge component required (DragFieldHandle)
- Three-panel layout (tree + grid + detail) with resize and collapse — custom PanelLayout component
- AG Grid Enterprise features required: column pinning, virtual scrolling, row styling, column reorder
- Bidirectional state sync: tree checkmarks ↔ grid columns must be always consistent

### Scale & Complexity

- **Primary domain:** Frontend-heavy React SPA, embedded in Tableau iframe
- **Complexity level:** High
- **Estimated architectural components:** 8-10 distinct modules
- **Data volume:** 1K-35K rows per session, ~200 message types, fields nested up to 6 levels

### Technical Constraints & Dependencies

| Constraint | Impact |
|-----------|--------|
| Tableau Extensions API (iframe sandbox) | All data access mediated; no direct DB access; API version compatibility matters |
| Tableau flat data model | Nested hierarchy must be reconstructed from dotted-path column names |
| Air-gapped deployment | All JS, CSS, AG Grid bundled; no CDN, no runtime fetches |
| AG Grid Enterprise license | Required for column pinning, virtual scrolling, row grouping, advanced filtering |
| Chrome-only | No cross-browser testing; can use modern APIs freely |
| Tableau Settings API size limits | State persistence may have payload size constraints for large field selections |

### Cross-Cutting Concerns Identified

1. **State synchronization** — Tree selection state, grid column state, and Tableau persisted settings must remain consistent through all operations (drag, remove, refresh, save, reload)
2. **Performance budget** — 10K rows in < 5s touches data fetching, transformation, AG Grid rendering, and UI updates. No single component can consume the full budget.
3. **Data transformation pipeline** — Raw flat Tableau data → nested hierarchy reconstruction → sparse mixed-line model → AG Grid row data. This pipeline runs on every data fetch and refresh.
4. **Error resilience** — Every async operation (Tableau data query, filter event, settings save, polling) needs graceful failure handling with no data loss.
5. **Bundling strategy** — Vite/Rollup configuration must produce a single self-contained bundle with AG Grid Enterprise, MUI, React, and all dependencies. Bundle size optimization matters for deployment.

## Starter Template Evaluation

### Primary Technology Domain

React SPA (TypeScript) embedded as a Tableau Dashboard Extension. No full-stack framework needed — client-only application communicating exclusively through the Tableau Extensions API.

### Starter Options Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| `create-tableau-dashboard-extension` | Official Tableau CLI; generates .trex manifest | Uses Tableau's own UI lib, not MUI/AG Grid; may be CRA-based | Use for .trex reference only |
| `tableau-ext-withreact` | React + TypeScript; Tableau-specific | Community-maintained; likely outdated deps | Reference, don't fork |
| Vite + React + TS (`npm create vite@latest`) | Modern, fast builds, tree-shaking, excellent TS support | No Tableau-specific setup | **Best foundation** |
| Create React App | Widely known | Deprecated/maintenance mode | Reject |

### Selected Starter: Vite + React + TypeScript (custom scaffold)

**Rationale:**
- Vite is the current standard for React SPAs — fast HMR, excellent production builds, tree-shaking
- CRA is deprecated; Next.js is overkill (no SSR needed for an iframe extension)
- Tableau Extensions API is just an npm package (`@tableau/extensions-api-types` v1.15.0) — add it to any React project
- .trex manifest is a simple XML file — can be hand-authored
- Air-gapped bundling is simpler with Vite's Rollup-based build

**Initialization Command:**

```bash
npm create vite@latest tableau-telemetry-extension -- --template react-ts
cd tableau-telemetry-extension
npm install @tableau/extensions-api-types ag-grid-community ag-grid-enterprise ag-grid-react @mui/material @mui/icons-material @emotion/react @emotion/styled
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript (strict mode)
- React 19+ (latest stable)
- Vite 6+ as build tool and dev server

**Styling Solution:**
- MUI's `@emotion/react` + `@emotion/styled` for component styling
- AG Grid's built-in theming for grid styles
- Shared design tokens file consumed by both

**Build Tooling:**
- Vite with Rollup for production builds
- Single-bundle output configured for air-gapped deployment
- All assets inlined or co-located (no CDN references)

**Testing Framework:**
- Vitest (Vite-native, Jest-compatible API)
- React Testing Library for component tests

**Code Organization:**
```
src/
  components/       # React components (TreeSelector, GridArea, DetailPanel, StatusBar, PanelLayout)
  hooks/            # Custom React hooks (useTableauData, useFieldSelection, useLiveRefresh)
  services/         # Tableau API adapter, data transformation pipeline
  models/           # TypeScript types/interfaces for messages, fields, grid data
  store/            # State management (tree-grid sync, selection state)
  theme/            # Design tokens, AG Grid theme, MUI theme
  utils/            # Helpers (hierarchy parsing, dotted-path utilities)
  App.tsx           # Root component
  main.tsx          # Entry point with Tableau initialization
public/
  manifest.trex     # Tableau extension manifest
```

**Development Experience:**
- Vite HMR for instant feedback during development
- TypeScript strict mode for compile-time safety
- ESLint + Prettier for code quality
- Tableau Extensions API sandbox (`@tableau/tabextsandbox` v1.14.0) for local development without Tableau Desktop

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. State management approach (Zustand)
2. Data transformation pipeline architecture
3. Drag-and-drop library (@dnd-kit)
4. Live refresh strategy (polling + AG Grid transactions)
5. Air-gapped bundling configuration

**Deferred Decisions (Post-V1):**
- Pyodide/WASM integration strategy (Phase 2)
- On-prem LLM inference architecture (Phase 2)
- Shared transform library storage interface (Phase 2)
- Map component integration pattern (Phase 3)

### Data Architecture

**No database. No backend. No API server.**

Tableau is the sole data source. The extension is a client-only SPA that queries data through the Tableau Extensions API.

**Data Transformation Pipeline:**

```
Tableau Extensions API (flat columns with dotted-path names)
        │
        ▼
┌─────────────────────────────────┐
│  DataTransformService           │
│  src/services/dataTransform.ts  │
│                                 │
│  1. parseFieldHierarchy()       │  dotted paths → tree structure (for TreeSelector)
│  2. buildSparseGridModel()      │  flat rows → mixed-line sparse model (for AG Grid)
│  3. reconstructNestedObject()   │  flat row → full nested object (for RowDetail)
│                                 │
│  Pure functions, no side effects│
│  Memoized for performance       │
└─────────────────────────────────┘
        │
        ▼
  React components consume transformed data
```

**Key design decisions:**
- `parseFieldHierarchy()` runs once when the Tableau data source schema is loaded — result cached
- `buildSparseGridModel()` runs on every data fetch/refresh — must be fast for 10K rows
- `reconstructNestedObject()` runs on-demand when analyst clicks a row — lazy evaluation
- All functions are pure and independently testable

### Authentication & Security

**No custom auth. No security layer to build.**

- Tableau handles all authentication and authorization
- Extension inherits the user's Tableau session
- No data leaves the browser — all processing is in-browser via Tableau APIs
- Air-gapped deployment means zero external network requests (security by architecture)
- No session tokens, no cookies, no credentials stored by the extension

### Frontend Architecture

**State Management: Zustand**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State library | Zustand | 1KB bundled; structured enough for tree-grid sync; no boilerplate; fast |
| State structure | Single store with slices | `fieldSelectionSlice` (tree state, selected fields), `gridSlice` (column config, sort/filter model), `refreshSlice` (polling state, last data) |
| Persistence | Zustand middleware → Tableau Settings API | Field selections and column config serialized to Tableau Settings on save; deserialized on workbook reopen |
| Derived state | Zustand selectors with memoization | Grid column definitions derived from field selection state; AG Grid row data derived from raw Tableau data + selected fields |

**State flow:**

```
User drags field → Zustand fieldSelectionSlice updates → 
  → TreeSelector re-renders (checkmark appears)
  → GridArea re-renders (new column added via AG Grid API)
  → Tableau Settings API persists state (debounced)
```

**Component Architecture:**

```
App
├── PanelLayout (manages tree/grid/detail layout, resize, collapse)
│   ├── TreeSelectorPanel
│   │   ├── TreeSearch (MUI TextField)
│   │   └── TreeView (MUI TreeView + @dnd-kit drag sources)
│   ├── GridPanel
│   │   ├── GridArea (AG Grid + @dnd-kit drop target on header)
│   │   └── DetailPanel (MUI TreeView for row detail, collapsible)
│   └── ResizeHandles
└── StatusBar
```

**Drag-and-Drop: @dnd-kit**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DnD library | @dnd-kit | Pointer Events-based — consistent across Chrome and Edge; ~10KB; works in iframes; keyboard accessible |
| Drag source | Tree field nodes (via `useDraggable`) | Each leaf node in MUI TreeView is a draggable item carrying field metadata |
| Drop target | AG Grid header area (via `useDroppable`) | Custom overlay on grid header zone detects drop position between columns |
| Drag overlay | `DragOverlay` component | Shows field short name in accent-colored pill following cursor |
| Drop indicator | Custom insertion line | 3px accent-colored vertical line between columns at nearest drop position |
| Drag back to remove | Tree panel area as drop zone | Dropping a grid column header on the tree area removes the field |

**Routing: None**

Single-view extension — no client-side routing needed. All state is managed through Zustand, not URL.

### Live Data Refresh

**Strategy: Polling + AG Grid incremental transactions**

```
useLiveRefresh hook (10-second interval)
        │
        ▼
  Query Tableau Extensions API for current data
        │
        ▼
  Diff new data against current store
        │
        ├── New rows found → AG Grid applyTransaction({ add: newRows })
        ├── No changes → skip render cycle
        └── Error → retain last good data; increment retry counter
        │
        ▼
  Update StatusBar: "+N new | Last refresh: 0s ago"
  Optional: highlight new rows with green tint (CSS transition, fades after 3s)
```

**Key design decisions:**
- Use AG Grid's `applyTransaction()` API — adds/removes rows without full re-render; preserves scroll position, sort, and filter state
- Diff based on a row identity key (timestamp + message type + sequence number)
- Polling runs in a `useEffect` cleanup cycle — pauses when extension is not visible (Tableau tab not active)
- Failed refresh retains current data; retries on next cycle; 3 consecutive failures trigger status bar warning

### Infrastructure & Deployment

**Bundling for Air-Gap: Vite configuration**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Build tool | Vite 6+ with Rollup | Fast builds, tree-shaking, asset inlining |
| Output format | Single directory with index.html + JS + CSS | Deployable as static files on Tableau Server |
| Base path | `base: './'` | Relative paths — works from any directory |
| External deps | None — everything bundled | Air-gapped requirement |
| Code splitting | Disabled for V1 | Single bundle simpler for air-gapped deployment; revisit if bundle > 5MB |
| Asset handling | Inline small assets; co-locate large ones | No external references |
| AG Grid license | Build-time env variable | `VITE_AG_GRID_LICENSE_KEY` injected during build |
| Source maps | Production source maps excluded from deployment bundle | Available for development only |

**Deployment artifact:**
```
dist/
  index.html          # Extension entry point
  assets/
    index-[hash].js   # Single JS bundle (React + AG Grid + MUI + app code)
    index-[hash].css   # Combined styles
  manifest.trex        # Tableau extension manifest
```

**Deployment process:**
1. IT team copies `dist/` to Tableau Server's extension hosting directory
2. IT team adds/updates the extension URL in Tableau Server allowlist
3. No server-side configuration — purely static files
4. Version updates: replace `dist/` contents; existing dashboards pick up new version on next load

### Decision Impact Analysis

**Implementation Sequence:**
1. Vite + React + TypeScript scaffold with Tableau Extensions API
2. Zustand store with field selection and grid slices
3. DataTransformService (hierarchy parsing, sparse grid model)
4. PanelLayout + TreeSelector + GridArea (with @dnd-kit integration)
5. Tableau filter event subscription
6. Live refresh polling (useLiveRefresh hook)
7. Row detail panel
8. State persistence via Tableau Settings API
9. StatusBar + error handling
10. Air-gapped bundle optimization

**Cross-Component Dependencies:**

```
DataTransformService ← used by → TreeSelector, GridArea, DetailPanel
Zustand store ← used by → all components
@dnd-kit context ← wraps → TreeSelector + GridArea
Tableau API adapter ← used by → DataTransformService, useLiveRefresh, state persistence
```

## Implementation Patterns & Consistency Rules

### Naming Patterns

**File Naming:**

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase.tsx | `TreeSelector.tsx`, `GridArea.tsx`, `StatusBar.tsx` |
| Hooks | camelCase.ts starting with `use` | `useFieldSelection.ts`, `useLiveRefresh.ts` |
| Services | camelCase.ts | `dataTransform.ts`, `tableauAdapter.ts` |
| Models/Types | camelCase.ts | `messageTypes.ts`, `fieldHierarchy.ts` |
| Store slices | camelCase.ts ending with `Slice` | `fieldSelectionSlice.ts`, `gridSlice.ts` |
| Utils | camelCase.ts | `hierarchyParser.ts`, `dottedPathUtils.ts` |
| Test files | co-located `*.test.ts(x)` | `TreeSelector.test.tsx`, `dataTransform.test.ts` |
| Constants | UPPER_SNAKE_CASE in camelCase file | `designTokens.ts` → `export const ACCENT_COLOR = '#4E79A7'` |

**TypeScript Naming:**

| Type | Convention | Example |
|------|-----------|---------|
| Interfaces | PascalCase | `MessageType`, `FieldNode`, `GridRowData` |
| Type aliases | PascalCase | `SelectedFields`, `ColumnConfig` |
| Enums | PascalCase, members PascalCase | `MessageCategory.Navigation` |
| Functions | camelCase, verb-first | `parseFieldHierarchy()`, `buildSparseGridModel()` |
| React components | PascalCase | `TreeSelector`, `GridArea` |
| Hooks | camelCase, `use` prefix | `useFieldSelection`, `useLiveRefresh` |
| Event handlers in components | `handle` prefix | `handleFieldDrop`, `handleRowClick` |
| Callback props | `on` prefix | `onFieldSelect`, `onColumnRemove` |
| Boolean variables | `is`/`has`/`should` prefix | `isRefreshing`, `hasNewData`, `shouldAutoScroll` |

### Structure Patterns

**Component Organization — by feature, co-located:**

```
src/components/
  TreeSelector/
    TreeSelector.tsx          # Component
    TreeSelector.test.tsx     # Tests co-located
    TreeSearchInput.tsx       # Sub-component (private to feature)
    useTreeFilter.ts          # Feature-specific hook
  GridArea/
    GridArea.tsx
    GridArea.test.tsx
    columnDefBuilder.ts       # Feature-specific utility
    cellRenderers/
      BlankCellRenderer.tsx
      ArrayCellRenderer.tsx
  DetailPanel/
    DetailPanel.tsx
    DetailPanel.test.tsx
    DetailTreeView.tsx
  StatusBar/
    StatusBar.tsx
    StatusBar.test.tsx
  PanelLayout/
    PanelLayout.tsx
    PanelLayout.test.tsx
    ResizeHandle.tsx
```

**Shared code lives in top-level directories:**

```
src/hooks/          # Only hooks used by 2+ components
src/services/       # Tableau adapter, data transform (no React dependency)
src/models/         # TypeScript types shared across components
src/store/          # Zustand store and slices
src/theme/          # Design tokens, AG Grid theme, MUI theme
src/utils/          # Pure utility functions shared across components
```

**Rule:** If a hook/utility is used by only one component, it lives inside that component's directory. It moves to the shared directory when a second component needs it.

### Zustand Store Patterns

**Store structure — single store, named slices:**

```typescript
// src/store/store.ts
export const useStore = create<AppState>()((...a) => ({
  ...createFieldSelectionSlice(...a),
  ...createGridSlice(...a),
  ...createRefreshSlice(...a),
}))
```

**Slice conventions:**

```typescript
// src/store/fieldSelectionSlice.ts
export interface FieldSelectionSlice {
  // State — nouns
  selectedFields: FieldNode[]
  fieldHierarchy: TreeNode | null

  // Actions — verb phrases
  addField: (field: FieldNode) => void
  removeField: (fieldPath: string) => void
  setFieldHierarchy: (hierarchy: TreeNode) => void
  clearAllFields: () => void
}
```

**Rules:**
- State properties are **nouns**: `selectedFields`, `gridData`, `lastRefreshTime`
- Actions are **verb phrases**: `addField`, `removeField`, `setGridData`
- No async logic in slices — async operations live in hooks or services, then call slice actions
- Selectors use `useStore(state => state.property)` — never destructure the entire store

### Tableau API Interaction Patterns

**Single adapter service — all Tableau API calls go through one module:**

```typescript
// src/services/tableauAdapter.ts
export const tableauAdapter = {
  initialize: () => Promise<void>,
  getDataSourceSchema: () => Promise<ColumnInfo[]>,
  queryData: (filters: TableauFilter[]) => Promise<FlatRowData[]>,
  subscribeToFilterChange: (callback: FilterChangeCallback) => Unsubscribe,
  saveSettings: (settings: ExtensionSettings) => Promise<void>,
  loadSettings: () => Promise<ExtensionSettings | null>,
}
```

**Rules:**
- No component directly imports `tableau.extensions` — always go through `tableauAdapter`
- All Tableau API calls return Promises — no callbacks
- Adapter translates Tableau types to our domain types (e.g., `DataTable` → `FlatRowData[]`)
- Errors are caught in the adapter and re-thrown as typed errors (`TableauConnectionError`, `TableauDataError`)

### AG Grid Configuration Patterns

**Column definitions built from Zustand state, not inline:**

```typescript
// src/components/GridArea/columnDefBuilder.ts
export function buildColumnDefs(selectedFields: FieldNode[]): ColDef[] {
  const timestampCol: ColDef = {
    field: 'timestamp',
    pinned: 'left',
    sort: 'asc',
  }
  const fieldCols: ColDef[] = selectedFields.map(field => ({
    field: field.dottedPath,
    headerName: field.shortName,
    headerTooltip: field.dottedPath,
  }))
  return [timestampCol, ...fieldCols]
}
```

**Rules:**
- Column definitions are **derived** from Zustand state — never stored as primary state
- Custom cell renderers are React components in `GridArea/cellRenderers/`
- AG Grid API interactions (`gridApi.applyTransaction()`, `gridApi.setFilterModel()`) happen only inside `GridArea` component or `useLiveRefresh` hook — never from outside
- AG Grid event handlers (`onRowClicked`, `onSortChanged`) dispatch Zustand actions — no direct state mutation

### Error Handling Patterns

**Typed error classes:**

```typescript
// src/models/errors.ts
export class TableauConnectionError extends Error { name = 'TableauConnectionError' }
export class TableauDataError extends Error { name = 'TableauDataError' }
export class SettingsPersistError extends Error { name = 'SettingsPersistError' }
```

**Error handling by location:**

| Location | Pattern |
|----------|---------|
| Tableau adapter | Catch native errors → throw typed errors |
| Hooks (useTableauData, useLiveRefresh) | Catch typed errors → update Zustand error state |
| Components | Read error state from Zustand → render error UI (inline, never modal) |
| AG Grid operations | Try/catch → log warning → no-op (grid should never crash) |

**Rules:**
- Errors are **never swallowed silently** — always logged to console and reflected in state
- User-facing errors are **inline** (status bar or grid body) — never modal dialogs
- Failed operations **retain last good data** — never clear the grid on error
- Retry logic lives in the hook that initiated the operation, not in the adapter

### Loading State Patterns

| State | Variable Name | UI Treatment |
|-------|-------------|-------------|
| Initial extension load | `isInitializing` | Full-area skeleton/spinner |
| Data loading (first fetch) | `isLoadingData` | Grid body shows skeleton rows |
| Live refresh in progress | `isRefreshing` | Status bar shows spinning indicator only |
| Saving settings | `isSavingSettings` | No visible indicator (background operation) |
| Tree search filtering | Synchronous — no loading state | Instant filter |

**Rule:** Only one loading indicator visible at a time. Live refresh is subtle (status bar only) — it never shows a loading overlay on the grid.

### Enforcement Guidelines

**All AI agents implementing stories MUST:**
1. Follow the file naming and directory structure patterns above
2. Route all Tableau API calls through `tableauAdapter` — never import `tableau.extensions` directly
3. Use Zustand actions for state changes — never mutate state directly
4. Build AG Grid column definitions via `columnDefBuilder` — never inline column configs
5. Use typed error classes — never throw raw `Error` objects for known failure modes
6. Co-locate tests with their components — never place tests in a separate `__tests__` directory
7. Use `handle` prefix for component event handlers, `on` prefix for callback props

**Anti-Patterns (explicitly forbidden):**
- `any` type in TypeScript — use `unknown` and narrow, or define proper types
- Direct `tableau.extensions` API calls from components
- AG Grid API calls from outside GridArea component
- Modal dialogs for any purpose
- Console.log in production code — use a logger utility with levels
- Inline styles — use MUI `sx` prop or AG Grid theme tokens

## Project Structure & Boundaries

### Complete Project Directory Structure

```
tableau-telemetry-extension/
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .env.example                    # VITE_AG_GRID_LICENSE_KEY placeholder
├── .gitignore
├── index.html                      # Vite entry HTML
│
├── public/
│   └── manifest.trex               # Tableau extension manifest
│
├── src/
│   ├── main.tsx                     # React entry point + Tableau initialization
│   ├── App.tsx                      # Root component: DndContext + PanelLayout + StatusBar
│   │
│   ├── models/
│   │   ├── fieldHierarchy.ts        # TreeNode, FieldNode, MessageType interfaces
│   │   ├── gridData.ts              # GridRowData, SparseRow, ColumnConfig interfaces
│   │   ├── tableauTypes.ts          # FlatRowData, ColumnInfo, TableauFilter types
│   │   ├── extensionSettings.ts     # ExtensionSettings interface (persisted state)
│   │   └── errors.ts                # TableauConnectionError, TableauDataError, SettingsPersistError
│   │
│   ├── services/
│   │   ├── tableauAdapter.ts        # All Tableau Extensions API calls (single entry point)
│   │   ├── tableauAdapter.test.ts
│   │   ├── dataTransform.ts         # parseFieldHierarchy, buildSparseGridModel, reconstructNestedObject
│   │   └── dataTransform.test.ts
│   │
│   ├── store/
│   │   ├── store.ts                 # Zustand store combining all slices
│   │   ├── fieldSelectionSlice.ts   # selectedFields, fieldHierarchy, addField, removeField
│   │   ├── gridSlice.ts             # sortModel, filterModel, scrollPosition, gridData
│   │   ├── refreshSlice.ts          # isRefreshing, lastRefreshTime, newRowCount, errorState
│   │   └── settingsSlice.ts         # Tableau Settings API persistence middleware
│   │
│   ├── hooks/
│   │   ├── useTableauInit.ts        # Extension initialization + schema loading
│   │   ├── useTableauFilters.ts     # Subscribe to Tableau filter change events
│   │   ├── useLiveRefresh.ts        # 10-second polling + AG Grid applyTransaction
│   │   └── useSettingsPersistence.ts # Debounced save/load via Tableau Settings API
│   │
│   ├── components/
│   │   ├── PanelLayout/
│   │   │   ├── PanelLayout.tsx      # Three-panel flex layout (tree + grid + detail)
│   │   │   ├── PanelLayout.test.tsx
│   │   │   └── ResizeHandle.tsx     # Draggable resize handle between panels
│   │   │
│   │   ├── TreeSelector/
│   │   │   ├── TreeSelector.tsx      # MUI TreeView + @dnd-kit drag sources
│   │   │   ├── TreeSelector.test.tsx
│   │   │   ├── TreeSearchInput.tsx   # Search/filter input for tree
│   │   │   ├── DraggableTreeItem.tsx # Tree node wrapped with useDraggable
│   │   │   └── useTreeFilter.ts     # Tree filtering logic
│   │   │
│   │   ├── GridArea/
│   │   │   ├── GridArea.tsx          # AG Grid + @dnd-kit drop target on header
│   │   │   ├── GridArea.test.tsx
│   │   │   ├── columnDefBuilder.ts   # Builds ColDef[] from selected fields
│   │   │   ├── DropZoneOverlay.tsx   # Visual drop indicator over grid header
│   │   │   └── cellRenderers/
│   │   │       ├── BlankCellRenderer.tsx
│   │   │       └── ArrayCellRenderer.tsx
│   │   │
│   │   ├── DetailPanel/
│   │   │   ├── DetailPanel.tsx       # Bottom panel with nested field/value tree
│   │   │   ├── DetailPanel.test.tsx
│   │   │   └── DetailTreeView.tsx    # MUI TreeView for row detail display
│   │   │
│   │   └── StatusBar/
│   │       ├── StatusBar.tsx         # Row count, message types, refresh status
│   │       └── StatusBar.test.tsx
│   │
│   ├── theme/
│   │   ├── designTokens.ts          # Shared color, spacing, typography constants
│   │   ├── muiTheme.ts              # MUI createTheme configuration
│   │   └── agGridTheme.ts           # AG Grid theme customization
│   │
│   └── utils/
│       ├── hierarchyParser.ts        # Dotted-path string → tree node utilities
│       ├── hierarchyParser.test.ts
│       ├── rowIdentity.ts            # Row key generation (timestamp + type + seq)
│       └── logger.ts                 # Logger utility with levels (replaces console.log)
│
├── dist/                             # Build output (git-ignored)
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── manifest.trex
│
└── docs/
    └── deployment-guide.md           # IT team deployment instructions
```

### Architectural Boundaries

**Tableau API Boundary:**
```
Components ──✕──> tableau.extensions (FORBIDDEN)
Components ───> hooks ───> tableauAdapter ───> tableau.extensions (CORRECT)
```
Only `tableauAdapter.ts` imports Tableau APIs. Everything else uses our domain types.

**AG Grid API Boundary:**
```
TreeSelector ──✕──> gridApi (FORBIDDEN)
Store ──✕──> gridApi (FORBIDDEN)
GridArea ───> gridApi (CORRECT — only GridArea touches AG Grid API)
useLiveRefresh ───> gridApi.applyTransaction (CORRECT — refresh needs direct grid access)
```

**State Boundary:**
```
Components ───> useStore(selector) ───> read state (CORRECT)
Components ───> useStore().action() ───> write state (CORRECT)
Components ──✕──> direct state mutation (FORBIDDEN)
Services ──✕──> useStore (FORBIDDEN — services are React-free)
```

**Data Flow:**
```
Tableau Data Source
    │
    ▼
tableauAdapter.queryData()         ← Flat rows with dotted-path columns
    │
    ▼
dataTransform.buildSparseGridModel()  ← Transform to sparse mixed-line model
    │
    ▼
Zustand gridSlice.gridData         ← Store holds transformed data
    │
    ▼
GridArea reads via selector        ← AG Grid renders from store
```

### Requirements to Structure Mapping

| FR Category | Primary Files | Supporting Files |
|------------|--------------|-----------------|
| FR1-6: Field & Message Selection | `TreeSelector/`, `fieldSelectionSlice.ts` | `dataTransform.ts`, `hierarchyParser.ts` |
| FR7-11: Data Grid Display | `GridArea/`, `columnDefBuilder.ts`, `gridSlice.ts` | `dataTransform.ts`, `cellRenderers/` |
| FR12-15: Row Detail & Inspection | `DetailPanel/` | `dataTransform.reconstructNestedObject()` |
| FR16-19: Filtering & Sorting | `GridArea/` (AG Grid native), `gridSlice.ts` | — |
| FR20-25: Tableau Integration | `tableauAdapter.ts`, `useTableauInit.ts`, `useTableauFilters.ts`, `useSettingsPersistence.ts` | `settingsSlice.ts` |
| FR26-29: Live Data Refresh | `useLiveRefresh.ts`, `refreshSlice.ts` | `StatusBar/`, `rowIdentity.ts` |
| FR30-33: Dashboard Building | `App.tsx`, `PanelLayout/` | `useSettingsPersistence.ts` |
| FR34-37: Deployment | `vite.config.ts`, `manifest.trex`, `docs/deployment-guide.md` | `.env.example` |

### Integration Points

**Internal Communication:**
- Components → Zustand store (via `useStore` hook)
- Zustand store → Tableau Settings API (via `settingsSlice` middleware, debounced)
- @dnd-kit DndContext wraps TreeSelector + GridArea at App level
- Tableau filter events → `useTableauFilters` hook → triggers data re-fetch → updates store

**External Integrations:**
- Tableau Extensions API (sole external integration)
  - Data queries: `getUnderlyingDataAsync()`
  - Filter events: `addEventListener(FilterChanged)`
  - Settings: `settings.set()` / `settings.get()`
  - Initialization: `extensions.initializeAsync()`

### Development Workflow

**Local development:**
```bash
npm run dev          # Vite dev server on localhost:3000
                     # Use @tableau/tabextsandbox for local testing without Tableau
```

**Build for deployment:**
```bash
npm run build        # Vite production build → dist/
                     # Copy dist/ to Tableau Server extension directory
```

**Testing:**
```bash
npm run test         # Vitest (watch mode)
npm run test:ci      # Vitest (single run, CI mode)
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible. React 19 + Vite 6 + AG Grid Enterprise + MUI + Zustand + @dnd-kit all have first-class TypeScript support and produce a single Vite bundle with no conflicts. No version incompatibilities detected.

**Pattern Consistency:**
- Naming conventions (PascalCase components, camelCase hooks/services, verb-first actions) align with React/TypeScript ecosystem norms
- Zustand store pattern (slices with noun state / verb actions) is consistent across all state categories
- Error handling pattern (typed errors → state → inline UI) is uniformly applied
- `tableauAdapter` boundary pattern cleanly separates the sole external dependency

**Structure Alignment:**
- Project directory structure matches the component architecture defined in decisions
- Every architectural boundary (Tableau API, AG Grid API, State) has a clear structural enforcement mechanism
- FR-to-file mapping covers all 37 functional requirements with no orphans

### Requirements Coverage Validation ✅

**Functional Requirements:** All 37 FRs (FR1-FR37) have explicit architectural support mapped to specific files and components. No gaps.

**Non-Functional Requirements:** All performance targets, security constraints, reliability requirements, and deployability requirements are addressed by architectural decisions. Air-gapped constraint is enforced at multiple levels (Vite config, tableauAdapter boundary, no CDN references).

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with specific technology choices
- Versions to be pinned at project initialization (first story)
- Implementation patterns cover naming, structure, state management, API interaction, error handling, and loading states
- Anti-patterns explicitly listed

**Structure Completeness:**
- Complete file tree with ~40 files defined
- Every file has a clear purpose comment
- Component boundaries are enforceable (import restrictions documented)

**Pattern Completeness:**
- 7 mandatory enforcement rules for AI agents
- 6 explicitly forbidden anti-patterns
- Concrete code examples for store slices, column builders, and adapter patterns

### Gap Analysis Results

| Gap | Severity | Resolution |
|-----|----------|-----------|
| Tableau Settings API payload size limit (~2MB) | Medium | Serialize only field paths (strings) and compact config objects; add size guard in `settingsSlice.ts` with warning if approaching limit |

No critical gaps found.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (37 FRs, NFRs, domain constraints)
- [x] Scale and complexity assessed (high — 8-10 components)
- [x] Technical constraints identified (air-gapped, Tableau iframe, flat data model)
- [x] Cross-cutting concerns mapped (state sync, performance, bundling, error resilience)

**✅ Architectural Decisions**
- [x] State management: Zustand with slices
- [x] Data transformation: Pure function pipeline (memoized)
- [x] Drag-and-drop: @dnd-kit (Pointer Events, cross-browser)
- [x] Live refresh: Polling + AG Grid applyTransaction
- [x] Bundling: Vite single-bundle, air-gapped
- [x] No backend/database/auth decisions needed

**✅ Implementation Patterns**
- [x] File naming conventions established
- [x] TypeScript naming conventions established
- [x] Component organization (by feature, co-located tests)
- [x] Zustand store patterns (slices, selectors, no async in slices)
- [x] Tableau API adapter pattern (single entry point)
- [x] AG Grid configuration pattern (columnDefBuilder)
- [x] Error handling pattern (typed errors, inline UI, retain last good data)
- [x] Loading state pattern (one indicator at a time)

**✅ Project Structure**
- [x] Complete directory structure (~40 files)
- [x] Architectural boundaries defined and enforceable
- [x] FR-to-file mapping complete
- [x] Integration points documented
- [x] Development workflow commands defined

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level:** High

**Key Strengths:**
- Clean separation of concerns via adapter/boundary patterns
- Pure function data transformation pipeline enables independent testing
- Zustand provides lightweight but structured state management
- @dnd-kit ensures cross-browser drag-and-drop (Chrome + future Edge)
- Air-gapped constraint is architecturally enforced, not just documented
- All 37 FRs explicitly mapped to implementation locations

**Areas for Future Enhancement (Post-V1):**
- Pyodide/WASM integration will need a new service module and store slice
- LLM integration will need an on-prem inference adapter (similar pattern to `tableauAdapter`)
- Map view component will plug into the existing PanelLayout and field selection system
- Shared transform library will need a pluggable storage service

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries (especially Tableau API and AG Grid API boundaries)
- Refer to this document for all architectural questions

**First Implementation Priority:**
```bash
npm create vite@latest tableau-telemetry-extension -- --template react-ts
```
Then install dependencies, configure Vite for air-gapped bundling, set up Zustand store skeleton, and create the `.trex` manifest.
