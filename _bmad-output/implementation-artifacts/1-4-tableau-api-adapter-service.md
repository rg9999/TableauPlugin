# Story 1.4: Tableau API Adapter Service

Status: done

## Story

As a developer,
I want a single adapter service for all Tableau Extensions API calls,
so that no component directly imports Tableau APIs and all data access is centralized and testable.

## Acceptance Criteria

1. `src/services/tableauAdapter.ts` exists with methods: initialize, getDataSourceSchema, queryData, subscribeToFilterChange, saveSettings, loadSettings
2. Adapter translates Tableau types to domain types (ColumnInfo[], FlatRowData[], etc.)
3. Adapter catches native Tableau errors and re-throws as typed errors (TableauConnectionError, TableauDataError, SettingsPersistError)
4. No file outside `tableauAdapter.ts` imports `tableau.extensions` directly
5. Adapter has unit tests with mocked Tableau API

## Tasks / Subtasks

- [x] Task 1: Create tableauAdapter service with all methods (AC: #1, #2, #3)
- [x] Task 2: Create unit tests with mocked Tableau API (AC: #5) — 18 tests
- [x] Task 3: Move Tableau init from main.tsx to use adapter (AC: #4)

## Dev Notes

### Architecture
- tableauAdapter is the SOLE entry point for all Tableau Extensions API calls
- All methods return Promises — no callbacks
- Translates Tableau-specific types to our domain types defined in src/models/
- Catches native Tableau errors and wraps in typed error classes from src/models/errors.ts
- The adapter pattern allows testing all components without a live Tableau connection
- main.tsx currently has a direct `tableau.extensions.initializeAsync()` call — this should use the adapter

### Tableau Extensions API Key Methods
- `tableau.extensions.initializeAsync()` — initialize the extension
- `tableau.extensions.dashboardContent.dashboard.worksheets` — get worksheets
- `worksheet.getUnderlyingTablesAsync()` — get data tables
- `worksheet.getUnderlyingTableDataAsync(tableId)` — get actual data
- `worksheet.getSummaryColumnsInfoAsync()` — get column schema
- `tableau.extensions.settings.set(key, value)` / `.get(key)` — persist settings
- `tableau.extensions.settings.saveAsync()` — save settings to workbook
- Filter events via `worksheet.addEventListener(TableauEventType.FilterChanged, callback)`

### Domain Type Mapping
- Tableau DataTable → FlatRowData[]
- Tableau Column → ColumnInfo
- Tableau settings → ExtensionSettings (serialized JSON)

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions — Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns — Tableau API Interaction Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- TypeScript compile: zero errors
- Vitest: 4 test files, 40 tests, all passing
- 18 adapter tests covering: init, schema, queryData, filterSubscribe, saveSettings, loadSettings

### Completion Notes List

- tableauAdapter.ts: 6 methods (initialize, getDataSourceSchema, queryData, subscribeToFilterChange, saveSettings, loadSettings)
- All methods translate Tableau types to domain types
- Error wrapping: TableauConnectionError, TableauDataError, SettingsPersistError with cause chaining
- Settings size guard warns at 1800KB (approaching 2MB Tableau limit)
- Graceful degradation: loadSettings returns null on corrupted data, initialize warns when not in Tableau
- main.tsx now uses tableauAdapter.initialize() instead of direct tableau.extensions call
- globals.d.ts provides type declarations for the global tableau object
- No file outside tableauAdapter.ts references tableau.extensions directly

### File List

- src/services/tableauAdapter.ts (created)
- src/services/tableauAdapter.test.ts (created)
- src/globals.d.ts (created)
- src/main.tsx (modified — use tableauAdapter)
