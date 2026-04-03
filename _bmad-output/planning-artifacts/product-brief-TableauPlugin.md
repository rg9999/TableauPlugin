---
title: "Product Brief: TableauPlugin"
status: "complete"
created: "2026-04-03"
updated: "2026-04-03"
inputs: [user interview, web research — competitive landscape, skeptic review, opportunity review, platform feasibility review]
---

# Product Brief: Tableau Telemetry Extension

## Executive Summary

Analysts working with telemetry, sensor data, and communications logs in Tableau face a fragmented workflow: Tableau's native tables can't handle complex, deeply nested message structures; map visualizations can't render data-driven tracks with per-segment styling; and applying mathematical transformations requires context-switching to external Python environments. No single Tableau extension addresses all three needs.

The Tableau Telemetry Extension is a Tableau Dashboard Extension that treats nested message schemas as a first-class data model — not a flat table to pre-process. It unifies tabular data exploration, geospatial track visualization, and Python-based field transformations into one cohesive tool, all within Tableau's native filter and authentication framework. Analysts open a Tableau dashboard and have full capability — no credentials to manage, no separate tool to install, no data pipeline to maintain.

The timing is right: Tableau's Trusted Extensions program (2025.3) provides enterprise credibility, AG Grid v35 delivers production-grade grid performance, and no competitor offers this integrated capability.

## The Problem

Analysts working with telemetry and sensor data deal with messages that are deeply nested (up to 6 levels), span ~200 message types with 1-100 fields each, and carry cryptic dotted-path field names like `vehicle.navigation.gps.position.latitude`. Today, they face three compounding frustrations:

**Tabular analysis is painful.** Tableau's native text tables can't handle hundreds of sparse columns from different message types interleaved by time. Analysts need to see mixed message lines — where a row at a given timestamp only has data from one message type, with other columns blank — and existing tools don't support this sparse-table model well. Selecting which fields to display from a flat list of hundreds of dotted paths is overwhelming.

**Geospatial track visualization is limited.** Analysts need to draw movement tracks on a map with visual encoding — line color for one metric, line width for another, icons for events, and tooltips for context. Tableau's native maps and the Mapbox extension handle point data but fall short on data-driven line rendering with per-segment styling.

**Transformations require tool-switching.** Applying mathematical transforms (unit conversions, signal processing, coordinate calculations) means leaving Tableau to write Python scripts elsewhere, then importing results back. TabPy exists but forces transformations through clunky SCRIPT_ calculated fields, not a user-friendly scripting interface. Transforms can't be easily shared across the analyst team.

The result: analysts either depend on data engineering teams to build custom dashboards or spend significant time juggling multiple disconnected tools. Time-to-insight suffers.

## The Solution

A Tableau Dashboard Extension with two views and a shared Python scripting engine:

**Table View (AG Grid)**
- **Tree-based field selector** — browse ~200 message types and their fields as an expandable tree hierarchy, not a flat list of dotted paths. Select the messages and fields you need with intuitive expand/collapse navigation.
- **Smart column headers** — short field names with full dotted path in tooltips, keeping the grid readable.
- **Mixed-line sparse grid** — interleave rows from multiple message types ordered by time. Only the selected columns for each message type are populated; others are blank. Supports 1K-35K rows.
- **Row detail tree view** — click any row to see all its fields and values as an expandable tree, preserving the nested message structure.
- **Array handling** — array fields display in a single cell with click-to-expand drill-in.
- **Filtering and sorting** — native grid capabilities integrated with Tableau's time filter and other dashboard filters.

**Map View (Internal Component)**
- Uses an internally-provided map component (to be integrated when available).
- Displays messages with geolocation fields as tracks/lines on a map.
- Users configure which fields map to: location, line color, line width, icons, and tooltip content.
- Same field selector tree and Tableau filter integration as the table view.

**Python Scripting Engine (Both Views)**
- Write Python scripts to apply mathematical transformations on selected fields.
- Transforms execute **in-browser** (e.g., Pyodide/WASM) — no server round-trips for transform execution. Integrates with **TabPy** for Tableau-native Python capabilities.
- **Shared transform library** — transforms are stored in a **shared directory** accessible to all analysts. The storage backend is abstracted behind a pluggable interface so it can be swapped later (e.g., to a database, API, or registry) without changing the user experience. Over time, this library encodes institutional knowledge about message structures, signal relationships, and domain heuristics — becoming organizational IP, not just a convenience feature.

All views leverage Tableau as the data broker — no direct database connections, no separate authentication. Whatever Tableau connects to, the extension supports. This zero-infrastructure adoption path is rare in enterprise tooling and eliminates the single biggest barrier to internal tool adoption.

## What Makes This Different

**Nested message structure as a first-class concept.** Every competitor — Tableau's native tables, Splunk, Grafana, third-party extensions — flattens or ignores message hierarchy. This extension understands it: tree selectors, tree detail views, intelligent array handling, and a data model built around typed, hierarchical messages. This is purpose-built for telemetry data, not adapted from generic tooling.

**No competitor offers this combination.** Twilize Tables has AG Grid performance but no map or scripting. Mapbox has geospatial capability but not track-line styling or tabular views. TabPy has Python but through a clunky interface with no sharing. This extension is the first to integrate all three in a single Tableau extension.

**On-prem deployment as a strength.** In regulated and security-sensitive environments, on-prem is a procurement requirement that eliminates most SaaS competitors. This is a competitive advantage, not a constraint.

**Shared Python transforms create a compounding knowledge base.** Transforms aren't trapped in one analyst's notebook — they're published, discoverable, and reusable. A transform that normalizes a proprietary message type is irreplaceable organizational IP that compounds as the library grows.

## Who This Serves

**Primary: Internal telemetry analysts.** Engineers and analysts who work daily with sensor data, communications logs, and telemetry streams. They understand the data domain deeply but are frustrated by tooling gaps. They typically examine 1K-35K messages per session, working with deeply nested structures across ~200 message types.

These analysts want to self-serve — pick their messages, pick their fields, apply transforms, and visualize results without waiting for a data team to build a custom dashboard.

## Success Criteria

- Analysts can independently explore telemetry data without data engineering support for the majority of routine analysis tasks
- Time from "I have a question" to "I have an answer" measurably decreases for reference analysis tasks
- Python transforms are being shared and reused across the analyst team (growing, discoverable transform library)
- Grid handles 35K mixed-line rows with responsive scrolling and filtering
- Tree-based field selection is rated as easier than the current workflow by analysts

## Scope

**V1 — In Scope:**
- Table view with AG Grid: tree field selector, mixed-line sparse grid, row detail tree, array click-to-expand, filter/sort, Tableau filter integration
- Python scripting engine with shared transforms (accessible from table view)
- Tableau Dashboard Extension packaging, on-prem deployment

**V1 — Out of Scope (Future):**
- Map view (will be integrated when internal map component is provided)
- Real-time streaming / live data refresh
- Alerting or notification capabilities
- Export/sharing of grid views
- Custom dashboard templates

**V1 scope discipline is intentional:** shipping a focused, high-quality table + scripting experience builds credibility and a user base before the harder map view integration. This sequencing de-risks delivery and ensures the foundation is solid.

## Dependencies and Risks

- **Map component dependency** — Map view requires an internal map component from another team (TBD). V1 ships without it; map view is gated on this delivery.
- **Tableau data model** — Tableau's Extensions API delivers data as flat tables. The nested message hierarchy must be encoded/decoded through Tableau's data model. This is a foundational technical assumption to validate early in architecture.
- **Python execution model** — Transforms run in-browser via Pyodide/WASM with TabPy integration. Browser-based execution has constraints: memory limits, no filesystem access, limited library availability. Performance with large datasets (35K rows) needs validation during architecture.
- **AG Grid licensing** — Enterprise features (tree data, row grouping, advanced filtering) require a commercial AG Grid license.
- **Tableau platform evolution** — Tableau is undergoing "Tableau Next" / Salesforce integration. API changes could require adaptation. Extension API release notes should be monitored.

## Vision

If successful, this becomes the standard analytical interface for telemetry data within the organization — the place analysts go first when they need to explore sensor data, communications logs, or any time-series message stream. The shared Python transform library grows into a curated analytical toolkit, encoding institutional knowledge that makes every analyst more effective.

As the map view comes online, it becomes a unified exploration environment: see patterns in the grid, visualize them spatially, transform the data to surface deeper insights — all without leaving Tableau.

Longer term, the extension could generalize beyond telemetry to any domain with deeply nested, multi-type message structures — IoT, network monitoring, financial event streams. If the architecture supports schema-driven onboarding (Protobuf, Avro, JSON Schema), adding a new domain becomes configuration rather than engineering.
