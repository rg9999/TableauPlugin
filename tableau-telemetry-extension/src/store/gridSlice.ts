import type { StateCreator } from 'zustand'
import type { GridRowData } from '../models/gridData'

export interface GridSlice {
  gridData: GridRowData[]

  setGridData: (data: GridRowData[]) => void
}

export const createGridSlice: StateCreator<GridSlice> = (set) => ({
  gridData: [],

  setGridData: (data) => set({ gridData: data }),
})
