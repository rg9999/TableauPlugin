import { LicenseManager } from 'ag-grid-enterprise'
import { COLORS, TYPOGRAPHY, SPACING } from './designTokens'

// AG Grid Enterprise license
const licenseKey = import.meta.env.VITE_AG_GRID_LICENSE_KEY as string | undefined
if (licenseKey?.trim()) {
  try {
    LicenseManager.setLicenseKey(licenseKey.trim())
  } catch (e) {
    console.error('AG Grid license key error:', e)
  }
}

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
