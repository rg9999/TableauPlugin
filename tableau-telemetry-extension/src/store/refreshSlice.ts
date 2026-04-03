import type { StateCreator } from 'zustand'

export interface RefreshSlice {
  // TODO: State — isRefreshing, lastRefreshTime, newRowCount, errorState
  // TODO: Actions — setRefreshing, setLastRefreshTime, setNewRowCount, setErrorState
}

export const createRefreshSlice: StateCreator<RefreshSlice> = () => ({
  // Empty skeleton — populated in Epic 5
})
