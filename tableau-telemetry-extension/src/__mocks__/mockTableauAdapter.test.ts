import { describe, it, expect, beforeEach } from 'vitest'
import {
  mockTableauAdapter,
  configureMock,
  resetMock,
  triggerFilterChange,
  getFilterSubscriberCount,
} from './mockTableauAdapter'
import { MOCK_SCHEMA, MOCK_ROWS_100 } from './mockData'
import { TableauConnectionError, TableauDataError, SettingsPersistError } from '../models/errors'

describe('mockTableauAdapter', () => {
  beforeEach(() => {
    resetMock()
  })

  describe('initialize', () => {
    it('succeeds by default', async () => {
      await expect(mockTableauAdapter.initialize()).resolves.toBeUndefined()
    })

    it('throws when connection error simulated', async () => {
      configureMock({ simulateConnectionError: true })
      await expect(mockTableauAdapter.initialize()).rejects.toThrow(TableauConnectionError)
    })
  })

  describe('getDataSourceSchema', () => {
    it('returns MOCK_SCHEMA', async () => {
      const schema = await mockTableauAdapter.getDataSourceSchema()
      expect(schema).toBe(MOCK_SCHEMA)
    })

    it('throws on simulated data error', async () => {
      configureMock({ simulateDataError: true })
      await expect(mockTableauAdapter.getDataSourceSchema()).rejects.toThrow(TableauDataError)
    })
  })

  describe('queryData', () => {
    it('returns MOCK_ROWS_100 by default', async () => {
      const rows = await mockTableauAdapter.queryData()
      expect(rows).toBe(MOCK_ROWS_100)
    })

    it('returns custom data when configured', async () => {
      const customData = [{ timestamp: 'test', messageType: 'test' }]
      configureMock({ queryDataResult: customData })
      const rows = await mockTableauAdapter.queryData()
      expect(rows).toBe(customData)
    })

    it('throws on simulated data error', async () => {
      configureMock({ simulateDataError: true })
      await expect(mockTableauAdapter.queryData()).rejects.toThrow(TableauDataError)
    })
  })

  describe('subscribeToFilterChange', () => {
    it('returns unsubscribe function', () => {
      const unsub = mockTableauAdapter.subscribeToFilterChange(() => {})
      expect(typeof unsub).toBe('function')
      expect(getFilterSubscriberCount()).toBe(1)
    })

    it('unsubscribe removes callback', () => {
      const unsub = mockTableauAdapter.subscribeToFilterChange(() => {})
      expect(getFilterSubscriberCount()).toBe(1)
      unsub()
      expect(getFilterSubscriberCount()).toBe(0)
    })

    it('triggerFilterChange calls all subscribers', () => {
      const received: unknown[] = []
      mockTableauAdapter.subscribeToFilterChange((filters) => received.push(filters))
      triggerFilterChange([{ fieldName: 'test', filterType: 'categorical', appliedValues: [] }])
      expect(received).toHaveLength(1)
    })

    it('returns no-op unsubscribe when connection error simulated', () => {
      configureMock({ simulateConnectionError: true })
      const unsub = mockTableauAdapter.subscribeToFilterChange(() => {})
      expect(getFilterSubscriberCount()).toBe(0)
      unsub() // should not throw
    })
  })

  describe('saveSettings / loadSettings', () => {
    it('saves and loads settings via in-memory store', async () => {
      const settings = {
        selectedFieldPaths: ['nav.gps.lat'],
        columnOrder: ['nav.gps.lat'],
        treePanelWidth: 240,
        treePanelCollapsed: false,
        version: 1,
      }
      await mockTableauAdapter.saveSettings(settings)
      const loaded = await mockTableauAdapter.loadSettings()
      expect(loaded).toEqual(settings)
    })

    it('returns null when no settings saved', async () => {
      const loaded = await mockTableauAdapter.loadSettings()
      expect(loaded).toBeNull()
    })

    it('throws on simulated settings error (save)', async () => {
      configureMock({ simulateSettingsError: true })
      await expect(mockTableauAdapter.saveSettings({
        selectedFieldPaths: [], columnOrder: [],
        treePanelWidth: 240, treePanelCollapsed: false, version: 1,
      })).rejects.toThrow(SettingsPersistError)
    })

    it('throws on simulated settings error (load)', async () => {
      configureMock({ simulateSettingsError: true })
      await expect(mockTableauAdapter.loadSettings()).rejects.toThrow(SettingsPersistError)
    })
  })

  describe('resetMock', () => {
    it('clears settings store', async () => {
      await mockTableauAdapter.saveSettings({
        selectedFieldPaths: ['test'], columnOrder: ['test'],
        treePanelWidth: 200, treePanelCollapsed: true, version: 1,
      })
      resetMock()
      const loaded = await mockTableauAdapter.loadSettings()
      expect(loaded).toBeNull()
    })

    it('clears filter subscribers', () => {
      mockTableauAdapter.subscribeToFilterChange(() => {})
      mockTableauAdapter.subscribeToFilterChange(() => {})
      expect(getFilterSubscriberCount()).toBe(2)
      resetMock()
      expect(getFilterSubscriberCount()).toBe(0)
    })

    it('resets error simulation flags', async () => {
      configureMock({ simulateConnectionError: true })
      resetMock()
      await expect(mockTableauAdapter.initialize()).resolves.toBeUndefined()
    })
  })
})
