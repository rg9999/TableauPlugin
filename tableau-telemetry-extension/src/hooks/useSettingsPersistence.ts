/**
 * useSettingsPersistence.ts — Saves and restores extension state via Tableau Settings API.
 *
 * On init (once the field hierarchy is loaded): reads saved settings from the
 * workbook and restores field selections by resolving saved dotted-path strings
 * back to FieldNode objects via a tree walk.
 *
 * On field change: debounced save (2 seconds) serializes current selections
 * as compact path strings to stay under Tableau's ~2MB Settings API limit.
 *
 * Graceful degradation: corrupted or incompatible settings → empty state (no crash).
 */
import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { logger } from '../utils/logger'
import type { ExtensionSettings } from '../models/extensionSettings'
import type { FieldNode } from '../models/fieldHierarchy'

const SETTINGS_VERSION = 1
const SAVE_DEBOUNCE_MS = 2000

/**
 * Persists extension state (field selections, column order, panel config)
 * to Tableau Settings API. Loads on init, saves on field changes (debounced).
 */
export function useSettingsPersistence(): void {
  const selectedFields = useStore((state) => state.selectedFields)
  const fieldHierarchy = useStore((state) => state.fieldHierarchy)
  const addFields = useStore((state) => state.addFields)
  const settingsLoaded = useStore((state) => state.settingsLoaded)
  const setSettingsLoaded = useStore((state) => state.setSettingsLoaded)
  const setSavingSettings = useStore((state) => state.setSavingSettings)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRestoringRef = useRef(false)

  // Load settings on init (once hierarchy is available)
  useEffect(() => {
    if (settingsLoaded || !fieldHierarchy) return

    async function restoreSettings() {
      try {
        const settings = await tableauAdapter.loadSettings()
        if (!settings || !settings.selectedFieldPaths?.length) {
          setSettingsLoaded(true)
          return
        }

        // Reconstruct FieldNode[] from saved paths using the hierarchy
        const restoredFields = resolveFieldNodes(settings.selectedFieldPaths, fieldHierarchy!)
        if (restoredFields.length > 0) {
          isRestoringRef.current = true
          addFields(restoredFields)
          isRestoringRef.current = false
          logger.info(`Restored ${restoredFields.length} field selections from saved settings`)
        }
      } catch (err) {
        logger.warn('Failed to restore settings — starting with empty state', err)
      }
      setSettingsLoaded(true)
    }

    restoreSettings()
  }, [fieldHierarchy, settingsLoaded, setSettingsLoaded, addFields])

  // Save settings when selectedFields change (debounced)
  useEffect(() => {
    // Don't save during initial restore or before settings are loaded
    if (!settingsLoaded || isRestoringRef.current) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(async () => {
      const settings: ExtensionSettings = {
        selectedFieldPaths: selectedFields.map((f) => f.dottedPath),
        columnOrder: selectedFields.map((f) => f.dottedPath),
        treePanelWidth: null, // TODO: read from PanelLayout state if needed
        treePanelCollapsed: false,
        version: SETTINGS_VERSION,
      }

      setSavingSettings(true)
      try {
        await tableauAdapter.saveSettings(settings)
      } catch (err) {
        logger.warn('Failed to save settings', err)
      }
      setSavingSettings(false)
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [selectedFields, settingsLoaded, setSavingSettings])
}

/**
 * Resolves saved dotted-path strings back to FieldNode objects
 * by walking the TreeNode hierarchy.
 */
function resolveFieldNodes(
  paths: string[],
  hierarchy: import('../models/fieldHierarchy').TreeNode,
): FieldNode[] {
  const result: FieldNode[] = []
  const pathSet = new Set(paths)

  function walk(node: import('../models/fieldHierarchy').TreeNode): void {
    if (node.isField && node.children.length === 0 && pathSet.has(node.dottedPath)) {
      result.push({
        shortName: node.name,
        dottedPath: node.dottedPath,
        messageType: node.messageType,
        dataType: 'string',
      })
    }
    for (const child of node.children) walk(child)
  }

  walk(hierarchy)
  return result
}
