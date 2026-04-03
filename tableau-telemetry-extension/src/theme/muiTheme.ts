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
