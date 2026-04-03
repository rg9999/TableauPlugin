import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { tableauAdapter } from './tableauAdapter'
import { TableauConnectionError, TableauDataError, SettingsPersistError } from '../models/errors'

// Mock the global tableau object
function createMockTableau() {
  const mockSettings = new Map<string, string>()
  return {
    extensions: {
      initializeAsync: vi.fn().mockResolvedValue(undefined),
      dashboardContent: {
        dashboard: {
          worksheets: [
            {
              getSummaryColumnsInfoAsync: vi.fn().mockResolvedValue([
                { fieldName: 'navigation.gps.latitude', dataType: 'float', isReferenced: true },
                { fieldName: 'navigation.gps.longitude', dataType: 'float', isReferenced: true },
                { fieldName: 'timestamp', dataType: 'string', isReferenced: true },
              ]),
              getSummaryDataAsync: vi.fn().mockResolvedValue({
                columns: [
                  { fieldName: 'timestamp' },
                  { fieldName: 'navigation.gps.latitude' },
                  { fieldName: 'navigation.gps.longitude' },
                ],
                data: [
                  [{ value: '2026-04-03T14:32:01.234' }, { value: 32.7157 }, { value: -117.1611 }],
                  [{ value: '2026-04-03T14:32:01.334' }, { value: 32.7158 }, { value: -117.1612 }],
                ],
              }),
              getFiltersAsync: vi.fn().mockResolvedValue([]),
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
            },
          ],
        },
      },
      settings: {
        get: vi.fn((key: string) => mockSettings.get(key) ?? ''),
        set: vi.fn((key: string, value: string) => mockSettings.set(key, value)),
        saveAsync: vi.fn().mockResolvedValue(undefined),
      },
    },
  }
}

describe('tableauAdapter', () => {
  let mockTableau: ReturnType<typeof createMockTableau>

  beforeEach(() => {
    mockTableau = createMockTableau()
    ;(globalThis as Record<string, unknown>).tableau = mockTableau
  })

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).tableau
  })

  describe('initialize', () => {
    it('calls initializeAsync successfully', async () => {
      await tableauAdapter.initialize()
      expect(mockTableau.extensions.initializeAsync).toHaveBeenCalled()
    })

    it('does not throw when tableau is not available', async () => {
      delete (globalThis as Record<string, unknown>).tableau
      await expect(tableauAdapter.initialize()).resolves.toBeUndefined()
    })

    it('throws TableauConnectionError on init failure', async () => {
      mockTableau.extensions.initializeAsync.mockRejectedValue(new Error('init failed'))
      await expect(tableauAdapter.initialize()).rejects.toThrow(TableauConnectionError)
    })
  })

  describe('getDataSourceSchema', () => {
    it('returns column info from worksheet', async () => {
      const schema = await tableauAdapter.getDataSourceSchema()
      expect(schema).toHaveLength(3)
      expect(schema[0].fieldName).toBe('navigation.gps.latitude')
      expect(schema[0].dataType).toBe('float')
    })

    it('throws TableauDataError on failure', async () => {
      const ws = mockTableau.extensions.dashboardContent.dashboard.worksheets[0]
      ws.getSummaryColumnsInfoAsync.mockRejectedValue(new Error('schema fail'))
      await expect(tableauAdapter.getDataSourceSchema()).rejects.toThrow(TableauDataError)
    })

    it('throws TableauConnectionError when no worksheets', async () => {
      mockTableau.extensions.dashboardContent.dashboard.worksheets = []
      await expect(tableauAdapter.getDataSourceSchema()).rejects.toThrow(TableauConnectionError)
    })
  })

  describe('queryData', () => {
    it('returns flat row data from worksheet', async () => {
      const rows = await tableauAdapter.queryData()
      expect(rows).toHaveLength(2)
      expect(rows[0]['timestamp']).toBe('2026-04-03T14:32:01.234')
      expect(rows[0]['navigation.gps.latitude']).toBe(32.7157)
      expect(rows[1]['navigation.gps.longitude']).toBe(-117.1612)
    })

    it('throws TableauDataError on failure', async () => {
      const ws = mockTableau.extensions.dashboardContent.dashboard.worksheets[0]
      ws.getSummaryDataAsync.mockRejectedValue(new Error('query fail'))
      await expect(tableauAdapter.queryData()).rejects.toThrow(TableauDataError)
    })
  })

  describe('subscribeToFilterChange', () => {
    it('returns an unsubscribe function', () => {
      const unsubscribe = tableauAdapter.subscribeToFilterChange(() => {})
      expect(typeof unsubscribe).toBe('function')
      const ws = mockTableau.extensions.dashboardContent.dashboard.worksheets[0]
      expect(ws.addEventListener).toHaveBeenCalledWith('filter-changed', expect.any(Function))
    })

    it('unsubscribe removes event listener', () => {
      const unsubscribe = tableauAdapter.subscribeToFilterChange(() => {})
      unsubscribe()
      const ws = mockTableau.extensions.dashboardContent.dashboard.worksheets[0]
      expect(ws.removeEventListener).toHaveBeenCalledWith('filter-changed', expect.any(Function))
    })

    it('returns no-op unsubscribe when no worksheets', () => {
      mockTableau.extensions.dashboardContent.dashboard.worksheets = []
      const unsubscribe = tableauAdapter.subscribeToFilterChange(() => {})
      expect(typeof unsubscribe).toBe('function')
      unsubscribe() // should not throw
    })
  })

  describe('saveSettings', () => {
    it('serializes and saves settings', async () => {
      const settings = {
        selectedFieldPaths: ['nav.gps.lat', 'nav.gps.lon'],
        columnOrder: ['nav.gps.lat', 'nav.gps.lon'],
        treePanelWidth: 240,
        treePanelCollapsed: false,
        version: 1,
      }
      await tableauAdapter.saveSettings(settings)
      expect(mockTableau.extensions.settings.set).toHaveBeenCalledWith(
        'telemetry-extension-settings',
        JSON.stringify(settings),
      )
      expect(mockTableau.extensions.settings.saveAsync).toHaveBeenCalled()
    })

    it('does not throw when not in Tableau', async () => {
      delete (globalThis as Record<string, unknown>).tableau
      await expect(tableauAdapter.saveSettings({
        selectedFieldPaths: [], columnOrder: [],
        treePanelWidth: 240, treePanelCollapsed: false, version: 1,
      })).resolves.toBeUndefined()
    })

    it('throws SettingsPersistError on save failure', async () => {
      mockTableau.extensions.settings.saveAsync.mockRejectedValue(new Error('save fail'))
      await expect(tableauAdapter.saveSettings({
        selectedFieldPaths: [], columnOrder: [],
        treePanelWidth: 240, treePanelCollapsed: false, version: 1,
      })).rejects.toThrow(SettingsPersistError)
    })
  })

  describe('loadSettings', () => {
    it('loads and parses saved settings', async () => {
      const settings = {
        selectedFieldPaths: ['nav.gps.lat'],
        columnOrder: ['nav.gps.lat'],
        treePanelWidth: 200,
        treePanelCollapsed: false,
        version: 1,
      }
      mockTableau.extensions.settings.get.mockReturnValue(JSON.stringify(settings))
      const loaded = await tableauAdapter.loadSettings()
      expect(loaded).toEqual(settings)
    })

    it('returns null when no settings saved', async () => {
      mockTableau.extensions.settings.get.mockReturnValue('')
      const loaded = await tableauAdapter.loadSettings()
      expect(loaded).toBeNull()
    })

    it('returns null when not in Tableau', async () => {
      delete (globalThis as Record<string, unknown>).tableau
      const loaded = await tableauAdapter.loadSettings()
      expect(loaded).toBeNull()
    })

    it('returns null on corrupted settings (graceful degradation)', async () => {
      mockTableau.extensions.settings.get.mockReturnValue('{invalid json')
      const loaded = await tableauAdapter.loadSettings()
      expect(loaded).toBeNull()
    })
  })
})
