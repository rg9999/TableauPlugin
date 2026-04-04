/**
 * extensionSettings.ts — Shape of the state persisted to Tableau workbooks.
 *
 * When an analyst saves a Tableau workbook, useSettingsPersistence serializes
 * this object as JSON and stores it via tableauAdapter.saveSettings().
 * On reopen, loadSettings() deserializes it and restores field selections.
 *
 * Size constraint: Tableau Settings API has a ~2MB payload limit.
 * We store field paths as strings (not full FieldNode objects) for compactness.
 * The "version" field enables forward-compatible schema migrations.
 */

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
