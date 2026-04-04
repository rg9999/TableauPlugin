# Story 6.2: Air-Gapped Build Configuration

Status: done

## Story

As an IT team member, I want the extension to build as a fully self-contained package with zero external dependencies, so that I can deploy it to our air-gapped Tableau Server.

## Tasks / Subtasks

- [x] Task 1: Configure Vite for air-gapped output
  - [x] 1.1: Set `base: './'` for relative paths
  - [x] 1.2: Disable code splitting (single JS bundle)
  - [x] 1.3: Exclude production source maps
  - [x] 1.4: Inline small assets
- [x] Task 2: Fix TypeScript strict build errors
  - [x] 2.1: Fix DropZoneOverlay COLORS.dropTarget → inline rgba
  - [x] 2.2: Fix GridArea getRowStyle undefined backgroundColor type
  - [x] 2.3: Fix useSettingsPersistence null assertion for fieldHierarchy
- [x] Task 3: Verify build output
  - [x] 3.1: dist/ contains index.html, manifest.trex, assets/*.js, assets/*.css
  - [x] 3.2: Single JS bundle: 1.1MB (326KB gzip)
  - [x] 3.3: No external fetch/XHR/import calls in bundle
  - [x] 3.4: AG Grid Community — no license key references

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- vite.config.ts (modified — air-gapped build config)
- src/components/GridArea/DropZoneOverlay.tsx (fixed — TS strict)
- src/components/GridArea/GridArea.tsx (fixed — TS strict)
- src/hooks/useSettingsPersistence.ts (fixed — TS strict)
