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
