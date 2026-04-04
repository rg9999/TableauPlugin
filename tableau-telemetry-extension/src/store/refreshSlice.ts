/**
 * refreshSlice.ts — Zustand slice for live data refresh state.
 *
 * Tracks the 10-second polling cycle: whether a refresh is in progress,
 * when the last successful refresh occurred, how many new rows arrived,
 * and consecutive failure count for error escalation in the StatusBar.
 *
 * State:  isRefreshing, lastRefreshTime, newRowCount, consecutiveFailures, errorMessage
 * Actions: setRefreshing, setLastRefreshTime, setNewRowCount,
 *          recordRefreshFailure (increments failures), recordRefreshSuccess (resets)
 */
import type { StateCreator } from 'zustand'

export interface RefreshSlice {
  isRefreshing: boolean
  lastRefreshTime: Date | null
  newRowCount: number
  consecutiveFailures: number
  errorMessage: string | null

  setRefreshing: (refreshing: boolean) => void
  setLastRefreshTime: (time: Date) => void
  setNewRowCount: (count: number) => void
  recordRefreshFailure: (message: string) => void
  recordRefreshSuccess: () => void
}

export const createRefreshSlice: StateCreator<RefreshSlice> = (set) => ({
  isRefreshing: false,
  lastRefreshTime: null,
  newRowCount: 0,
  consecutiveFailures: 0,
  errorMessage: null,

  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  setLastRefreshTime: (time) => set({ lastRefreshTime: time }),
  setNewRowCount: (count) => set({ newRowCount: count }),

  recordRefreshFailure: (message) =>
    set((state) => ({
      consecutiveFailures: state.consecutiveFailures + 1,
      errorMessage: message,
      isRefreshing: false,
    })),

  recordRefreshSuccess: () =>
    set({
      consecutiveFailures: 0,
      errorMessage: null,
      isRefreshing: false,
      lastRefreshTime: new Date(),
    }),
})
