# Story 6.3: Tableau Server Deployment & Version Updates

Status: done

## Story

As an IT team member, I want to deploy the extension to Tableau Server and update it without disrupting existing dashboards, so that analysts get new features without losing their configurations.

## Tasks / Subtasks

- [x] Task 1: Create deployment guide
  - [x] 1.1: docs/deployment-guide.md with build, deploy, allowlist, update instructions
  - [x] 1.2: Air-gapped deployment notes
  - [x] 1.3: Troubleshooting table
- [x] Task 2: Update manifest.trex for production
  - [x] 2.1: Bumped version to 1.0.0
  - [x] 2.2: Added permissions section (full data)
  - [x] 2.3: Added resources section with localized name
  - [x] 2.4: Added comments for dev vs production URL

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- docs/deployment-guide.md (created)
- public/manifest.trex (modified — v1.0.0, permissions, resources)
