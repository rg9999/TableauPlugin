/**
 * agGridTheme.ts — AG Grid Community theme configuration.
 *
 * Uses Balham as the base theme (data-dense, professional) and overrides
 * colors, fonts, and spacing to match the shared design tokens.
 * AG_GRID_THEME is the CSS class name applied to the grid wrapper.
 * agGridThemeParams are CSS custom properties for fine-tuning.
 */
import { COLORS, TYPOGRAPHY, SPACING } from './designTokens'

// AG Grid theme configuration params
// Use Balham theme as base (data-dense, professional)
export const AG_GRID_THEME = 'ag-theme-balham' as const

export const agGridThemeParams = {
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
