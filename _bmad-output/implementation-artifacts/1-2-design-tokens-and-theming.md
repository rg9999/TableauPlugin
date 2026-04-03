# Story 1.2: Design Tokens & Theming

Status: ready-for-dev

## Story

As a developer,
I want shared design tokens consumed by both AG Grid and MUI themes,
so that the extension has a consistent, Tableau-harmonious visual identity.

## Acceptance Criteria

1. Design tokens file exists at `src/theme/designTokens.ts` defining colors, spacing, and typography
2. `src/theme/muiTheme.ts` creates a MUI theme consuming design tokens
3. `src/theme/agGridTheme.ts` configures AG Grid theme consuming design tokens
4. MUI and AG Grid themes produce visually consistent results (matching fonts, colors, spacing)
5. 8-color message-type stripe palette is defined as an exportable array
6. AG Grid Enterprise license key is configured via environment variable
7. App.tsx wraps content in MUI ThemeProvider

## Tasks / Subtasks

- [ ] Task 1: Create design tokens (AC: #1, #5)
  - [ ] Create `src/theme/designTokens.ts`:
    ```typescript
    // Base palette — Tableau-harmonious neutrals
    export const COLORS = {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      border: '#E0E0E0',
      textPrimary: '#333333',
      textSecondary: '#666666',
      textMuted: '#999999',
      accent: '#4E79A7',
      accentHover: '#3B6491',
    } as const

    // Semantic colors
    export const SEMANTIC = {
      newData: '#E8F4E8',
      error: '#D32F2F',
      warning: '#F57C00',
      dropTarget: 'rgba(78, 121, 167, 0.2)',
      dropIndicator: '#4E79A7',
    } as const

    // Message-type color stripes (4px left border)
    // Derived from Tableau's categorical palette
    export const MESSAGE_TYPE_COLORS = [
      '#4E79A7', // blue — Navigation
      '#F28E2B', // orange — Flight Control
      '#E15759', // red — Sensors
      '#76B7B2', // teal — Communications
      '#59A14F', // green — Log
      '#EDC948', // gold — Status
      '#B07AA1', // purple — System
      '#9C755F', // brown — User-defined/other
    ] as const

    // Spacing — 4px base grid
    export const SPACING = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    } as const

    // Typography — system font stack
    export const TYPOGRAPHY = {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      gridCell: { size: 12, weight: 400 },
      columnHeader: { size: 12, weight: 600 },
      treeNode: { size: 13, weight: 400 },
      treeNodeSelected: { size: 13, weight: 600 },
      statusBar: { size: 11, weight: 400 },
      panelHeader: { size: 13, weight: 600 },
      tooltip: { size: 12, weight: 400 },
      emptyState: { size: 14, weight: 400 },
    } as const

    // Layout
    export const LAYOUT = {
      treePanelWidth: 240,
      treePanelCollapsedWidth: 32,
      detailPanelHeight: 180,
      statusBarHeight: 24,
    } as const
    ```

- [ ] Task 2: Create MUI theme (AC: #2, #4)
  - [ ] Create `src/theme/muiTheme.ts`:
    ```typescript
    import { createTheme } from '@mui/material/styles'
    import { COLORS, SPACING, TYPOGRAPHY } from './designTokens'

    export const muiTheme = createTheme({
      palette: {
        primary: { main: COLORS.accent },
        error: { main: SEMANTIC.error },
        warning: { main: SEMANTIC.warning },
        background: {
          default: COLORS.background,
          paper: COLORS.surface,
        },
        text: {
          primary: COLORS.textPrimary,
          secondary: COLORS.textSecondary,
          disabled: COLORS.textMuted,
        },
        divider: COLORS.border,
      },
      typography: {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: 12,
      },
      spacing: SPACING.xs, // base unit = 4px
      components: {
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              fontSize: TYPOGRAPHY.tooltip.size,
              fontFamily: TYPOGRAPHY.fontFamily,
            },
          },
        },
      },
    })
    ```
  - [ ] Verify MUI components render with correct colors and fonts

- [ ] Task 3: Create AG Grid theme (AC: #3, #4, #6)
  - [ ] Create `src/theme/agGridTheme.ts`:
    ```typescript
    import { LicenseManager } from 'ag-grid-enterprise'
    import { COLORS, TYPOGRAPHY, SPACING } from './designTokens'

    // AG Grid Enterprise license
    const licenseKey = import.meta.env.VITE_AG_GRID_LICENSE_KEY
    if (licenseKey) {
      LicenseManager.setLicenseKey(licenseKey)
    }

    // AG Grid theme overrides (applied via CSS custom properties or theme params)
    export const agGridThemeParams = {
      // Use Balham theme as base (data-dense, professional)
      theme: 'ag-theme-balham',
      // Override CSS custom properties
      headerBackgroundColor: COLORS.surface,
      headerForegroundColor: COLORS.textPrimary,
      headerFontFamily: TYPOGRAPHY.fontFamily,
      headerFontSize: `${TYPOGRAPHY.columnHeader.size}px`,
      headerFontWeight: TYPOGRAPHY.columnHeader.weight,
      foregroundColor: COLORS.textPrimary,
      fontFamily: TYPOGRAPHY.fontFamily,
      fontSize: `${TYPOGRAPHY.gridCell.size}px`,
      borderColor: COLORS.border,
      rowHoverColor: 'rgba(78, 121, 167, 0.04)',
      selectedRowBackgroundColor: 'rgba(78, 121, 167, 0.08)',
      cellHorizontalPadding: `${SPACING.sm}px`,
    } as const
    ```
  - [ ] Create `src/theme/agGridStyles.css` for any CSS overrides that can't be done via params:
    ```css
    .ag-theme-balham {
      --ag-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --ag-font-size: 12px;
      --ag-header-font-size: 12px;
      --ag-header-font-weight: 600;
      --ag-border-color: #E0E0E0;
      --ag-header-background-color: #F5F5F5;
      --ag-row-hover-color: rgba(78, 121, 167, 0.04);
      --ag-selected-row-background-color: rgba(78, 121, 167, 0.08);
    }
    ```
  - [ ] Verify AG Grid renders with Tableau-harmonious styling

- [ ] Task 4: Integrate themes in App.tsx (AC: #7)
  - [ ] Update `src/App.tsx`:
    ```typescript
    import { ThemeProvider } from '@mui/material/styles'
    import CssBaseline from '@mui/material/CssBaseline'
    import { muiTheme } from './theme/muiTheme'
    import './theme/agGridStyles.css'
    import 'ag-grid-community/styles/ag-grid.css'
    import 'ag-grid-community/styles/ag-theme-balham.css'

    function App() {
      return (
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <div>Tableau Telemetry Extension</div>
        </ThemeProvider>
      )
    }

    export default App
    ```
  - [ ] Import AG Grid Enterprise module to register enterprise features:
    ```typescript
    import 'ag-grid-enterprise'
    ```
  - [ ] Verify both MUI and AG Grid styles load without conflicts

- [ ] Task 5: Tests (AC: all)
  - [ ] Create `src/theme/designTokens.test.ts`:
    - Verify MESSAGE_TYPE_COLORS has exactly 8 entries
    - Verify all color values are valid hex or rgba strings
    - Verify SPACING values are multiples of 4
  - [ ] Update `src/App.test.tsx` to verify ThemeProvider wraps the app
  - [ ] Run `npm run test:ci` — all tests pass

## Dev Notes

### Architecture Compliance

- **Design tokens are the single source of truth** for all visual values. No hardcoded colors, spacing, or font values anywhere else in the codebase.
- **Two-layer theming:** AG Grid's theme governs the grid (~70% of UI). MUI's theme governs everything else. Both consume the same `designTokens.ts`.
- **AG Grid base theme:** Use Balham (data-dense, professional). Alpine is the alternative if Balham feels too compact.
- **MUI ThemeProvider** must wrap the entire app in `App.tsx`. All MUI components automatically inherit the theme.
- **No custom CSS overrides** except through AG Grid CSS custom properties or MUI's `sx` prop / theme overrides.
- **Naming:** Constants use `UPPER_SNAKE_CASE` for top-level exports. Nested objects use `camelCase` keys.

### Color Palette Rationale

The base palette uses Tableau's signature blue (`#4E79A7`) as the accent color. The message-type stripe colors are from Tableau's categorical palette — they'll look native alongside other Tableau charts in the same dashboard. All text colors maintain high contrast against white/light backgrounds:
- `#333333` on `#FFFFFF` = 12.6:1 (exceeds WCAG AAA)
- `#666666` on `#FFFFFF` = 5.7:1 (exceeds WCAG AA)

### AG Grid License Key

- Set `VITE_AG_GRID_LICENSE_KEY` in `.env.local` for development
- Without a key, AG Grid shows a watermark — acceptable during development
- Production builds inject the key at build time

### Dependencies on Story 1.1

This story assumes Story 1.1 is complete:
- Vite + React + TypeScript project exists and compiles
- All dependencies (AG Grid, MUI, etc.) are installed
- `src/theme/` directory exists
- ESLint + Prettier are configured
- Vitest is configured

### Files Created/Modified

**Created:**
- `src/theme/designTokens.ts`
- `src/theme/muiTheme.ts`
- `src/theme/agGridTheme.ts`
- `src/theme/agGridStyles.css`
- `src/theme/designTokens.test.ts`

**Modified:**
- `src/App.tsx` — add ThemeProvider, CssBaseline, AG Grid CSS imports
- `src/App.test.tsx` — add theme verification

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation — Color System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions — Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
