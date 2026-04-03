import { create } from 'zustand'
import { createFieldSelectionSlice, type FieldSelectionSlice } from './fieldSelectionSlice'
import { createGridSlice, type GridSlice } from './gridSlice'
import { createRefreshSlice, type RefreshSlice } from './refreshSlice'
import { createSettingsSlice, type SettingsSlice } from './settingsSlice'

export type AppState = FieldSelectionSlice & GridSlice & RefreshSlice & SettingsSlice

export const useStore = create<AppState>()((...a) => ({
  ...createFieldSelectionSlice(...a),
  ...createGridSlice(...a),
  ...createRefreshSlice(...a),
  ...createSettingsSlice(...a),
}))
