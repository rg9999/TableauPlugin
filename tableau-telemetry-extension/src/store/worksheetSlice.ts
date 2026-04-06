import type { StateCreator } from 'zustand'

export interface WorksheetInfo {
  /** Worksheet name as shown in Tableau */
  name: string
  /** Index in the dashboard.worksheets array */
  index: number
}

export interface WorksheetSlice {
  /** All worksheets available on the dashboard */
  availableWorksheets: WorksheetInfo[]
  /** Currently selected worksheet name (null = none selected) */
  selectedWorksheet: string | null
  /** Error loading worksheets */
  worksheetError: string | null

  setAvailableWorksheets: (worksheets: WorksheetInfo[]) => void
  setSelectedWorksheet: (name: string | null) => void
  setWorksheetError: (error: string | null) => void
}

export const createWorksheetSlice: StateCreator<WorksheetSlice> = (set) => ({
  availableWorksheets: [],
  selectedWorksheet: null,
  worksheetError: null,

  setAvailableWorksheets: (worksheets) => set({ availableWorksheets: worksheets, worksheetError: null }),
  setSelectedWorksheet: (name) => set({ selectedWorksheet: name }),
  setWorksheetError: (error) => set({ worksheetError: error }),
})
