---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments: [product-brief-TableauPlugin.md, product-brief-TableauPlugin-distillate.md, project-context.md]
workflowType: 'prd'
documentCounts:
  briefs: 1
  distillates: 1
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: web_app
  domain: aerospace_defense
  complexity: high
  projectContext: greenfield
---

# Product Requirements Document - TableauPlugin

**Author:** Rgamz
**Date:** 2026-04-03

## Executive Summary

The Tableau Telemetry Extension is a Tableau Dashboard Extension purpose-built for aerospace and defense analysts who work daily with telemetry, sensor data, and communications logs. These analysts navigate ~200 deeply nested message types (up to 6 levels, 1-100 fields each) to answer operational questions — but Tableau's native capabilities force them into fragmented workflows: flat tables that can't handle hierarchical data, limited map visualizations that can't render styled movement tracks, and Python transformations that require leaving the Tableau environment entirely.

This extension solves that by delivering four integrated views across a phased roadmap — all within Tableau's native filter and authentication framework, requiring zero additional infrastructure:

- **Table View (V1):** AG Grid-powered sparse grid with tree-based field selection, mixed-line interleaving of multiple message types by time, row detail tree, array drill-in, and 10-second live data refresh. Handles 1K-35K rows.
- **Python Scripting (Phase 2):** In-browser transforms via Pyodide/WASM with TabPy integration. Shared transform library stored in a pluggable backend (shared directory initially). Natural language scripting added alongside LLM features.
- **Graph View (Phase 2):** AI-generated Plotly visualizations from natural language descriptions, with editable code for fine-tuning.
- **Map View (Phase 3):** Track/line visualization with configurable visual encoding (color, width, icons, tooltips) using an internal map component.

All views share a unified field/message selection control — manual tree navigation in V1, enhanced with LLM-assisted selection in Phase 2 that leverages existing message definition documents (ICD/data dictionary) to resolve natural language queries like *"show me range vs azimuth vs pulse width"* into the correct messages and fields.

The extension is database-agnostic (Tableau brokers all data access), deploys on-prem in a fully air-gapped environment (a competitive advantage in regulated environments), and builds a compounding organizational asset through its shared Python transform library.

### What Makes This Special

**Nested message structure as a first-class data model.** Every competitor — Tableau native, Splunk, Grafana, Twilize Tables, Mapbox — flattens or ignores message hierarchy. This extension understands it: tree selectors, tree detail views, sparse mixed-line grids, and intelligent array handling. Purpose-built for telemetry, not adapted from generic tooling.

**AI-grounded field discovery (Phase 2).** The message schema documents that already exist in the organization become the foundation for LLM-assisted field selection, natural language scripting, and auto-generated graph code. This transforms every interaction from manual tree navigation to conversational intent.

**Integration is the product.** No single Tableau extension combines a performant data grid, Python scripting, graph generation, and map visualization. Each capability exists in isolation elsewhere. The unified field/message selection control and shared transform library tie them into one cohesive analytical environment.

**Zero-infrastructure adoption.** Analysts open a Tableau dashboard and have full capability — no credentials, no separate tools, no data pipelines. Tableau handles auth and data connections. On-prem air-gapped deployment eliminates SaaS competitors in regulated procurement.

## Project Classification

- **Project Type:** Web application — React SPA running as a Tableau Dashboard Extension (iframe)
- **Domain:** Aerospace / Defense — telemetry, sensor data, communications log analysis
- **Complexity:** High — AG Grid sparse model, Tableau Extensions API integration, live data refresh, air-gapped bundling; future phases add Pyodide/WASM Python runtime and on-prem LLM integration
- **Project Context:** Greenfield — no existing codebase

## Success Criteria

### User Success

- Analysts independently select telemetry and log messages, display them in a mixed-line grid, and explore data without data engineering support
- Field selection via the tree view is intuitive — analysts navigate ~200 message types and find fields without memorizing dotted paths
- Row detail tree view gives full visibility into any message's nested structure with expand/collapse
- Analysts build and share Tableau dashboards with pre-configured field selections, creating reusable analytical starting points

### Business Success

- Extension becomes the default tool for telemetry/log exploration within Tableau dashboards
- Reduction in data engineering requests for custom dashboard builds
- In Phase 2: growing shared transform library indicates analysts are investing in the tool and collaborating through it

### Technical Success

- 10K mixed-line rows render in < 5 seconds
- Dynamic filter/sort response < 2 seconds
- Scroll rendering < 250ms
- 35K rows (upper bound) functional with acceptable degradation
- Tableau filter integration (especially time filter) works reliably
- Live refresh every 10 seconds without disrupting analyst workflow
- Extension loads within Tableau without degrading dashboard performance

## Product Scope

### V1 — Table View (MVP)

- Table View (AG Grid): tree-based field selector, mixed-line sparse grid, smart column headers (short name + tooltip path), row detail tree view, array click-to-expand, column filtering, sorting
- Tableau filter integration (time filter + dashboard filters)
- Live data refresh (10-second polling)
- State persistence (field selections saved with Tableau workbook)
- Tableau Dashboard Extension packaging, air-gapped on-prem deployment

**Key strategic decision:** Python scripting deferred from V1 to de-risk delivery. Pyodide/WASM bundling in an air-gapped environment is a significant technical challenge that should not block the core table view launch.

### Phase 2 — Python Scripting + AI Layer

- Python scripting engine (Pyodide/WASM, in-browser execution)
- Shared transform library (shared directory, pluggable backend)
- LLM-assisted field selection (on-prem inference, grounded in ICD/data dictionary)
- Natural language Python scripting interface
- Graph View (Plotly, AI-generated from natural language, editable code)
- TabPy integration

### Phase 3 — Map View

- Map View using internal map component (when available from another team)
- Track/line visualization with field-to-visual-property mapping (location, color, width, icons, tooltips)
- Shared field/message selection control across all views

### Phase 4 — Platform Maturity

- Advanced transform governance (versioning, review, deprecation)
- Schema-driven onboarding for new message domains (Protobuf, Avro, JSON Schema)
- Generalization to IoT, network monitoring, financial event streams

## User Journeys

### Journey 1: Analyst — Incident Investigation (Primary Success Path)

**Persona: Dani, Telemetry Analyst**
Dani is an experienced aerospace analyst who investigates anomalies flagged during test flights. She knows the telemetry domain deeply — message types, field meanings, signal characteristics — but spends too much time wrestling with tools instead of analyzing data.

**Opening Scene:** Dani receives a report: altitude hold behaved erratically during a 20-minute window of a test flight. She needs to figure out why.

**Rising Action:** Dani opens Tableau and navigates to a flight overview dashboard. She uses the time filter to zoom into the 20-minute window where the anomaly occurred. She sees something unusual in the high-level plots — a spike she wants to investigate deeper.

She opens a new Table View extension panel. The tree selector shows all ~200 message types. She expands "Navigation" and selects altitude, vertical rate, and commanded altitude fields. She expands "Flight Control" and selects actuator commands and control mode. She also adds a log message stream to catch any system warnings during that window.

The grid populates in under 5 seconds — mixed lines from three message types interleaved by time. She sorts by timestamp and scrolls through the data. She notices the actuator commands look unusual. She clicks a row to open the detail tree view, inspecting all fields of that particular flight control message to see what else was happening at that instant.

**Climax:** The mixed-line view reveals a pattern: actuator command spikes coincide with specific log warnings. By clicking through row details and cross-referencing timestamps across message types, Dani identifies that the actuator is saturating before the altitude correction completes.

**Resolution:** Dani has her answer in 15 minutes instead of the hours it used to take. She didn't need to ask the data team for a custom dashboard. She didn't hunt through a flat list of 2,000 dotted field names. She files her finding and moves to the next task.

*Note: In Phase 2, Dani will also be able to apply pre-saved Python transforms and use natural language field selection to accelerate this workflow further.*

### Journey 2: Analyst — Dashboard Building (Self-Service Path)

**Persona: Dani again**
After a series of investigations, Dani realizes her team frequently needs the same set of telemetry messages for a recurring analysis task.

**Opening Scene:** Dani decides to build a reusable dashboard instead of repeating the same field selections every time.

**Rising Action:** She creates a new Tableau dashboard and adds the Table View extension. She configures the tree selector with the message types and fields her team commonly needs. She sets up the Tableau time filter and adds some context charts alongside the extension.

**Climax:** She publishes the dashboard to Tableau Server. Her teammates open it and immediately have the right fields pre-selected — they just adjust the time filter to their investigation window and start analyzing.

**Resolution:** A task that used to involve 10 minutes of field selection setup every time is now a one-click dashboard open. The team standardizes around a common analytical starting point.

### Journey 3: Analyst — Creating and Sharing a Transform (Phase 2)

**Persona: Marcus, Senior Analyst**
Marcus is the team's signal processing expert. He frequently writes Python transforms that others reuse.

**Opening Scene:** During an investigation, Marcus realizes he needs a coordinate transformation — converting between two reference frames — that no existing transform covers.

**Rising Action:** Marcus opens the Python scripting panel within the Table View. He writes a new transform that takes latitude, longitude, and altitude fields and computes a derived position in a different coordinate frame. He tests it against the current data in the grid — the new computed columns appear immediately.

**Climax:** The transform works correctly. Marcus saves it to the shared directory with a descriptive name and documents what it does. Next week, three other analysts use his transform without needing to understand the math.

**Resolution:** The shared transform library grows by one. Institutional knowledge that previously lived only in Marcus's head is now a reusable asset available to every analyst on the team.

### Journey 4: IT/Data Team — Extension Deployment and Maintenance

**Persona: Alex, Data Platform Engineer**
Alex manages the team's Tableau Server environment and is responsible for deploying and maintaining extensions.

**Opening Scene:** The Tableau Telemetry Extension is ready for V1 deployment. Alex needs to get it running on the organization's air-gapped Tableau Server.

**Rising Action:** Alex deploys the self-contained extension package to Tableau Server. He adds the extension to the Tableau Server allowlist so analysts can embed it in their dashboards. No external network configuration is needed — the package includes everything.

**Climax:** Analysts start using the extension. Alex monitors for issues. When a new version is released, he follows the same deployment process to update.

**Resolution:** The extension runs reliably in the existing Tableau infrastructure with minimal ongoing maintenance. Alex's involvement is limited to deployment updates — analysts self-serve everything else.

### Journey Requirements Summary

| Journey | Phase | Capabilities Revealed |
|---------|-------|----------------------|
| Incident Investigation | V1 | Tree field selector, mixed-line grid, Tableau time filter handoff, row detail tree, live refresh, performance (10K rows < 5s) |
| Dashboard Building | V1 | Extension configuration persistence, field selection state saved with dashboard, Tableau Server publishing |
| Transform Creation | Phase 2 | Python scripting panel, in-browser execution, save-to-shared-directory, transform discoverability |
| IT Deployment | V1 | On-prem air-gapped packaging, Tableau Server allowlist support, extension update process |

## Domain-Specific Requirements

### Environment Constraints

- **Fully air-gapped deployment** — the Tableau Server environment has no internet access. All extension resources, libraries, and dependencies must be self-contained in the deployment package.
- No compliance, certification, or regulatory requirements apply to the extension itself.

### Air-Gap Implications

| Component | Phase | Constraint | Mitigation |
|-----------|-------|-----------|------------|
| AG Grid | V1 | No CDN loading | Bundle with extension package |
| React + dependencies | V1 | No CDN loading | Bundle with extension package |
| Pyodide/WASM | Phase 2 | No package downloads at runtime | Pre-package all Python libraries in the deployment bundle |
| Python transforms | Phase 2 | No pip install at runtime | Curate and bundle supported library set |
| LLM integration | Phase 2 | No cloud API calls | On-prem/local inference server required |
| Plotly | Phase 2 | No CDN loading | Bundle with extension package |
| Extension updates | All | No auto-update mechanism | Manual deployment by IT/data team |

### Technical Constraints

- All assets must load from the Tableau Server or the extension package — zero external network requests at any point during runtime
- V1: JavaScript, CSS, AG Grid bundled. Phase 2 adds WASM binaries, Python packages, Plotly.
- Phase 2 Python library set is fixed per deployment version — IT/data team updates it as part of the extension release cycle
- Phase 2 LLM architecture must be designed for on-prem inference — cloud-based LLM APIs are not an option

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Integrated analytical environment within Tableau.** No existing Tableau extension combines a performant data grid, Python scripting, graph generation, and map visualization. Each exists in isolation (Twilize for tables, Mapbox for maps, TabPy for Python). The integration — with a shared field/message selection control and shared transform library — is the innovation.

**2. Nested message schema as first-class data model.** Every competitor (Tableau native, Splunk, Grafana, third-party extensions) flattens hierarchical data. This extension preserves and exposes the tree structure throughout the UX: field selector, row detail, column naming. An architectural bet that hierarchical data should be navigated hierarchically.

**3. LLM-assisted field discovery grounded in existing documents (Phase 2).** The organization's existing ICD/data dictionary becomes the knowledge base for AI-powered field selection. Analysts describe intent in domain language ("range vs azimuth vs pulse width") and the LLM resolves it to specific messages and fields. Novel because it leverages documentation that already exists — no new data curation needed.

**4. Natural language to graph pipeline (Phase 2).** Analyst describes a visualization → AI finds the fields → generates Plotly code → renders the graph → analyst edits the code. This bypasses the traditional select-fields-then-configure-chart workflow. Editable code keeps analysts in control.

### Market Context & Competitive Landscape

- No Tableau extension on the Exchange offers LLM-assisted field selection or natural language graph generation
- TabPy provides Python integration but through calculated fields, not an interactive scripting/generation interface
- Twilize Tables uses AG Grid but has no AI features, no scripting, no map
- The air-gapped constraint means cloud-based AI tools (ChatGPT, Copilot) are not available to analysts — an on-prem AI-powered extension fills a gap that SaaS AI tools literally cannot reach

### Validation Approach

| Innovation | Validation Method |
|-----------|------------------|
| Integrated environment | V1 table view validates the core architecture; Phase 2/3 extend it |
| Nested message model | V1 tree selector and mixed-line grid — analyst feedback on navigation speed vs. flat lists |
| LLM field discovery | Phase 2 prototype with existing ICD document against a local LLM; measure field-resolution accuracy |
| NL-to-graph | Phase 2 prototype with Plotly code generation; measure analyst edit rate (lower = better AI output) |

### Innovation Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| LLM accuracy in field resolution | Fallback to manual tree selector always available; LLM suggestions are recommendations, not forced |
| On-prem LLM performance | Architecture must support local inference; model selection during architecture phase |
| Pyodide/WASM bundle size in air-gap | Deferred from V1; profile and curate minimal Python library set before committing |
| Generated Plotly code quality | Editable code ensures analyst can always fix/refine; template-based generation reduces error surface |

## Technical Architecture

### Platform

- **Framework:** React (SPA)
- **Hosting:** Embedded in Tableau Dashboard as an Extension (iframe)
- **Data access:** Tableau Extensions API — all data flows through Tableau's data layer
- **State management:** Extension persists field selections and configuration via Tableau Settings API (saved with Tableau workbook)
- **Communication:** Tableau Extensions API for data queries, filter events, and dashboard interactions

### Browser Support

| Browser | Support Level |
|---------|-------------|
| Chrome (latest) | Primary — full support and testing |
| Other browsers | Not required for V1 |

Rationale: organization's Tableau environment is standardized on Chrome.

### Live Data Refresh

- Extension polls for new data every **10 seconds**
- New rows are inserted in correct time-order position, maintaining the current sort
- Active filters and sorts are re-applied after refresh — analyst's view state is preserved
- Grid does not "jump" or lose scroll position during refresh
- Visual indicator when new data has arrived

### Responsive Design

- Extension fills the Tableau dashboard zone it's placed in — responsive to zone resizing
- AG Grid handles column resizing and virtual scrolling natively
- Tree selector panel is collapsible to maximize grid space
- No requirement for mobile/tablet — Tableau Desktop and Server (browser) only

### Implementation Considerations

- **Bundling:** All V1 dependencies (React, AG Grid) self-contained — zero external network requests
- **AG Grid Enterprise license** required for tree data, row grouping, advanced filtering
- **Tableau Extensions API version:** target current stable API; monitor for breaking changes with Tableau Next
- **Extension manifest (.trex file):** required for Tableau Server registration and allowlisting
- **Accessibility:** No WCAG requirements for V1

## Project Scoping & Risk Mitigation

### MVP Strategy

**Approach:** Problem-solving MVP — deliver the minimum that lets analysts self-serve telemetry exploration within Tableau. If an analyst can select messages, view mixed-line data, inspect row details, filter/sort, and benefit from live refresh without leaving Tableau, V1 has proven its value.

### V1 Must-Have Capabilities

- Tree-based field selector (navigate ~200 message types hierarchically)
- Mixed-line sparse grid (interleave multiple message types by time, 10K rows < 5s)
- Smart column headers (short name, full path in tooltip)
- Row detail tree view (expand/collapse all fields and values for a selected row)
- Array handling (single cell, click-to-expand)
- Column filtering and sorting (< 2s response)
- Virtual scrolling (< 250ms)
- Tableau time filter integration + dashboard filter support
- Live data refresh (10-second polling, maintain scroll position and view state)
- State persistence (field selections saved with Tableau workbook)
- Air-gapped deployment (all assets bundled, zero network requests)
- Extension manifest (.trex) for Tableau Server allowlisting

### Risk Mitigation Strategy

| Risk | Phase | Mitigation |
|------|-------|-----------|
| AG Grid performance with 35K sparse rows | V1 | Benchmark early with realistic data; 35K is upper bound with acceptable degradation |
| Tableau Extensions API flat data model vs. nested messages | V1 | Validate encoding/decoding approach during architecture; foundational technical assumption |
| Live refresh disrupting analyst workflow | V1 | Preserve scroll position, filter state, and sort order across refreshes; visual indicator for new data |
| Pyodide/WASM bundle size in air-gap | Phase 2 | Deferred from V1; profile and curate minimal library set before committing |
| On-prem LLM inference quality | Phase 2 | Prototype with existing ICD against local models early; fallback to manual tree selector always available |
| Internal map component delivery timeline | Phase 3 | Map view fully decoupled; V1 and Phase 2 deliver full value without it |
| Tableau platform evolution (Tableau Next) | All | Monitor Extensions API release notes; design for API abstraction layer |

## Functional Requirements

### Field & Message Selection

- **FR1:** Analyst can browse all available message types in a hierarchical tree view organized by message structure
- **FR2:** Analyst can expand and collapse tree nodes to navigate nested field hierarchies (up to 6 levels)
- **FR3:** Analyst can select/deselect individual fields from any message type for display in the grid
- **FR4:** Analyst can select/deselect entire message types (selecting all fields within that type)
- **FR5:** Analyst can see the full dotted path of any field in the tree view
- **FR6:** Analyst can search or filter within the tree selector to find fields by name

### Data Grid Display

- **FR7:** Analyst can view selected fields from multiple message types in a single grid, interleaved by time (mixed-line sparse model)
- **FR8:** Analyst can see short field names as column headers with full dotted paths available in tooltips
- **FR9:** Analyst can view rows where only the columns belonging to that row's message type are populated (others blank)
- **FR10:** Analyst can distinguish which message type each row belongs to
- **FR11:** Analyst can scroll through up to 35K rows with virtual scrolling

### Row Detail & Inspection

- **FR12:** Analyst can click any row to open a detail view showing all fields and values for that message instance
- **FR13:** Analyst can expand and collapse nested field groups within the row detail tree view
- **FR14:** Analyst can view array fields as a single cell value in the grid
- **FR15:** Analyst can click an array cell to expand and drill into its contents

### Filtering & Sorting

- **FR16:** Analyst can sort the grid by any column (ascending/descending)
- **FR17:** Analyst can filter the grid by column values
- **FR18:** Analyst can apply multiple simultaneous filters across different columns
- **FR19:** Analyst can clear individual or all filters

### Tableau Integration

- **FR20:** Extension responds to Tableau dashboard time filter changes by updating displayed data
- **FR21:** Extension responds to other Tableau dashboard filter changes (non-time filters)
- **FR22:** Extension receives data exclusively through the Tableau Extensions API (no direct database access)
- **FR23:** Extension uses Tableau's authentication — no separate login required
- **FR24:** Analyst's field selections and configuration persist when the Tableau workbook is saved
- **FR25:** Analyst's field selections and configuration restore when a saved workbook is reopened

### Live Data Refresh

- **FR26:** Extension polls for new data at a configurable interval (default 10 seconds)
- **FR27:** New data rows are inserted in correct time-order position in the grid
- **FR28:** Active filters, sorts, and scroll position are preserved during refresh
- **FR29:** Analyst can see a visual indicator when new data has arrived

### Dashboard Building & Sharing

- **FR30:** Analyst can add the extension to any Tableau dashboard as a dashboard zone
- **FR31:** Extension adapts its layout to the dashboard zone size
- **FR32:** Analyst can collapse the tree selector panel to maximize grid display space
- **FR33:** Analyst can publish dashboards containing the extension to Tableau Server

### Deployment & Administration

- **FR34:** IT team can deploy the extension to Tableau Server as a self-contained package
- **FR35:** IT team can register the extension on the Tableau Server allowlist
- **FR36:** Extension operates with zero external network requests (air-gapped compatible)
- **FR37:** IT team can update the extension to a new version without disrupting existing dashboards

## Non-Functional Requirements

### Performance

| Metric | Requirement | Context |
|--------|-----------|---------|
| Grid initial render (10K rows) | < 5 seconds | Typical analyst session — must feel responsive |
| Grid initial render (35K rows) | Functional, degradation acceptable | Upper bound edge case |
| Filter/sort response | < 2 seconds | Dynamic interaction during analysis |
| Scroll rendering | < 250ms | Virtual scrolling must feel instant |
| Live refresh cycle | Every 10 seconds | New data insertion without disrupting view state |
| Tree selector expand/collapse | < 200ms | Navigation must feel instantaneous |
| Row detail tree open | < 1 second | Click-to-inspect should be near-instant |
| Extension initial load | < 10 seconds | Should not noticeably slow Tableau dashboard load |

### Security

- Extension inherits Tableau's authentication and authorization — no separate credential handling
- No data leaves the Tableau Server environment — all processing is in-browser or via Tableau APIs
- Extension does not make any external network requests (air-gapped requirement doubles as security guarantee)
- No user data is cached outside the Tableau session — when the dashboard closes, extension state is cleared except for workbook-persisted configuration

### Integration

- **Tableau Extensions API** — sole data interface; extension must conform to the current stable Extensions API contract
- **Tableau Filter Events** — extension subscribes to filter change events (time filter, categorical filters, parameter changes) and re-queries data accordingly
- **Tableau Settings API** — used for persisting extension configuration (field selections, column layout) with the workbook
- **Extension Manifest (.trex)** — must conform to Tableau's extension manifest specification for Server allowlisting

### Reliability

- Extension handles Tableau filter changes gracefully — no crashes, no data loss, no orphaned state
- If a data refresh fails (e.g., Tableau data source temporarily unavailable), the extension retains the last successful data and retries on next polling cycle
- If the extension encounters an unrecoverable error, it displays a clear error message rather than a blank or broken UI
- Extension handles edge cases: zero rows returned, single message type selected, all columns blank for a row, deeply nested arrays

### Deployability

- Extension is fully self-contained — a single deployable package including all JavaScript, CSS, and bundled libraries
- Package size minimized to the extent practical while maintaining full air-gapped functionality
- Deployment requires no modifications to Tableau Server configuration beyond allowlisting the extension
- Version updates deployable without requiring analysts to rebuild or reconfigure existing dashboards
