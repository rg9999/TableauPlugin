import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { logger } from '../utils/logger'

/**
 * Discovers all worksheets available on the Tableau dashboard after initialization.
 * Populates the availableWorksheets list in the store.
 * Runs once on mount.
 */
export function useWorksheetDiscovery(): void {
  const setAvailableWorksheets = useStore((state) => state.setAvailableWorksheets)
  const setWorksheetError = useStore((state) => state.setWorksheetError)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const worksheets = tableauAdapter.getAvailableWorksheets()

    if (worksheets.length === 0) {
      const msg = 'No worksheets found on the dashboard. Add worksheets to the dashboard (they can be floating and small) so the extension can access their data.'
      logger.warn(`[useWorksheetDiscovery] ${msg}`)
      setWorksheetError(msg)
      return
    }

    logger.info(`[useWorksheetDiscovery] Found ${worksheets.length} worksheets`)
    setAvailableWorksheets(worksheets)
  }, [setAvailableWorksheets, setWorksheetError])
}
