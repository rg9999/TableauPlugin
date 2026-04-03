# Tableau Telemetry Extension

A Tableau Dashboard Extension purpose-built for aerospace and defense analysts who work with telemetry, sensor data, and communications logs. It treats nested message schemas as a first-class data model — tree-based field selection, mixed-line sparse grids, row detail inspection, and 10-second live data refresh — all within Tableau's native filter and authentication framework.

## Why This Exists

Analysts navigate ~200 deeply nested message types (up to 6 levels, 1-100 fields each) to investigate anomalies and answer operational questions. Tableau's native capabilities force them into fragmented workflows:

- **Flat tables** can't handle hierarchical data or sparse multi-message interleaving
- **Map visualizations** can't render data-driven tracks with per-segment styling
- **Python transformations** require leaving Tableau entirely

No single Tableau extension combines a performant data grid, Python scripting, graph generation, and map visualization. This extension fills that gap.

## Features (V1 — Table View)

- **Tree-based field selector** — browse ~200 message types hierarchically; drag fields to the grid
- **Mixed-line sparse grid** — interleave multiple message types by time in a single AG Grid view (1K-35K rows)
- **Drag-and-drop** — drag fields from tree to grid; columns appear at the drop position immediately
- **Smart column headers** — short field names with full dotted path in tooltips
- **Row detail tree** — click any row to inspect all fields and values in an expandable nested tree
- **Array handling** — array fields display in a single cell with click-to-expand drill-in
- **Live data refresh** — 10-second polling with new rows inserted in time-order; scroll/filter/sort preserved
- **Tableau integration** — responds to time filter and dashboard filters; state persists with workbook saves
- **Air-gapped deployment** — fully self-contained bundle; zero external network requests

## Roadmap

| Phase | Features |
|-------|----------|
| **V1** | Table View (AG Grid), tree field selector, live refresh, Tableau filter integration |
| **Phase 2** | Python scripting (Pyodide/WASM), LLM-assisted field selection, Graph View (Plotly), natural language scripting |
| **Phase 3** | Map View (internal map component), track/line visualization |
| **Phase 4** | Transform governance, schema-driven onboarding, domain generalization |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19+ (TypeScript, strict mode) |
| Build | Vite 6+ with Rollup |
| Grid | AG Grid Enterprise |
| Components | MUI (Material UI) |
| State Management | Zustand |
| Drag-and-Drop | @dnd-kit |
| Data Source | Tableau Extensions API (sole data interface) |
| Browser | Chrome (primary) |

## Project Structure

```
tableau-telemetry-extension/
├── public/
│   └── manifest.trex               # Tableau extension manifest
├── src/
│   ├── main.tsx                     # Entry point + Tableau initialization
│   ├── App.tsx                      # Root: DndContext + PanelLayout + StatusBar
│   ├── models/                      # TypeScript interfaces (fields, grid data, errors)
│   ├── services/
│   │   ├── tableauAdapter.ts        # All Tableau API calls (single entry point)
│   │   └── dataTransform.ts         # Hierarchy parsing, sparse grid model, nested reconstruction
│   ├── store/                       # Zustand store with slices (fieldSelection, grid, refresh, settings)
│   ├── hooks/                       # useTableauInit, useTableauFilters, useLiveRefresh, useSettingsPersistence
│   ├── components/
│   │   ├── PanelLayout/             # Three-panel flex layout with resize handles
│   │   ├── TreeSelector/            # MUI TreeView + @dnd-kit drag sources + search
│   │   ├── GridArea/                # AG Grid + drop target + cell renderers
│   │   ├── DetailPanel/             # Row detail nested tree view
│   │   └── StatusBar/               # Row count, message types, refresh status
│   ├── theme/                       # Design tokens, MUI theme, AG Grid theme
│   └── utils/                       # Hierarchy parser, row identity, logger
├── dist/                            # Build output (self-contained, air-gapped)
├── docs/
│   └── deployment-guide.md
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- AG Grid Enterprise license key
- Tableau Desktop or Tableau Server (for testing with real data)

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

For local development without Tableau Desktop, use the Tableau Extensions API sandbox:

```bash
npx @tableau/tabextsandbox
```

### Environment Variables

Create a `.env.local` file:

```
VITE_AG_GRID_LICENSE_KEY=your-license-key-here
```

### Build for Deployment

```bash
npm run build
```

Output is in `dist/` — a fully self-contained package with zero external dependencies.

### Testing

```bash
npm run test          # Watch mode
npm run test:ci       # Single run (CI)
```

## Deployment (Air-Gapped / On-Prem)

1. Run `npm run build` to produce the `dist/` directory
2. Copy `dist/` to Tableau Server's extension hosting directory
3. Add the extension URL to the Tableau Server allowlist
4. No server-side configuration needed — purely static files

Version updates: replace `dist/` contents. Existing dashboards pick up the new version on next load.

## Architecture

The extension is a **client-only React SPA** running in a Tableau iframe. There is no backend server, no database, and no custom authentication — Tableau handles everything.

**Key architectural patterns:**

- **Tableau API Adapter** — all Tableau Extensions API calls go through a single `tableauAdapter` service; no component imports Tableau directly
- **Data Transformation Pipeline** — flat Tableau data → nested hierarchy reconstruction → sparse mixed-line grid model → AG Grid row data (pure functions, memoized)
- **Zustand State Management** — single store with slices for field selection, grid state, refresh state, and settings persistence
- **@dnd-kit Drag-and-Drop** — Pointer Events-based (not HTML5 DnD) for cross-browser compatibility (Chrome + Edge)
- **AG Grid Transactions** — live refresh uses `applyTransaction()` for incremental row updates without full re-render

For complete architectural decisions, patterns, and validation, see [architecture.md](_bmad-output/planning-artifacts/architecture.md).

## Design

The extension follows a **professional data instrument** aesthetic — Tableau-harmonious colors, high data density, minimal UI chrome. Layout is a VS Code-style three-panel arrangement:

- **Left:** Collapsible tree selector (240px default, 32px collapsed)
- **Center:** AG Grid with pinned timestamp column
- **Bottom:** Row detail panel (appears on row click, 180px)
- **Footer:** Compact status bar (24px)

Message types are visually distinguished by colored left-edge stripes using Tableau's categorical palette. See the interactive mockup at [ux-design-directions.html](_bmad-output/planning-artifacts/ux-design-directions.html).

For complete UX specification, see [ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md).

## Planning Artifacts

| Document | Description |
|----------|-------------|
| [Product Brief](_bmad-output/planning-artifacts/product-brief-TableauPlugin.md) | Executive product brief |
| [PRD](_bmad-output/planning-artifacts/prd.md) | Product Requirements Document (37 FRs, NFRs, user journeys) |
| [UX Design Spec](_bmad-output/planning-artifacts/ux-design-specification.md) | Complete UX specification |
| [UX Mockup](_bmad-output/planning-artifacts/ux-design-directions.html) | Interactive HTML design direction mockup |
| [Architecture](_bmad-output/planning-artifacts/architecture.md) | Architecture Decision Document |

## License

Proprietary — internal use only.
