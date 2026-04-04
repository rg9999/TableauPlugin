/**
 * gridSlice.ts — Zustand slice for AG Grid data and interaction state.
 *
 * Holds the transformed sparse grid row data and syncs sort/filter models
 * from AG Grid events back to Zustand for state preservation during refresh.
 *
 * State:  gridData (GridRowData[]), sortModel, filterModel
 * Actions: setGridData, setSortModel, setFilterModel, clearFilters
 */
import type { StateCreator } from 'zustand'
import type { GridRowData } from '../models/gridData'
import type { SortModelItem } from 'ag-grid-community'

export interface GridSlice {
  gridData: GridRowData[]
  sortModel: SortModelItem[]
  filterModel: Record<string, unknown>

  setGridData: (data: GridRowData[]) => void
  setSortModel: (model: SortModelItem[]) => void
  setFilterModel: (model: Record<string, unknown>) => void
  clearFilters: () => void
}

export const createGridSlice: StateCreator<GridSlice> = (set) => ({
  gridData: [],
  sortModel: [],
  filterModel: {},

  setGridData: (data) => set({ gridData: data }),
  setSortModel: (model) => set({ sortModel: model }),
  setFilterModel: (model) => set({ filterModel: model }),
  clearFilters: () => set({ filterModel: {} }),
})
