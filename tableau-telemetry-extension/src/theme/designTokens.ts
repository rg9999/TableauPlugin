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
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  detailPanelWidth: 300,
  statusBarHeight: 24,
} as const
