import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { parseFieldHierarchy } from '../services/dataTransform'
import { logger } from '../utils/logger'
import { TableauDataError } from '../models/errors'

/**
 * Loads the Tableau data source schema on mount, parses it into a field hierarchy,
 * and stores it in Zustand. Runs once — memoized via ref guard.
 */
export function useFieldHierarchy(): void {
  const setFieldHierarchy = useStore((state) => state.setFieldHierarchy)
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true

    async function loadSchema() {
      try {
        const columns = await tableauAdapter.getDataSourceSchema()
        const hierarchy = parseFieldHierarchy(columns)
        setFieldHierarchy(hierarchy)
        logger.info(`Field hierarchy loaded: ${columns.length} columns`)
      } catch (err) {
        if (err instanceof TableauDataError) {
          logger.warn('Failed to load field hierarchy from Tableau', err.message)
        } else {
          logger.warn('Unexpected error loading field hierarchy', err)
        }
      }
    }

    loadSchema()
  }, [setFieldHierarchy])
}
