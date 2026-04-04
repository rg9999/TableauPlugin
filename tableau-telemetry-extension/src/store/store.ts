/**
 * store.ts — Zustand store combining all state slices into a single AppState.
 *
 * Architecture: Single store, named slices. Each slice owns a domain:
 *   - fieldSelectionSlice: tree hierarchy, selected fields, add/remove actions
 *   - gridSlice: grid row data, sort/filter models
 *   - refreshSlice: live refresh state (polling, new row count, errors)
 *   - settingsSlice: Tableau Settings API persistence flags
 *
 * Usage: components read via `useStore(state => state.property)` selector.
 * Never destructure the entire store — always use selectors for performance.
 */
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
