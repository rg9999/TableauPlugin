import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { logger } from '../utils/logger'
import type { ExtensionSettings } from '../models/extensionSettings'
import { resolveFieldNodes } from '../utils/resolveFieldNodes'

const SETTINGS_VERSION = 2
const SAVE_DEBOUNCE_MS = 2000

/**
 * Persists extension state (field selections, column order, panel config,
 * sort/filter, worksheet selection) to Tableau Settings API.
 * Loads on init, saves on state changes (debounced).
 */
export function useSettingsPersistence(): void {
  const selectedFields = useStore((state) => state.selectedFields)
  const fieldHierarchy = useStore((state) => state.fieldHierarchy)
  const addFields = useStore((state) => state.addFields)
  const settingsLoaded = useStore((state) => state.settingsLoaded)
  const setSettingsLoaded = useStore((state) => state.setSettingsLoaded)
  const setSavingSettings = useStore((state) => state.setSavingSettings)

  // Layout state
  const treePanelWidth = useStore((state) => state.treePanelWidth)
  const treePanelCollapsed = useStore((state) => state.treePanelCollapsed)
  const detailPanelWidth = useStore((state) => state.detailPanelWidth)
  const detailPanelCollapsed = useStore((state) => state.detailPanelCollapsed)
  const setTreePanelWidth = useStore((state) => state.setTreePanelWidth)
  const setTreePanelCollapsed = useStore((state) => state.setTreePanelCollapsed)
  const setDetailPanelWidth = useStore((state) => state.setDetailPanelWidth)
  const setDetailPanelCollapsed = useStore((state) => state.setDetailPanelCollapsed)

  // Worksheet state
  const selectedWorksheet = useStore((state) => state.selectedWorksheet)
  const setSelectedWorksheet = useStore((state) => state.setSelectedWorksheet)

  // Grid state (sort/filter)
  const sortModel = useStore((state) => state.sortModel)
  const filterModel = useStore((state) => state.filterModel)
  const setSortModel = useStore((state) => state.setSortModel)
  const setFilterModel = useStore((state) => state.setFilterModel)

  // Presets
  const setLayoutPresets = useStore((state) => state.setLayoutPresets)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRestoringRef = useRef(false)

  // Load settings on init (once hierarchy is available)
  useEffect(() => {
    if (settingsLoaded || !fieldHierarchy) return

    async function restoreSettings() {
      try {
        const settings = await tableauAdapter.loadSettings()

        // Also load saved presets
        const presets = await tableauAdapter.loadPresets()
        if (presets.length > 0) {
          setLayoutPresets(presets)
          logger.info(`Restored ${presets.length} layout presets`)
        }

        if (!settings || !settings.selectedFieldPaths?.length) {
          // Restore layout state even if no fields selected
          if (settings) {
            restoreLayoutState(settings)
          }
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

        // Restore layout & grid state
        restoreLayoutState(settings)
      } catch (err) {
        logger.warn('Failed to restore settings — starting with empty state', err)
      }
      setSettingsLoaded(true)
    }

    function restoreLayoutState(settings: ExtensionSettings) {
      if (settings.treePanelWidth != null) setTreePanelWidth(settings.treePanelWidth)
      if (settings.treePanelCollapsed != null) setTreePanelCollapsed(settings.treePanelCollapsed)
      if (settings.detailPanelWidth != null) setDetailPanelWidth(settings.detailPanelWidth)
      if (settings.detailPanelCollapsed != null) setDetailPanelCollapsed(settings.detailPanelCollapsed)
      if (settings.selectedWorksheet) setSelectedWorksheet(settings.selectedWorksheet)
      if (settings.sortModel?.length) setSortModel(settings.sortModel as { colId: string; sort: 'asc' | 'desc' }[])
      if (settings.filterModel && Object.keys(settings.filterModel).length > 0) setFilterModel(settings.filterModel)
    }

    restoreSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldHierarchy, settingsLoaded])

  // Save settings when state changes (debounced)
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
        treePanelWidth,
        treePanelCollapsed,
        detailPanelWidth,
        detailPanelCollapsed,
        selectedWorksheet,
        sortModel: sortModel.map((s) => ({ colId: s.colId, sort: s.sort as string })),
        filterModel,
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
  }, [
    selectedFields, settingsLoaded, setSavingSettings,
    treePanelWidth, treePanelCollapsed,
    detailPanelWidth, detailPanelCollapsed,
    selectedWorksheet, sortModel, filterModel,
  ])
}

