/** Serializable extension settings persisted via Tableau Settings API.
 *  New fields added in v2 are optional for backward compatibility with v1 settings. */
export interface ExtensionSettings {
  /** Selected field dotted paths (compact — strings only, not full FieldNode objects) */
  selectedFieldPaths: string[]
  /** Column order (array of dotted paths in display order) */
  columnOrder: string[]
  /** Tree panel width in pixels (or null if collapsed) */
  treePanelWidth: number | null
  /** Whether tree panel is collapsed */
  treePanelCollapsed: boolean
  /** Detail panel width in pixels (or null if collapsed) — added v2 */
  detailPanelWidth?: number | null
  /** Whether detail panel is collapsed — added v2 */
  detailPanelCollapsed?: boolean
  /** Currently selected worksheet name — added v2 */
  selectedWorksheet?: string | null
  /** AG Grid sort state — added v2 */
  sortModel?: { colId: string; sort: string }[]
  /** AG Grid filter state — added v2 */
  filterModel?: Record<string, unknown>
  /** Settings schema version (for forward compatibility) */
  version: number
}

/** A named layout preset that can be saved and restored */
export interface LayoutPreset {
  /** Unique identifier */
  id: string
  /** User-assigned name */
  name: string
  /** ISO timestamp of creation */
  createdAt: string
  /** The full settings snapshot */
  settings: ExtensionSettings
}

/** Container for all saved presets (stored as a single Tableau setting key) */
export interface PresetCollection {
  presets: LayoutPreset[]
}
