import { describe, it, expect } from 'vitest'
import {
  MESSAGE_TYPES,
  ALL_MESSAGE_TYPE_NAMES,
  ALL_FIELD_PATHS,
  MOCK_SCHEMA,
  MOCK_ROWS_100,
  MOCK_ROWS_1K,
  generateMockRows,
} from './mockData'

describe('mockData', () => {
  describe('MESSAGE_TYPES', () => {
    it('has at least 15 message types', () => {
      expect(ALL_MESSAGE_TYPE_NAMES.length).toBeGreaterThanOrEqual(15)
    })

    it('each message type has 5-20 fields', () => {
      for (const name of ALL_MESSAGE_TYPE_NAMES) {
        const fields = MESSAGE_TYPES[name].fields
        expect(fields.length).toBeGreaterThanOrEqual(5)
        expect(fields.length).toBeLessThanOrEqual(20)
      }
    })

    it('fields use dotted-path naming with nesting up to 4 levels', () => {
      let maxDepth = 0
      for (const fieldPath of ALL_FIELD_PATHS) {
        const depth = fieldPath.split('.').length
        if (depth > maxDepth) maxDepth = depth
        expect(depth).toBeGreaterThanOrEqual(1)
      }
      expect(maxDepth).toBeGreaterThanOrEqual(4)
    })

    it('at least one message type contains array fields', () => {
      const arrayFields = ALL_FIELD_PATHS.filter(
        (f) => f.includes('history') || f.includes('stations'),
      )
      expect(arrayFields.length).toBeGreaterThan(0)
    })
  })

  describe('MOCK_SCHEMA', () => {
    it('includes timestamp and messageType columns', () => {
      expect(MOCK_SCHEMA.find((c) => c.fieldName === 'timestamp')).toBeDefined()
      expect(MOCK_SCHEMA.find((c) => c.fieldName === 'messageType')).toBeDefined()
    })

    it('includes all field paths', () => {
      for (const field of ALL_FIELD_PATHS) {
        expect(MOCK_SCHEMA.find((c) => c.fieldName === field)).toBeDefined()
      }
    })

    it('each schema entry has fieldName, dataType, and role', () => {
      for (const col of MOCK_SCHEMA) {
        expect(typeof col.fieldName).toBe('string')
        expect(typeof col.dataType).toBe('string')
        expect(col.role).toBe('dimension')
      }
    })
  })

  describe('generateMockRows', () => {
    it('generates the requested number of rows', () => {
      const rows = generateMockRows(50)
      expect(rows).toHaveLength(50)
    })

    it('each row has timestamp and messageType', () => {
      const rows = generateMockRows(20)
      for (const row of rows) {
        expect(typeof row['timestamp']).toBe('string')
        expect(typeof row['messageType']).toBe('string')
      }
    })

    it('rows only have fields from their message type (sparse model)', () => {
      const rows = generateMockRows(100)
      for (const row of rows) {
        const msgType = row['messageType'] as string
        const expectedFields = MESSAGE_TYPES[msgType as keyof typeof MESSAGE_TYPES].fields
        // All populated fields (except timestamp and messageType) should belong to this message type
        for (const key of Object.keys(row)) {
          if (key === 'timestamp' || key === 'messageType') continue
          expect(expectedFields).toContain(key)
        }
      }
    })

    it('is deterministic with the same seed', () => {
      const rows1 = generateMockRows(10, undefined, 123)
      const rows2 = generateMockRows(10, undefined, 123)
      expect(rows1).toEqual(rows2)
    })

    it('produces different data with different seeds', () => {
      const rows1 = generateMockRows(10, undefined, 1)
      const rows2 = generateMockRows(10, undefined, 2)
      // At least some values should differ
      const values1 = JSON.stringify(rows1)
      const values2 = JSON.stringify(rows2)
      expect(values1).not.toBe(values2)
    })

    it('can filter to specific message types', () => {
      const rows = generateMockRows(20, ['navigation.gps.position', 'systemlog'])
      for (const row of rows) {
        expect(['navigation.gps.position', 'systemlog']).toContain(row['messageType'])
      }
    })

    it('generates array field values as arrays', () => {
      const rows = generateMockRows(200)
      const radarTrackRows = rows.filter((r) => r['messageType'] === 'sensors.radar.track')
      expect(radarTrackRows.length).toBeGreaterThan(0)
      for (const row of radarTrackRows) {
        expect(Array.isArray(row['sensors.radar.track.history'])).toBe(true)
      }
    })
  })

  describe('pre-built datasets', () => {
    it('MOCK_ROWS_100 has 100 rows', () => {
      expect(MOCK_ROWS_100).toHaveLength(100)
    })

    it('MOCK_ROWS_1K has 1000 rows', () => {
      expect(MOCK_ROWS_1K).toHaveLength(1000)
    })

    it('pre-built datasets are deterministic', () => {
      const fresh100 = generateMockRows(100, undefined, 42)
      expect(MOCK_ROWS_100).toEqual(fresh100)
    })
  })
})
