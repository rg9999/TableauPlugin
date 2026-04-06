/* eslint-disable @typescript-eslint/no-explicit-any */
/** App version injected by Vite at build time from package.json */
declare const __APP_VERSION__: string

// MUI icons-material module declarations (types package not installed)
declare module '@mui/icons-material/Close'
declare module '@mui/icons-material/ExpandMore'
declare module '@mui/icons-material/Search'
declare module '@mui/icons-material/Clear'
declare module '@mui/icons-material/ChevronRight'
declare module '@mui/icons-material/ArrowBack'
/** Global Tableau Extensions API object — available when running inside Tableau */
declare const tableau: {
  extensions: {
    initializeAsync: () => Promise<void>
    dashboardContent: {
      dashboard: {
        name: string
        worksheets: Array<{
          name: string
          getSummaryColumnsInfoAsync: () => Promise<any[]>
          getSummaryDataAsync: () => Promise<{
            columns: Array<{ fieldName: string }>
            data: Array<Array<{ value: unknown }>>
          }>
          getUnderlyingTablesAsync: () => Promise<Array<{ id: string; caption: string }>>
          getUnderlyingTableDataAsync: (tableId: string, options?: { maxRows?: number }) => Promise<{
            columns: Array<{ fieldName: string; dataType: string }>
            data: Array<Array<{ value: unknown }>>
            totalRowCount: number
          }>
          getDataSourcesAsync: () => Promise<Array<{
            name: string
            id: string
            fields: Array<{ name: string; dataType: string; role: string; isGenerated: boolean }>
            getActiveTablesAsync: () => Promise<Array<{ id: string; caption: string }>>
            getLogicalTableDataAsync: (tableId: string, options?: { maxRows?: number }) => Promise<{
              columns: Array<{ fieldName: string; dataType: string }>
              data: Array<Array<{ value: unknown }>>
              totalRowCount: number
            }>
          }>>
          getUnderlyingDataAsync: (options?: { includeAllColumns?: boolean; maxRows?: number }) => Promise<{
            columns: Array<{ fieldName: string; dataType: string }>
            data: Array<Array<{ value: unknown }>>
            totalRowCount: number
          }>
          getFiltersAsync: () => Promise<any[]>
          addEventListener: (event: string, handler: () => void) => void
          removeEventListener: (event: string, handler: () => void) => void
        }>
      }
    }
    settings: {
      get: (key: string) => string
      set: (key: string, value: string) => void
      saveAsync: () => Promise<void>
    }
  }
} | undefined
