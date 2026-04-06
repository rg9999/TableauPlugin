import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { buildSparseGridModel } from '../services/dataTransform'
import { logger } from '../utils/logger'
import { TableauDataError } from '../models/errors'

const REFRESH_INTERVAL_MS = 10_000

/**
 * Polls the selected Tableau worksheet for new data every 10 seconds.
 * Diffs new data against existing grid data, identifies new rows by rowId,
 * and merges them into the store. Preserves existing grid state (scroll, sort, filter).
 * Pauses when document is hidden (tab not active).
 */
export function useLiveRefresh(): void {
  const selectedFields = useStore((state) => state.selectedFields)
  const selectedWorksheet = useStore((state) => state.selectedWorksheet)
  const gridData = useStore((state) => state.gridData)
  const setGridData = useStore((state) => state.setGridData)
  const setRefreshing = useStore((state) => state.setRefreshing)
  const setNewRowCount = useStore((state) => state.setNewRowCount)
  const recordRefreshSuccess = useStore((state) => state.recordRefreshSuccess)
  const recordRefreshFailure = useStore((state) => state.recordRefreshFailure)

  // Use refs for values accessed in the interval callback to avoid stale closures
  const selectedFieldsRef = useRef(selectedFields)
  const gridDataRef = useRef(gridData)
  const worksheetRef = useRef(selectedWorksheet)
  selectedFieldsRef.current = selectedFields
  gridDataRef.current = gridData
  worksheetRef.current = selectedWorksheet

  const doRefresh = useCallback(async () => {
    const fields = selectedFieldsRef.current
    const wsName = worksheetRef.current
    if (fields.length === 0 || !wsName) return

    // Skip if document is hidden (tab not active)
    if (document.hidden) return

    setRefreshing(true)
    try {
      const rows = await tableauAdapter.queryData(wsName)
      const freshGridData = buildSparseGridModel(rows, fields)

      // Diff: find new rows not in current data
      const existingIds = new Set(gridDataRef.current.map((r) => r.rowId))
      const newRows = freshGridData.filter((r) => !existingIds.has(r.rowId))

      if (newRows.length > 0) {
        // Merge: append new rows and re-sort by timestamp
        const merged = [...gridDataRef.current, ...newRows]
        merged.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        setGridData(merged)
        setNewRowCount(newRows.length)
        logger.info(`Live refresh: +${newRows.length} new rows (total: ${merged.length})`)
      } else {
        setNewRowCount(0)
      }

      recordRefreshSuccess()
    } catch (err) {
      const message = err instanceof TableauDataError ? err.message : 'Refresh failed'
      recordRefreshFailure(message)
      logger.warn('Live refresh failed — retaining last good data', message)
    }
  }, [setGridData, setRefreshing, setNewRowCount, recordRefreshSuccess, recordRefreshFailure])

  useEffect(() => {
    if (selectedFields.length === 0 || !selectedWorksheet) return

    const intervalId = setInterval(doRefresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [selectedFields.length, selectedWorksheet, doRefresh])
}
