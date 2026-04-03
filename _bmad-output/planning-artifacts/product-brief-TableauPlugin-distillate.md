---
title: "Product Brief Distillate: TableauPlugin"
type: llm-distillate
source: "product-brief-TableauPlugin.md"
created: "2026-04-03"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: Tableau Telemetry Extension

## Data Model Characteristics

- ~200 message types, each stored as a separate database table
- Each message type has 1-100 fields, nesting up to 6 levels deep
- Field names are dotted paths: `xxx.yyy.zzz.ppp` — can be very long
- Arrays are present in message structures and need special handling
- Typical analyst session views 1K-35K messages at a time
- Messages are time-ordered; time is the primary axis for interleaving different message types
- Data types include telemetry, sensor data, and communications logs

## Grid / Table View — Detailed Requirements

- **Field selector**: tree view matching the nested message hierarchy — NOT a flat list
- **Column headers**: show only the leaf field name (e.g., `latitude`), full dotted path in tooltip (e.g., `vehicle.navigation.gps.position.latitude`)
- **Mixed-line model**: when user selects fields from 5 different message types, each row is a single message instance at one point in time; only that message type's columns are populated, all others blank — a sparse, time-aligned union, not a join
- **Row detail**: clicking a row opens a tree view showing ALL fields and values for that message, with expand/collapse — not just the selected columns
- **Arrays**: displayed as a single cell value; click to expand/drill into array contents
- **Grid must support**: column filtering, sorting, and integration with Tableau's dashboard filters (especially the time filter)
- **Grid library**: AG Grid (requires commercial/enterprise license for tree data, row grouping, advanced filtering features)

## Map View — Detailed Requirements

- Map component is an **internal component provided by another team** — NOT a third-party library; will be integrated when available
- Map draws **tracks/lines**, not just point markers — this is movement/path visualization
- User configures field-to-visual-property mapping:
  - Which field(s) define **location** (lat/lon)
  - Which field drives **line color**
  - Which field drives **line width**
  - Which field(s) determine **icon** display
  - Which field(s) populate the **tooltip**
- Shares the same tree-based field selector as the table view
- Shares the same Tableau filter integration as the table view
- Map view is **V2** — deferred until internal map component is delivered

## Python Scripting — Detailed Requirements

- Users write Python scripts for mathematical transformations on selected fields (unit conversions, signal processing, coordinate calculations, custom analytics)
- Execution model: **in-browser via Pyodide/WASM** + **TabPy integration** for Tableau-native Python capabilities
- Available from **both** table and map views
- **Shared transform library**:
  - V1 storage: shared directory accessible to all analysts
  - Storage backend is behind a **pluggable interface** — designed to be swappable to database, API, or registry later without changing UX
  - Transforms are discoverable and reusable by all org analysts

## Architecture Decisions (Captured)

- **Tableau is the data broker** — extension does NOT connect to databases directly; all data comes through Tableau's Extensions API
- **Tableau handles authentication** — no auth layer to build
- **Database agnostic** — whatever Tableau connects to, the extension supports
- **On-prem deployment** — or embedded in Tableau as a dashboard extension
- **Tableau Dashboard Extension** is the packaging/distribution model

## Competitive Intelligence

- **SuperTables** (Infotopics): incumbent table extension on Tableau Exchange; free for up to 5 users on Server/Cloud; struggles beyond ~30K rows; basic conditional formatting only; no Python, no map
- **Twilize Tables**: newer entrant, built on AG Grid; handles 1M+ rows via virtual scrolling; AI-assisted natural language filtering; color scales, icon sets, data bars, per-viewer saved views; table-only — no map, no scripting
- **Mapbox Geospatial Analytics Extension**: primary geo extension on Exchange; supports clustering, voronoi, grids, 3D extrusions; general-purpose geo — NOT tailored for track/line visualization with per-segment color/width encoding
- **TabPy** (Tableau official): Python execution via SCRIPT_ calculated fields; supports Cloud with SSL/auth; clunky UX for ad-hoc transforms; no in-dashboard scripting panel; no sharing mechanism
- **Tableau native maps**: support symbol, choropleth, point distribution; can ingest shapefiles/KML/GeoJSON; limited dynamic track-line rendering; no per-segment styling
- **Key gap**: NO single extension combines grid + map + Python scripting; each exists in isolation

## Market Context

- Tableau Services market projected $1.7B (2026) to $5.4B (2035)
- Tableau 2025.3 introduced "Trusted Extensions" — vetted, vulnerability-scanned extensions; reduces enterprise adoption friction
- AG Grid v35 (Dec 2025 / Feb 2026) added formulas, row group dragging, theme builder — mature and actively developed
- Tableau community has open idea request for "Support a Data Grid in Show Me" — unmet demand
- Defense/intelligence orgs actively use Tableau but lack telemetry-specific extensions
- Tableau "Next" / Salesforce integration is an ongoing platform transformation — API changes possible

## Open Questions for Architecture / PRD

- **Flat data model encoding**: Tableau's Extensions API delivers data as flat tables. How are nested message hierarchies preserved/encoded when passing through Tableau? This is the foundational technical assumption — needs validation before development.
- **Pyodide/WASM constraints**: browser-based Python has memory limits, no filesystem access, limited library availability. Performance with 35K rows of transform execution needs benchmarking.
- **Schema onboarding**: if the tool generalizes beyond telemetry, it needs a way to onboard new message schemas (Protobuf, Avro, JSON Schema). This architectural decision in V1 determines the generalization ceiling.
- **Transform governance**: how are transforms named, versioned, reviewed, deprecated? V1 can be lightweight but the structure matters for library quality over time.
- **Array expansion UX**: click-to-expand is decided, but specifics needed — expand inline? popup/modal? How does expanded array data interact with grid filtering/sorting?
- **Mixed-line visual differentiation**: when rows from 5 message types are interleaved, how does the user visually distinguish which row is which type? Row coloring? Type column? Grouping?
- **Tableau filter integration depth**: beyond the time filter, which other Tableau filter types are supported? Parameters? Sets? Dashboard actions?

## Scope Signals

- **V1 ships table view + Python scripting only** — this is intentional scope discipline, not a deferral; builds credibility before the harder map integration
- **Map view is V2**, gated on internal map component delivery from another team
- **NOT in V1**: real-time streaming, alerting, export/sharing of views, custom dashboard templates
- **Transform sharing in V1**: shared directory is sufficient; pluggable backend allows upgrade path
- User expressed that table and map are **separate implementations** — not combined into one view

## Rejected / Deferred Ideas

- Direct database connections — rejected; Tableau is the data broker by design
- Custom authentication — rejected; Tableau handles auth
- Full dotted path in column headers — rejected; short name with tooltip is the chosen UX
- Array explosion into multiple rows — rejected; single cell with click-to-expand chosen
- Server-side Python execution — deferred; in-browser (Pyodide) chosen for V1 with TabPy integration
