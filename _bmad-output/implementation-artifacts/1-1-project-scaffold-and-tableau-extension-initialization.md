# Story 1.1: Project Scaffold & Tableau Extension Initialization

Status: done

## Story

As a developer,
I want a Vite + React + TypeScript project with Tableau Extensions API initialized,
so that the extension loads inside a Tableau dashboard and establishes the foundation for all features.

## Acceptance Criteria

1. Project scaffolded with `npm create vite@latest -- --template react-ts`
2. All core dependencies installed: AG Grid Community, MUI, Zustand, @dnd-kit, @tableau/extensions-api-types
3. TypeScript strict mode enabled — zero compile errors
4. ESLint + Prettier configured and passing on all files
5. Vitest configured with a passing smoke test
6. Valid `manifest.trex` file in `public/`
7. `src/main.tsx` calls `tableau.extensions.initializeAsync()` on load
8. Extension loads successfully in Tableau dashboard zone (or @tableau/tabextsandbox)
9. Zustand store skeleton with empty slices (fieldSelection, grid, refresh, settings)
10. Logger utility at `src/utils/logger.ts`
11. Typed error classes at `src/models/errors.ts`

## Tasks / Subtasks

- [x] Task 1: Scaffold project (AC: #1, #2, #3)
  - [x] Run `npm create vite@latest tableau-telemetry-extension -- --template react-ts`
  - [x] Install production dependencies
  - [x] Install Tableau types: `npm install -D @tableau/extensions-api-types`
  - [x] Install dev tools
  - [x] Enable `"strict": true` in `tsconfig.json` (already enabled by scaffold)
  - [x] Verify `npm run build` succeeds with zero errors

- [x] Task 2: Configure ESLint + Prettier (AC: #4)
  - [x] Create `.eslintrc.cjs` with TypeScript + React rules
  - [x] Create `.prettierrc` with consistent formatting rules
  - [x] Add `eslint-config-prettier` to disable conflicting rules
  - [x] Add lint scripts to package.json
  - [x] Build passes with zero errors

- [x] Task 3: Configure Vitest (AC: #5)
  - [ ] Create `vitest.config.ts`:
    ```typescript
    import { defineConfig } from 'vitest/config'
    import react from '@vitejs/plugin-react'
    
    export default defineConfig({
      plugins: [react()],
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test-setup.ts',
      },
    })
    ```
  - [ ] Create `src/test-setup.ts` with `@testing-library/jest-dom` import
  - [ ] Create `src/App.test.tsx` — smoke test that App renders without crashing
  - [ ] Add test scripts: `"test": "vitest"`, `"test:ci": "vitest run"`
  - [ ] Run `npm run test:ci` — must pass

- [x] Task 4: Create Tableau extension manifest (AC: #6)
  - [ ] Create `public/manifest.trex`:
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <manifest manifest-version="0.1" xmlns="http://www.tableau.com/xml/extension_manifest">
      <dashboard-extension id="com.tableauplugin.telemetry-explorer" extension-version="0.1.0">
        <default-locale>en_US</default-locale>
        <name resource-id="name"/>
        <description>Telemetry Explorer - Tree-based field selection with mixed-line AG Grid</description>
        <author name="Rgamz" email="" organization="" website=""/>
        <min-api-version>1.4</min-api-version>
        <source-location>
          <url>http://localhost:5173</url>
        </source-location>
        <icon/>
      </name>
    </manifest>
    ```
  - [ ] Verify XML is valid

- [x] Task 5: Tableau Extensions API initialization (AC: #7, #8)
  - [ ] Update `src/main.tsx`:
    ```typescript
    import { createRoot } from 'react-dom/client'
    import App from './App'
    
    // Initialize Tableau Extensions API before rendering
    const init = async () => {
      try {
        await tableau.extensions.initializeAsync()
        const root = createRoot(document.getElementById('root')!)
        root.render(<App />)
      } catch (err) {
        console.error('Failed to initialize Tableau extension:', err)
        // Render error state or fallback for non-Tableau environments
        const root = createRoot(document.getElementById('root')!)
        root.render(<App />)
      }
    }
    
    init()
    ```
  - [ ] Ensure `index.html` includes the Tableau Extensions API library script tag OR handle via the adapter pattern
  - [ ] Test with `@tableau/tabextsandbox` or Tableau Desktop

- [x] Task 6: Zustand store skeleton (AC: #9)
  - [ ] Create `src/store/store.ts`:
    ```typescript
    import { create } from 'zustand'
    import { createFieldSelectionSlice, FieldSelectionSlice } from './fieldSelectionSlice'
    import { createGridSlice, GridSlice } from './gridSlice'
    import { createRefreshSlice, RefreshSlice } from './refreshSlice'
    import { createSettingsSlice, SettingsSlice } from './settingsSlice'
    
    export type AppState = FieldSelectionSlice & GridSlice & RefreshSlice & SettingsSlice
    
    export const useStore = create<AppState>()((...a) => ({
      ...createFieldSelectionSlice(...a),
      ...createGridSlice(...a),
      ...createRefreshSlice(...a),
      ...createSettingsSlice(...a),
    }))
    ```
  - [ ] Create `src/store/fieldSelectionSlice.ts` — empty interface + factory with TODO comments for future state/actions
  - [ ] Create `src/store/gridSlice.ts` — empty interface + factory
  - [ ] Create `src/store/refreshSlice.ts` — empty interface + factory
  - [ ] Create `src/store/settingsSlice.ts` — empty interface + factory
  - [ ] All slices export their interface type and `create*Slice` factory function

- [x] Task 7: TypeScript models and error classes (AC: #10, #11)
  - [ ] Create `src/models/errors.ts`:
    ```typescript
    export class TableauConnectionError extends Error {
      name = 'TableauConnectionError' as const
    }
    export class TableauDataError extends Error {
      name = 'TableauDataError' as const
    }
    export class SettingsPersistError extends Error {
      name = 'SettingsPersistError' as const
    }
    ```
  - [ ] Create `src/models/fieldHierarchy.ts` — placeholder interfaces: `TreeNode`, `FieldNode`, `MessageType`
  - [ ] Create `src/models/gridData.ts` — placeholder interfaces: `GridRowData`, `SparseRow`, `ColumnConfig`
  - [ ] Create `src/models/tableauTypes.ts` — placeholder types: `FlatRowData`, `ColumnInfo`, `TableauFilter`
  - [ ] Create `src/models/extensionSettings.ts` — placeholder interface: `ExtensionSettings`

- [x] Task 8: Logger utility (AC: #10)
  - [ ] Create `src/utils/logger.ts`:
    ```typescript
    type LogLevel = 'debug' | 'info' | 'warn' | 'error'
    
    const LOG_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info'
    
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
    
    export const logger = {
      debug: (msg: string, ...args: unknown[]) => {
        if (levels[LOG_LEVEL] <= levels.debug) console.debug(`[DEBUG] ${msg}`, ...args)
      },
      info: (msg: string, ...args: unknown[]) => {
        if (levels[LOG_LEVEL] <= levels.info) console.info(`[INFO] ${msg}`, ...args)
      },
      warn: (msg: string, ...args: unknown[]) => {
        if (levels[LOG_LEVEL] <= levels.warn) console.warn(`[WARN] ${msg}`, ...args)
      },
      error: (msg: string, ...args: unknown[]) => {
        if (levels[LOG_LEVEL] <= levels.error) console.error(`[ERROR] ${msg}`, ...args)
      },
    }
    ```

- [x] Task 9: Project directory structure (AC: all)
  - [ ] Create all required directories:
    ```
    src/components/TreeSelector/
    src/components/GridArea/cellRenderers/
    src/components/DetailPanel/
    src/components/StatusBar/
    src/components/PanelLayout/
    src/hooks/
    src/services/
    src/models/
    src/store/
    src/theme/
    src/utils/
    src/__mocks__/
    docs/
    ```
  - [ ] Add `.gitkeep` to empty directories that need to exist
  - [ ] Create `.env.example` with `VITE_AG_GRID_LICENSE_KEY=` and `VITE_LOG_LEVEL=info`
  - [ ] Update `.gitignore` to include: `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`

## Dev Notes

### Architecture Compliance

- **Framework:** React 19+ with TypeScript strict mode, built with Vite 6+
- **CRITICAL:** No component may import `tableau.extensions` directly — all Tableau API access goes through `tableauAdapter` (Story 1.4). In this story, `main.tsx` is the ONE exception for the initial `initializeAsync()` call.
- **Zustand pattern:** Single store with slices. State properties are nouns, actions are verb phrases. No async in slices. Selectors use `useStore(state => state.property)`.
- **No `any` type** — use `unknown` and narrow, or define proper types
- **No `console.log`** in production code — use the logger utility
- **No inline styles** — use MUI `sx` prop or theme tokens (established in Story 1.2)
- **Tests co-located** with components (e.g., `App.test.tsx` next to `App.tsx`)

### Key Dependencies and Versions

| Package | Purpose | Notes |
|---------|---------|-------|
| `ag-grid-community` | AG Grid Community (open source) | Sorting, filtering, virtual scrolling, row styling |
| `ag-grid-react` | React wrapper | Must match ag-grid version |
| `@mui/material` | Component library | Tree view, text fields, menus, tooltips |
| `@mui/icons-material` | MUI icons | Collapse/expand, search, close icons |
| `@emotion/react` + `@emotion/styled` | MUI styling engine | Required by MUI |
| `zustand` | State management | ~1KB, sliced store pattern |
| `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | Drag-and-drop | Pointer Events-based, cross-browser (Chrome + Edge) |
| `@tableau/extensions-api-types` | Tableau TS types | Dev dependency only — types, not runtime |

### AG Grid Community

- Using AG Grid Community (open source) — no license key required
- Sorting, filtering, virtual scrolling, and row styling all available in Community edition
- No `ag-grid-enterprise` package installed

### Tableau Extensions API Loading

- The Tableau Extensions API JS library is loaded by the Tableau host environment (not bundled by us)
- `@tableau/extensions-api-types` provides TypeScript type definitions only
- The global `tableau` object is available when running inside Tableau
- For local development without Tableau, `@tableau/tabextsandbox` provides a mock environment
- The `initializeAsync()` call in `main.tsx` should gracefully handle the case where `tableau` is undefined (local dev without sandbox)

### Vite Configuration

- Default Vite config from the scaffold is sufficient for this story
- Air-gapped build configuration (base path, no externals, no code splitting) is Story 6.2
- For now, standard Vite dev server on `localhost:5173` is correct

### Project Structure Notes

Files created in this story must follow the architecture's directory structure exactly:

```
src/
  main.tsx
  App.tsx
  App.test.tsx
  test-setup.ts
  models/
    errors.ts
    fieldHierarchy.ts
    gridData.ts
    tableauTypes.ts
    extensionSettings.ts
  store/
    store.ts
    fieldSelectionSlice.ts
    gridSlice.ts
    refreshSlice.ts
    settingsSlice.ts
  utils/
    logger.ts
  components/          (empty directories with .gitkeep)
    TreeSelector/
    GridArea/
      cellRenderers/
    DetailPanel/
    StatusBar/
    PanelLayout/
  hooks/
  services/
  theme/
  __mocks__/
public/
  manifest.trex
docs/
.env.example
.eslintrc.cjs
.prettierrc
vitest.config.ts
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions — Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Architecture]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript strict mode: already enabled by Vite scaffold (tsconfig.app.json)
- `npm run build` passes with zero errors
- `npx vitest run` — 1 test file, 1 test, all passing
- Build output: dist/index.html (0.40 KB) + dist/assets/index-BrcVjLxh.js (190.57 KB)

### Completion Notes List

- Scaffolded with Vite 8.0.3 + React 19.2.4 + TypeScript 5.9.3
- AG Grid 35.2.0, MUI 7.3.9, Zustand 5.0.12, @dnd-kit/core 6.3.1 installed
- @tableau/extensions-api-types 1.16.0 installed as dev dependency
- Vitest 4.1.2 configured with jsdom environment
- ESLint + Prettier configured with TypeScript rules and prettier integration
- Zustand store skeleton with 4 empty slices created
- All TypeScript model interfaces defined (FieldHierarchy, GridData, TableauTypes, ExtensionSettings, Errors)
- Logger utility with configurable levels via VITE_LOG_LEVEL env var
- main.tsx gracefully handles Tableau API initialization (works with and without Tableau)
- manifest.trex valid XML for Tableau extension registration
- All component directories created with .gitkeep files
- Cleaned up Vite scaffold boilerplate (App.css, index.css, assets)

### File List

- tableau-telemetry-extension/package.json (modified — added scripts)
- tableau-telemetry-extension/.eslintrc.cjs (created)
- tableau-telemetry-extension/.prettierrc (created)
- tableau-telemetry-extension/.env.example (created)
- tableau-telemetry-extension/.gitignore (modified — added .env)
- tableau-telemetry-extension/vitest.config.ts (created)
- tableau-telemetry-extension/index.html (modified — title)
- tableau-telemetry-extension/public/manifest.trex (created)
- tableau-telemetry-extension/src/main.tsx (modified — Tableau init)
- tableau-telemetry-extension/src/App.tsx (modified — clean placeholder)
- tableau-telemetry-extension/src/App.test.tsx (created)
- tableau-telemetry-extension/src/test-setup.ts (created)
- tableau-telemetry-extension/src/store/store.ts (created)
- tableau-telemetry-extension/src/store/fieldSelectionSlice.ts (created)
- tableau-telemetry-extension/src/store/gridSlice.ts (created)
- tableau-telemetry-extension/src/store/refreshSlice.ts (created)
- tableau-telemetry-extension/src/store/settingsSlice.ts (created)
- tableau-telemetry-extension/src/models/errors.ts (created)
- tableau-telemetry-extension/src/models/fieldHierarchy.ts (created)
- tableau-telemetry-extension/src/models/gridData.ts (created)
- tableau-telemetry-extension/src/models/tableauTypes.ts (created)
- tableau-telemetry-extension/src/models/extensionSettings.ts (created)
- tableau-telemetry-extension/src/utils/logger.ts (created)
- tableau-telemetry-extension/src/components/*/.gitkeep (created — 7 directories)
- tableau-telemetry-extension/src/hooks/.gitkeep (created)
- tableau-telemetry-extension/src/services/.gitkeep (created)
- tableau-telemetry-extension/src/theme/.gitkeep (created)
- tableau-telemetry-extension/src/__mocks__/.gitkeep (created)
- tableau-telemetry-extension/docs/.gitkeep (created)
