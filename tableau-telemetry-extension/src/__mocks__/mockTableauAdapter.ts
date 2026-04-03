import type { ColumnInfo, FlatRowData, FilterChangeCallback, Unsubscribe } from '../models/tableauTypes'
import type { ExtensionSettings } from '../models/extensionSettings'
import { TableauConnectionError, TableauDataError, SettingsPersistError } from '../models/errors'
import { MOCK_SCHEMA, MOCK_ROWS_100 } from './mockData'

interface MockConfig {
  /** Data to return from queryData — defaults to MOCK_ROWS_100 */
  queryDataResult: FlatRowData[]
  /** Whether to simulate connection errors */
  simulateConnectionError: boolean
  /** Whether to simulate data errors */
  simulateDataError: boolean
  /** Whether to simulate settings persist errors */
  simulateSettingsError: boolean
}

const defaultConfig: MockConfig = {
  queryDataResult: MOCK_ROWS_100,
  simulateConnectionError: false,
  simulateDataError: false,
  simulateSettingsError: false,
}

let config: MockConfig = { ...defaultConfig }
let settingsStore: Record<string, ExtensionSettings> = {}
let filterCallbacks: FilterChangeCallback[] = []

/** Configure mock behavior for tests */
export function configureMock(overrides: Partial<MockConfig>) {
  config = { ...config, ...overrides }
}

/** Reset mock to default state */
export function resetMock() {
  config = { ...defaultConfig }
  settingsStore = {}
  filterCallbacks = []
}

/** Programmatically trigger a filter change event in tests */
export function triggerFilterChange(filters: Parameters<FilterChangeCallback>[0]) {
  filterCallbacks.forEach((cb) => cb(filters))
}

/** Get current filter subscribers count (for test assertions) */
export function getFilterSubscriberCount(): number {
  return filterCallbacks.length
}

export const mockTableauAdapter = {
  async initialize(): Promise<void> {
    if (config.simulateConnectionError) {
      throw new TableauConnectionError('Mock: simulated connection error')
    }
  },

  async getDataSourceSchema(): Promise<ColumnInfo[]> {
    if (config.simulateConnectionError) {
      throw new TableauConnectionError('Mock: simulated connection error')
    }
    if (config.simulateDataError) {
      throw new TableauDataError('Mock: simulated data error')
    }
    return MOCK_SCHEMA
  },

  async queryData(): Promise<FlatRowData[]> {
    if (config.simulateConnectionError) {
      throw new TableauConnectionError('Mock: simulated connection error')
    }
    if (config.simulateDataError) {
      throw new TableauDataError('Mock: simulated data error')
    }
    return config.queryDataResult
  },

  subscribeToFilterChange(callback: FilterChangeCallback): Unsubscribe {
    if (config.simulateConnectionError) {
      return () => {}
    }
    filterCallbacks.push(callback)
    return () => {
      filterCallbacks = filterCallbacks.filter((cb) => cb !== callback)
    }
  },

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    if (config.simulateSettingsError) {
      throw new SettingsPersistError('Mock: simulated settings error')
    }
    settingsStore['default'] = settings
  },

  async loadSettings(): Promise<ExtensionSettings | null> {
    if (config.simulateSettingsError) {
      throw new SettingsPersistError('Mock: simulated settings error')
    }
    return settingsStore['default'] ?? null
  },
}
