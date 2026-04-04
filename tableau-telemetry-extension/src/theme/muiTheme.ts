/**
 * muiTheme.ts — MUI theme configured to match AG Grid's visual language.
 *
 * Consumes shared design tokens so that MUI components (TreeView, menus,
 * tooltips, buttons, checkboxes) visually harmonize with the AG Grid that
 * occupies ~70% of the extension's UI. The Tableau-neutral color palette
 * ensures the extension feels native inside a Tableau dashboard.
 */
import { createTheme } from '@mui/material/styles'
import { COLORS, SEMANTIC, SPACING, TYPOGRAPHY } from './designTokens'

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
  spacing: SPACING.xs,
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: TYPOGRAPHY.tooltip.size,
          fontFamily: TYPOGRAPHY.fontFamily,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        },
      },
    },
  },
})
