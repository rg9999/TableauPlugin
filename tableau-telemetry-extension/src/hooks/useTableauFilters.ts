import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { buildSparseGridModel } from '../services/dataTransform'
import { logger } from '../utils/logger'
import { TableauDataError } from '../models/errors'
import type { TableauFilter } from '../models/tableauTypes'

/**
 * Subscribes to Tableau filter change events.
 * When any dashboard filter changes, re-queries data and updates the grid.
 * Retains last good data on failure.
 */
export function useTableauFilters(): void {
  const selectedFields = useStore((state) => state.selectedFields)
  const setGridData = useStore((state) => state.setGridData)
  const setRefreshing = useStore((state) => state.setRefreshing)
  const recordRefreshSuccess = useStore((state) => state.recordRefreshSuccess)
  const recordRefreshFailure = useStore((state) => state.recordRefreshFailure)
  const selectedFieldsRef = useRef(selectedFields)
  selectedFieldsRef.current = selectedFields

  useEffect(() => {
    const handleFilterChange = async (_filters: TableauFilter[]) => {
      const fields = selectedFieldsRef.current
      if (fields.length === 0) return

      setRefreshing(true)
      try {
        const rows = await tableauAdapter.queryData()
        const gridData = buildSparseGridModel(rows, fields)
        setGridData(gridData)
        recordRefreshSuccess()
        logger.info(`Filter change: re-queried ${rows.length} rows`)
      } catch (err) {
        const message = err instanceof TableauDataError ? err.message : 'Filter re-query failed'
        recordRefreshFailure(message)
        logger.warn('Failed to re-query after filter change', message)
        // Grid retains last good data — no setGridData call on error
      }
    }

    const unsubscribe = tableauAdapter.subscribeToFilterChange(handleFilterChange)
    return unsubscribe
  }, [setGridData, setRefreshing, recordRefreshSuccess, recordRefreshFailure])
}
