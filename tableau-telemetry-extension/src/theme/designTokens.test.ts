import { describe, it, expect } from 'vitest'
import { COLORS, SEMANTIC, MESSAGE_TYPE_COLORS, SPACING, TYPOGRAPHY, LAYOUT } from './designTokens'

describe('designTokens', () => {
  describe('MESSAGE_TYPE_COLORS', () => {
    it('has exactly 8 entries', () => {
      expect(MESSAGE_TYPE_COLORS).toHaveLength(8)
    })

    it('contains valid hex color strings', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/
      MESSAGE_TYPE_COLORS.forEach((color) => {
        expect(color).toMatch(hexPattern)
      })
    })
  })

  describe('COLORS', () => {
    it('contains valid hex color strings', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/
      Object.values(COLORS).forEach((color) => {
        expect(color).toMatch(hexPattern)
      })
    })
  })

  describe('SEMANTIC', () => {
    it('contains valid color values (hex or rgba)', () => {
      const colorPattern = /^(#[0-9A-Fa-f]{6}|rgba?\(.+\))$/
      Object.values(SEMANTIC).forEach((color) => {
        expect(color).toMatch(colorPattern)
      })
    })
  })

  describe('SPACING', () => {
    it('all values are multiples of 4', () => {
      Object.values(SPACING).forEach((value) => {
        expect(value % 4).toBe(0)
      })
    })
  })

  describe('TYPOGRAPHY', () => {
    it('has a fontFamily string', () => {
      expect(typeof TYPOGRAPHY.fontFamily).toBe('string')
      expect(TYPOGRAPHY.fontFamily.length).toBeGreaterThan(0)
    })

    it('all type scale entries have size and weight', () => {
      const entries = [
        TYPOGRAPHY.gridCell,
        TYPOGRAPHY.columnHeader,
        TYPOGRAPHY.treeNode,
        TYPOGRAPHY.treeNodeSelected,
        TYPOGRAPHY.statusBar,
        TYPOGRAPHY.panelHeader,
        TYPOGRAPHY.tooltip,
        TYPOGRAPHY.emptyState,
      ]
      entries.forEach((entry) => {
        expect(entry.size).toBeGreaterThan(0)
        expect(entry.weight).toBeGreaterThan(0)
      })
    })
  })

  describe('LAYOUT', () => {
    it('tree panel width is greater than collapsed width', () => {
      expect(LAYOUT.treePanelWidth).toBeGreaterThan(LAYOUT.treePanelCollapsedWidth)
    })

    it('status bar height is positive', () => {
      expect(LAYOUT.statusBarHeight).toBeGreaterThan(0)
    })
  })
})
