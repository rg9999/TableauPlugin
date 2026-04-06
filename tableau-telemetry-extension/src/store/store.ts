import { create } from 'zustand'
import { createFieldSelectionSlice, type FieldSelectionSlice } from './fieldSelectionSlice'
import { createGridSlice, type GridSlice } from './gridSlice'
import { createLayoutSlice, type LayoutSlice } from './layoutSlice'
import { createRefreshSlice, type RefreshSlice } from './refreshSlice'
import { createSettingsSlice, type SettingsSlice } from './settingsSlice'
import { createWorksheetSlice, type WorksheetSlice } from './worksheetSlice'

export type AppState = FieldSelectionSlice & GridSlice & LayoutSlice & RefreshSlice & SettingsSlice & WorksheetSlice

export const useStore = create<AppState>()((...a) => ({
  ...createFieldSelectionSlice(...a),
  ...createGridSlice(...a),
  ...createLayoutSlice(...a),
  ...createRefreshSlice(...a),
  ...createSettingsSlice(...a),
  ...createWorksheetSlice(...a),
}))
