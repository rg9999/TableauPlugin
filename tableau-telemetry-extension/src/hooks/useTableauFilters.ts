import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { buildSparseGridModel } from '../services/dataTransform'
import { logger } from '../utils/logger'
import { TableauDataError } from '../models/errors'
import type { TableauFilter } from '../models/tableauTypes'

/**
 * Subscribes to Tableau filter change events on the selected worksheet.
 * When any dashboard filter changes, re-queries data and updates the grid.
 * Re-subscribes when the selected worksheet changes.
 */
export function useTableauFilters(): void {
  const selectedFields = useStore((state) => state.selectedFields)
  const selectedWorksheet = useStore((state) => state.selectedWorksheet)
  const setGridData = useStore((state) => state.setGridData)
  const setRefreshing = useStore((state) => state.setRefreshing)
  const recordRefreshSuccess = useStore((state) => state.recordRefreshSuccess)
  const recordRefreshFailure = useStore((state) => state.recordRefreshFailure)
  const selectedFieldsRef = useRef(selectedFields)
  selectedFieldsRef.current = selectedFields
  const worksheetRef = useRef(selectedWorksheet)
  worksheetRef.current = selectedWorksheet

  useEffect(() => {
    if (!selectedWorksheet) return

    const handleFilterChange = async (_filters: TableauFilter[]) => {
      const fields = selectedFieldsRef.current
      const wsName = worksheetRef.current
      if (fields.length === 0 || !wsName) return

      setRefreshing(true)
      try {
        const rows = await tableauAdapter.queryData(wsName)
        const gridData = buildSparseGridModel(rows, fields)
        setGridData(gridData)
        recordRefreshSuccess()
        logger.info(`Filter change on "${wsName}": re-queried ${rows.length} rows`)
      } catch (err) {
        const message = err instanceof TableauDataError ? err.message : 'Filter re-query failed'
        recordRefreshFailure(message)
        logger.warn('Failed to re-query after filter change', message)
      }
    }

    const unsubscribe = tableauAdapter.subscribeToFilterChange(selectedWorksheet, handleFilterChange)
    return unsubscribe
  }, [selectedWorksheet, setGridData, setRefreshing, recordRefreshSuccess, recordRefreshFailure])
}
