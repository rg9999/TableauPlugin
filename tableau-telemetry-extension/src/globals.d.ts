/* eslint-disable @typescript-eslint/no-explicit-any */
/** App version injected by Vite at build time from package.json */
declare const __APP_VERSION__: string
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
