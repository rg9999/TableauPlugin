/* eslint-disable @typescript-eslint/no-explicit-any */
/** Global Tableau Extensions API object — available when running inside Tableau */
declare const tableau: {
  extensions: {
    initializeAsync: () => Promise<void>
    dashboardContent: {
      dashboard: {
        worksheets: Array<{
          getSummaryColumnsInfoAsync: () => Promise<any[]>
          getSummaryDataAsync: () => Promise<{
            columns: Array<{ fieldName: string }>
            data: Array<Array<{ value: unknown }>>
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
