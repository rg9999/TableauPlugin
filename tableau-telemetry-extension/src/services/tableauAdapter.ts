import { TableauConnectionError, TableauDataError, SettingsPersistError } from '../models/errors'
import type { ColumnInfo, FlatRowData, FilterChangeCallback, Unsubscribe } from '../models/tableauTypes'
import type { ExtensionSettings, LayoutPreset, PresetCollection } from '../models/extensionSettings'
import { logger } from '../utils/logger'

const SETTINGS_KEY = 'telemetry-extension-settings'
const PRESETS_KEY = 'telemetry-extension-presets'

/**
 * Normalize a Tableau column name by stripping aggregation/calculation wrappers.
 * Tableau often wraps field names like: AGG(field), ATTR(field), SUM(field),
 * MIN(field), MAX(field), CNT(field), CNTD(field), etc.
 * Also strips surrounding brackets: [field] → field
 */
function normalizeColumnName(raw: string): string {
  let name = raw.trim()
  // Strip aggregation wrapper: AGG(...), ATTR(...), SUM(...), etc.
  const aggMatch = name.match(/^(?:AGG|ATTR|SUM|MIN|MAX|AVG|CNT|CNTD|MEDIAN|STDEV|STDEVP|VAR|VARP|COLLECT|COUNTD)\((.+)\)$/i)
  if (aggMatch) {
    name = aggMatch[1]
  }
  // Strip surrounding brackets: [field name] → field name
  if (name.startsWith('[') && name.endsWith(']')) {
    name = name.slice(1, -1)
  }
  return name
}

/**
 * Convert a Tableau DataTable into FlatRowData[] with normalized column names.
 * Logs the raw→normalized mapping on first call for debugging.
 */
function dataTableToRows(
  dataTable: { columns: { fieldName: string }[]; data: { value: unknown }[][] },
  strategyLabel: string,
): FlatRowData[] {
  const rawColumns = dataTable.columns.map((c) => c.fieldName)
  const normalizedColumns = rawColumns.map(normalizeColumnName)

  // Log raw vs normalized for debugging (only first 15)
  const hasRenames = rawColumns.some((raw, i) => raw !== normalizedColumns[i])
  if (hasRenames) {
    logger.info(`[tableauAdapter] ${strategyLabel} column name normalization:`)
    rawColumns.forEach((raw, i) => {
      if (raw !== normalizedColumns[i]) {
        logger.info(`[tableauAdapter]   "${raw}" → "${normalizedColumns[i]}"`)
      }
    })
  }

  logger.info(`[tableauAdapter] ${strategyLabel} returned ${dataTable.data.length} rows, ${normalizedColumns.length} columns: ${normalizedColumns.slice(0, 15).join(', ')}${normalizedColumns.length > 15 ? '...' : ''}`)

  const rows: FlatRowData[] = []
  for (const row of dataTable.data) {
    const rowData: FlatRowData = {}
    for (let i = 0; i < normalizedColumns.length; i++) {
      rowData[normalizedColumns[i]] = row[i].value
    }
    rows.push(rowData)
  }
  return rows
}

/** Get the global tableau object, or undefined if not in Tableau */
function getTableau() {
  return typeof tableau !== 'undefined' ? tableau : undefined
}

/** Get the dashboard object, or throw if not available */
function getDashboard() {
  const tab = getTableau()
  if (!tab?.extensions?.dashboardContent?.dashboard) {
    throw new TableauConnectionError('Tableau dashboard not available')
  }
  return tab.extensions.dashboardContent.dashboard
}

/** Get a worksheet by name from the active dashboard */
function getWorksheetByName(name: string) {
  const dashboard = getDashboard()
  const worksheet = dashboard.worksheets.find((ws) => ws.name === name)
  if (!worksheet) {
    throw new TableauConnectionError(`Worksheet "${name}" not found on dashboard. Available: ${dashboard.worksheets.map((ws) => ws.name).join(', ')}`)
  }
  return worksheet
}

export const tableauAdapter = {
  /** Initialize the Tableau Extensions API */
  async initialize(): Promise<void> {
    const tab = getTableau()
    if (!tab) {
      logger.warn('[tableauAdapter] Tableau API not available — running outside Tableau. typeof tableau =', typeof tableau)
      return
    }
    try {
      logger.info('[tableauAdapter] Calling initializeAsync()...')
      await tab.extensions.initializeAsync()
      logger.info('[tableauAdapter] Tableau Extensions API initialized successfully')

      // Log diagnostic info about the dashboard
      const dashboard = tab.extensions.dashboardContent?.dashboard
      if (dashboard) {
        logger.info(`[tableauAdapter] Dashboard name: "${dashboard.name}"`)
        logger.info(`[tableauAdapter] Worksheets on dashboard: ${dashboard.worksheets.length}`)
        dashboard.worksheets.forEach((ws: { name: string }, i: number) => {
          logger.info(`[tableauAdapter]   worksheet[${i}]: "${ws.name}"`)
        })
      } else {
        logger.warn('[tableauAdapter] No dashboard content available after init')
      }
    } catch (err) {
      logger.error('[tableauAdapter] initializeAsync() failed:', err)
      throw new TableauConnectionError(
        'Failed to initialize Tableau Extensions API',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Get all worksheet names available on the dashboard */
  getAvailableWorksheets(): { name: string; index: number }[] {
    try {
      const dashboard = getDashboard()
      const worksheets = dashboard.worksheets.map((ws, i) => ({
        name: ws.name,
        index: i,
      }))
      logger.info(`[tableauAdapter] Found ${worksheets.length} worksheets: ${worksheets.map((w) => w.name).join(', ')}`)
      return worksheets
    } catch (err) {
      logger.error('[tableauAdapter] getAvailableWorksheets() error:', err)
      return []
    }
  },

  /** Get the primary data source for a worksheet */
  async _getDataSource(worksheetName: string) {
    const worksheet = getWorksheetByName(worksheetName)
    const dataSources = await worksheet.getDataSourcesAsync()
    logger.info(`[tableauAdapter] Data sources for "${worksheetName}": ${dataSources.map((ds: { name: string; id: string }) => `"${ds.name}" (${ds.id})`).join(', ')}`)
    if (dataSources.length === 0) {
      throw new TableauDataError(`No data sources found for worksheet "${worksheetName}"`)
    }
    return dataSources[0]
  },

  /** Get the data source schema (ALL column names and types) for a specific worksheet.
   *  Uses dataSource.fields to get ALL columns, regardless of shelf placement. */
  async getDataSourceSchema(worksheetName: string): Promise<ColumnInfo[]> {
    try {
      logger.info(`[tableauAdapter] getDataSourceSchema("${worksheetName}") — using dataSource.fields`)
      const dataSource = await this._getDataSource(worksheetName)

      const fields = dataSource.fields
      logger.info(`[tableauAdapter] dataSource.fields returned ${fields.length} fields`)

      const mapped: ColumnInfo[] = []
      for (const field of fields) {
        const f = field as { name: string; dataType: string; role: string; isGenerated: boolean }
        // Skip Tableau-generated fields (e.g. "Number of Records", "Measure Names")
        if (f.isGenerated) {
          logger.debug(`[tableauAdapter]   SKIP generated: "${f.name}" (${f.dataType})`)
          continue
        }
        logger.debug(`[tableauAdapter]   field: "${f.name}" (${f.dataType}, ${f.role})`)
        mapped.push({
          fieldName: f.name,
          dataType: f.dataType,
          role: 'dimension' as const,
        })
      }

      logger.info(`[tableauAdapter] Returning ${mapped.length} non-generated fields`)
      return mapped
    } catch (err) {
      logger.error('[tableauAdapter] getDataSourceSchema() error:', err)
      if (err instanceof TableauConnectionError) throw err
      throw new TableauDataError(
        'Failed to get data source schema',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Query data from a specific worksheet.
   *  Uses multiple strategies to get ALL columns, not just those on shelves.
   *  All strategies normalize column names (strip AGG/ATTR/SUM wrappers and brackets)
   *  so they match the bare field names from dataSource.fields.
   *  Priority: underlying table (all cols) → underlying data (includeAllColumns) → summary (shelf only). */
  async queryData(worksheetName: string): Promise<FlatRowData[]> {
    try {
      const worksheet = getWorksheetByName(worksheetName)

      // Strategy 1: worksheet.getUnderlyingTableDataAsync — returns ALL columns
      // from the underlying logical table, regardless of what's on shelves.
      try {
        logger.info(`[tableauAdapter] queryData("${worksheetName}") — Strategy 1: worksheet.getUnderlyingTableDataAsync`)
        const tables = await worksheet.getUnderlyingTablesAsync()
        logger.info(`[tableauAdapter] Underlying tables: ${tables.map((t: { id: string; caption: string }) => `"${t.caption}" (${t.id})`).join(', ')}`)

        if (tables.length > 0) {
          const table = tables[0]
          logger.info(`[tableauAdapter] Querying underlying table "${table.caption}" (${table.id})`)
          const dataTable = await worksheet.getUnderlyingTableDataAsync(table.id, { maxRows: 10000 })
          const rows = dataTableToRows(dataTable, 'Strategy 1 (underlyingTable)')
          if (dataTable.columns.length > 2) {
            logger.info(`[tableauAdapter] Strategy 1 SUCCESS: ${rows.length} rows with ${dataTable.columns.length} columns`)
            return rows
          }
          logger.warn(`[tableauAdapter] Strategy 1 returned only ${dataTable.columns.length} column(s), trying next`)
        }
      } catch (err1) {
        logger.warn('[tableauAdapter] Strategy 1 (getUnderlyingTableDataAsync) failed:', err1)
      }

      // Strategy 2: getUnderlyingDataAsync with includeAllColumns
      try {
        logger.info(`[tableauAdapter] Strategy 2: worksheet.getUnderlyingDataAsync(includeAllColumns)`)
        const dataTable = await worksheet.getUnderlyingDataAsync({ includeAllColumns: true })
        const rows = dataTableToRows(dataTable, 'Strategy 2 (underlyingData+allCols)')
        if (dataTable.columns.length > 2) {
          return rows
        }
        logger.warn(`[tableauAdapter] Strategy 2 returned only ${dataTable.columns.length} column(s), trying next`)
      } catch (err2) {
        logger.warn('[tableauAdapter] Strategy 2 failed:', err2)
      }

      // Strategy 3: getSummaryDataAsync (fallback — only columns on shelves)
      logger.info('[tableauAdapter] Strategy 3 (fallback): getSummaryDataAsync')
      const dataTable = await worksheet.getSummaryDataAsync()
      const rows = dataTableToRows(dataTable, 'Strategy 3 (summary)')
      return rows
    } catch (err) {
      if (err instanceof TableauConnectionError) throw err
      throw new TableauDataError(
        'Failed to query data',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Subscribe to filter change events on a specific worksheet */
  subscribeToFilterChange(worksheetName: string, callback: FilterChangeCallback): Unsubscribe {
    try {
      const worksheet = getWorksheetByName(worksheetName)
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
      logger.info(`Subscribed to filter change events on "${worksheetName}"`)

      return () => {
        worksheet.removeEventListener('filter-changed', handler)
        logger.info(`Unsubscribed from filter change events on "${worksheetName}"`)
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

  /** Save layout presets to Tableau workbook */
  async savePresets(presets: LayoutPreset[]): Promise<void> {
    const tab = getTableau()
    if (!tab) {
      logger.warn('Cannot save presets — not in Tableau')
      return
    }
    try {
      const collection: PresetCollection = { presets }
      const serialized = JSON.stringify(collection)
      const sizeKB = new Blob([serialized]).size / 1024
      if (sizeKB > 1800) {
        logger.warn(`Presets size (${sizeKB.toFixed(0)}KB) approaching 2MB Tableau limit`)
      }
      tab.extensions.settings.set(PRESETS_KEY, serialized)
      await tab.extensions.settings.saveAsync()
      logger.debug(`Presets saved (${sizeKB.toFixed(1)}KB, ${presets.length} presets)`)
    } catch (err) {
      throw new SettingsPersistError(
        'Failed to save layout presets',
        { cause: err instanceof Error ? err : undefined },
      )
    }
  },

  /** Load layout presets from Tableau workbook */
  async loadPresets(): Promise<LayoutPreset[]> {
    const tab = getTableau()
    if (!tab) {
      logger.warn('Cannot load presets — not in Tableau')
      return []
    }
    try {
      const raw = tab.extensions.settings.get(PRESETS_KEY)
      if (!raw) return []
      const collection = JSON.parse(raw) as PresetCollection
      logger.debug(`Presets loaded: ${collection.presets.length} presets`)
      return collection.presets ?? []
    } catch (err) {
      logger.error('Failed to parse saved presets — returning empty', err)
      return []
    }
  },
}
