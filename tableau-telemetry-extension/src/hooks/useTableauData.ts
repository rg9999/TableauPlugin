import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { buildSparseGridModel } from '../services/dataTransform'
import { logger } from '../utils/logger'
import { TableauDataError } from '../models/errors'
import type { FlatRowData } from '../models/tableauTypes'

/**
 * Loads data from ALL Tableau worksheets that have selected fields,
 * merges the rows, transforms via buildSparseGridModel, and stores in Zustand.
 *
 * Re-fetches when selectedFields or the messageType→worksheet mapping changes.
 */
export function useTableauData(): void {
  const selectedFields = useStore((state) => state.selectedFields)
  const messageTypeToWorksheet = useStore((state) => state.messageTypeToWorksheet)
  const setGridData = useStore((state) => state.setGridData)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (selectedFields.length === 0) {
      setGridData([])
      return
    }

    // Determine which worksheets we need to query based on selected fields' message types
    const worksheetsNeeded = new Set<string>()
    for (const field of selectedFields) {
      const wsName = messageTypeToWorksheet[field.messageType]
      if (wsName) {
        worksheetsNeeded.add(wsName)
      } else {
        logger.warn(`[useTableauData] No worksheet mapping for messageType "${field.messageType}" (field: ${field.dottedPath})`)
      }
    }

    if (worksheetsNeeded.size === 0) {
      logger.warn('[useTableauData] No worksheet mappings found for any selected field — cannot query data')
      return
    }

    logger.info(`[useTableauData] Querying ${worksheetsNeeded.size} worksheet(s): ${[...worksheetsNeeded].join(', ')}`)

    async function fetchData() {
      try {
        // Query all needed worksheets in parallel
        const worksheetNames = [...worksheetsNeeded]
        const results = await Promise.allSettled(
          worksheetNames.map((wsName) => tableauAdapter.queryData(wsName)),
        )

        // Merge rows from all worksheets
        const allRows: FlatRowData[] = []
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          if (result.status === 'fulfilled') {
            logger.info(`[useTableauData] Worksheet "${worksheetNames[i]}" returned ${result.value.length} rows`)
            allRows.push(...result.value)
          } else {
            logger.warn(`[useTableauData] Failed to query worksheet "${worksheetNames[i]}":`, result.reason)
          }
        }

        logger.info(`[useTableauData] Total merged rows: ${allRows.length} from ${worksheetsNeeded.size} worksheet(s)`)

        // Log sample data for debugging
        if (allRows.length > 0) {
          const sampleKeys = Object.keys(allRows[0])
          const fieldPaths = selectedFields.map((f) => f.dottedPath)
          logger.info(`[useTableauData] Sample row keys (${sampleKeys.length}): ${sampleKeys.slice(0, 15).join(', ')}`)
          logger.info(`[useTableauData] Selected fields (${fieldPaths.length}): ${fieldPaths.join(', ')}`)
        }

        const gridData = buildSparseGridModel(allRows, selectedFields)
        setGridData(gridData)
        if (!hasLoaded.current) {
          logger.info(`[useTableauData] Grid populated: ${allRows.length} raw rows → ${gridData.length} grid rows`)
          hasLoaded.current = true
        }
      } catch (err) {
        if (err instanceof TableauDataError) {
          logger.warn('[useTableauData] Failed to load data', err.message)
        } else {
          logger.warn('[useTableauData] Unexpected error loading data', err)
        }
      }
    }

    fetchData()
  }, [selectedFields, messageTypeToWorksheet, setGridData])
}
