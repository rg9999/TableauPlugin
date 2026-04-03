/** Flat row data as received from Tableau Extensions API */
export interface FlatRowData {
  [columnName: string]: unknown
}

/** Column info from Tableau data source schema */
export interface ColumnInfo {
  /** Column name (dotted path in our case) */
  fieldName: string
  /** Data type as reported by Tableau */
  dataType: string
  /** Whether this column is a measure or dimension */
  role: 'measure' | 'dimension'
}

/** Tableau filter representation */
export interface TableauFilter {
  /** Filter field name */
  fieldName: string
  /** Filter type */
  filterType: 'categorical' | 'range' | 'relative-date'
  /** Applied values (for categorical) or range bounds */
  appliedValues: unknown[]
}

/** Callback for Tableau filter change events */
export type FilterChangeCallback = (filters: TableauFilter[]) => void

/** Unsubscribe function returned by event subscriptions */
export type Unsubscribe = () => void
