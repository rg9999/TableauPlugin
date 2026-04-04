/**
 * settingsSlice.ts — Zustand slice for Tableau Settings API persistence flags.
 *
 * Tracks whether settings are currently being saved (background, no UI indicator)
 * and whether initial settings have been loaded from the workbook on startup.
 * The actual save/load logic lives in useSettingsPersistence hook.
 */
import type { StateCreator } from 'zustand'

export interface SettingsSlice {
  isSavingSettings: boolean
  settingsLoaded: boolean

  setSavingSettings: (saving: boolean) => void
  setSettingsLoaded: (loaded: boolean) => void
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  isSavingSettings: false,
  settingsLoaded: false,

  setSavingSettings: (saving) => set({ isSavingSettings: saving }),
  setSettingsLoaded: (loaded) => set({ settingsLoaded: loaded }),
})
