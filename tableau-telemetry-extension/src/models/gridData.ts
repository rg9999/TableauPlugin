/** A single row in the sparse mixed-line grid */
export interface GridRowData {
  /** Unique row identifier (timestamp + messageType + sequence) */
  rowId: string
  /** Timestamp value (used for time-ordering) */
  timestamp: string
  /** Message type this row belongs to */
  messageType: string
  /** Field values keyed by dotted path — only fields from this message type are populated */
  [dottedPath: string]: unknown
}

/** A sparse row where non-matching message type columns are blank */
export type SparseRow = GridRowData

/** Configuration for a grid column */
export interface ColumnConfig {
  /** Full dotted path (used as AG Grid field) */
  dottedPath: string
  /** Short display name (used as AG Grid headerName) */
  shortName: string
  /** Message type this column belongs to */
  messageType: string
  /** Column position index (order in grid) */
  position: number
}
