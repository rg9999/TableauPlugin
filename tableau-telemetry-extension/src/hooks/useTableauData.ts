/**
 * useTableauData.ts — Fetches row data from Tableau whenever selectedFields change.
 *
 * Calls tableauAdapter.queryData(), transforms with buildSparseGridModel(),
 * and stores the result in Zustand gridSlice. This provides the initial data
 * load; subsequent updates come from useTableauFilters (filter changes) and
 * useLiveRefresh (10-second polling).
 */
import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { buildSparseGridModel } from '../services/dataTransform'
import { logger } from '../utils/logger'
import { TableauDataError } from '../models/errors'

/**
 * Loads data from Tableau on mount, transforms it using buildSparseGridModel,
 * and stores in Zustand gridSlice. Re-fetches when selectedFields change.
 */
export function useTableauData(): void {
  const selectedFields = useStore((state) => state.selectedFields)
  const setGridData = useStore((state) => state.setGridData)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (selectedFields.length === 0) {
      setGridData([])
      return
    }

    async function fetchData() {
      try {
        const rows = await tableauAdapter.queryData()
        const gridData = buildSparseGridModel(rows, selectedFields)
        setGridData(gridData)
        if (!hasLoaded.current) {
          logger.info(`Tableau data loaded: ${rows.length} rows → ${gridData.length} grid rows`)
          hasLoaded.current = true
        }
      } catch (err) {
        if (err instanceof TableauDataError) {
          logger.warn('Failed to load data from Tableau', err.message)
        } else {
          logger.warn('Unexpected error loading Tableau data', err)
        }
      }
    }

    fetchData()
  }, [selectedFields, setGridData])
}
