/** Serializable extension settings persisted via Tableau Settings API */
export interface ExtensionSettings {
  /** Selected field dotted paths (compact — strings only, not full FieldNode objects) */
  selectedFieldPaths: string[]
  /** Column order (array of dotted paths in display order) */
  columnOrder: string[]
  /** Tree panel width in pixels (or null if collapsed) */
  treePanelWidth: number | null
  /** Whether tree panel is collapsed */
  treePanelCollapsed: boolean
  /** Settings schema version (for forward compatibility) */
  version: number
}
