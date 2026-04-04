/**
 * tableauAdapter.ts — Single entry point for ALL Tableau Extensions API calls.
 *
 * ARCHITECTURAL BOUNDARY: No other file in the project may import `tableau.extensions`
 * directly. All Tableau interaction flows through this adapter, which:
 *   - Translates Tableau-native types to our domain types (ColumnInfo, FlatRowData, etc.)
 *   - Catches native Tableau errors and wraps them as typed errors
 *   - Provides a mockable interface for testing (see src/__mocks__/mockTableauAdapter.ts)
 *
 * Methods:
 *   initialize()             — Init the Tableau Extensions API on extension load
 *   getDataSourceSchema()    — Get column names/types from the active worksheet
 *   queryData()              — Fetch all rows from the active worksheet
 *   subscribeToFilterChange() — Listen for dashboard filter change events
 *   saveSettings()           — Persist ExtensionSettings JSON to the workbook
 *   loadSettings()           — Retrieve saved settings on workbook reopen
 */
import { TableauConnectionError, TableauDataError, SettingsPersistError } from '../models/errors'
import type { ColumnInfo, FlatRowData, FilterChangeCallback, Unsubscribe } from '../models/tableauTypes'
import type { ExtensionSettings } from '../models/extensionSettings'
import { logger } from '../utils/logger'

const SETTINGS_KEY = 'telemetry-extension-settings'

/** Get the global tableau object, or undefined if not in Tableau */
function getTableau() {
  return typeof tableau !== 'undefined' ? tableau : undefined
}

/** Get the first worksheet from the active dashboard */
function getWorksheet() {
  const tab = getTableau()
  if (!tab?.extensions?.dashboardContent?.dashboard) {
    throw new TableauConnectionError('Tableau dashboard not available')
  }
  const worksheets = tab.extensions.dashboardContent.dashboard.worksheets
  if (worksheets.length === 0) {
    throw new TableauConnectionError('No worksheets found in dashboard')
  }
  return worksheets[0]
}

export const tableauAdapter = {
  /** Initialize the Tableau Extensions API */
  async initialize(): Promise<void> {
    const tab = getTableau()
    if (!tab) {
      logger.warn('Tableau API not available — running outside Tableau')
      return
    }
    try {
      await tab.extensions.initializeAsync()
      logger.info('Tableau Extensions API initialized')
    } catch (err) {
      throw new TableauConnectionError(
        'Failed to initialize Tableau Extensions API',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Get the data source schema (column names and types) */
  async getDataSourceSchema(): Promise<ColumnInfo[]> {
    try {
      const worksheet = getWorksheet()
      const columns = await worksheet.getSummaryColumnsInfoAsync()
      return columns.map((col: { fieldName: string; dataType: string; isReferenced: boolean }) => ({
        fieldName: col.fieldName,
        dataType: col.dataType,
        role: 'dimension' as const,
      }))
    } catch (err) {
      if (err instanceof TableauConnectionError) throw err
      throw new TableauDataError(
        'Failed to get data source schema',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Query data from the active worksheet */
  async queryData(): Promise<FlatRowData[]> {
    try {
      const worksheet = getWorksheet()
      const dataTable = await worksheet.getSummaryDataAsync()
      const columns = dataTable.columns.map((c: { fieldName: string }) => c.fieldName)
      const rows: FlatRowData[] = []

      for (const row of dataTable.data) {
        const rowData: FlatRowData = {}
        for (let i = 0; i < columns.length; i++) {
          rowData[columns[i]] = row[i].value
        }
        rows.push(rowData)
      }

      logger.debug(`Queried ${rows.length} rows with ${columns.length} columns`)
      return rows
    } catch (err) {
      if (err instanceof TableauConnectionError) throw err
      throw new TableauDataError(
        'Failed to query data',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Subscribe to filter change events on the first worksheet */
  subscribeToFilterChange(callback: FilterChangeCallback): Unsubscribe {
    try {
      const worksheet = getWorksheet()
      const handler = () => {
        worksheet.getFiltersAsync().then((filters: unknown[]) => {
          callback(filters.map((f: unknown) => {
            const filter = f as { fieldName: string; filterType: string; appliedValues?: unknown[] }
            return {
              fieldName: filter.fieldName,
              filterType: filter.filterType as 'categorical' | 'range' | 'relative-date',
              appliedValues: filter.appliedValues ?? [],
            }
          }))
        }).catch((err: unknown) => {
          logger.error('Failed to get filters after change event', err)
        })
      }

      worksheet.addEventListener('filter-changed', handler)
      logger.info('Subscribed to filter change events')

      return () => {
        worksheet.removeEventListener('filter-changed', handler)
        logger.info('Unsubscribed from filter change events')
      }
    } catch (err) {
      logger.error('Failed to subscribe to filter changes', err)
      return () => {} // no-op unsubscribe if subscription failed
    }
  },

  /** Save extension settings to Tableau workbook */
  async saveSettings(settings: ExtensionSettings): Promise<void> {
    const tab = getTableau()
    if (!tab) {
      logger.warn('Cannot save settings — not in Tableau')
      return
    }
    try {
      const serialized = JSON.stringify(settings)
      const sizeKB = new Blob([serialized]).size / 1024
      if (sizeKB > 1800) {
        logger.warn(`Settings size (${sizeKB.toFixed(0)}KB) approaching 2MB Tableau limit`)
      }
      tab.extensions.settings.set(SETTINGS_KEY, serialized)
      await tab.extensions.settings.saveAsync()
      logger.debug(`Settings saved (${sizeKB.toFixed(1)}KB)`)
    } catch (err) {
      throw new SettingsPersistError(
        'Failed to save extension settings',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Load extension settings from Tableau workbook */
  async loadSettings(): Promise<ExtensionSettings | null> {
    const tab = getTableau()
    if (!tab) {
      logger.warn('Cannot load settings — not in Tableau')
      return null
    }
    try {
      const raw = tab.extensions.settings.get(SETTINGS_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as ExtensionSettings
      logger.debug('Settings loaded successfully')
      return parsed
    } catch (err) {
      logger.error('Failed to parse saved settings — returning null', err)
      return null
    }
  },
}
