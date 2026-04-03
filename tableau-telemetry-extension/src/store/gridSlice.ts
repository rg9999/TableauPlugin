import type { StateCreator } from 'zustand'

export interface GridSlice {
  // TODO: State — sortModel, filterModel, scrollPosition, gridData
  // TODO: Actions — setGridData, setSortModel, setFilterModel
}

export const createGridSlice: StateCreator<GridSlice> = () => ({
  // Empty skeleton — populated in Epic 3
})
