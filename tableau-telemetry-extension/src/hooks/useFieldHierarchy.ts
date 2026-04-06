import { useEffect, useRef } from 'react'
import { useStore } from '../store/store'
import { tableauAdapter } from '../services/tableauAdapter'
import { parseFieldHierarchy, clearParseCache } from '../services/dataTransform'
import { logger } from '../utils/logger'
import { TableauConnectionError, TableauDataError } from '../models/errors'

/**
 * Loads the Tableau data source schema whenever the selected worksheet changes.
 * Parses the column list into a field hierarchy and stores it in Zustand.
 */
export function useFieldHierarchy(): void {
  const selectedWorksheet = useStore((state) => state.selectedWorksheet)
  const setFieldHierarchy = useStore((state) => state.setFieldHierarchy)
  const setFieldLoadError = useStore((state) => state.setFieldLoadError)
  const registerWorksheetMessageTypes = useStore((state) => state.registerWorksheetMessageTypes)
  const lastWorksheet = useRef<string | null>(null)

  useEffect(() => {
    // Only load when worksheet actually changes to a new value
    if (!selectedWorksheet) return
    if (selectedWorksheet === lastWorksheet.current) return

    // Don't clear fields from other worksheets — allow cross-worksheet selection
    const isNewWorksheet = lastWorksheet.current !== null && lastWorksheet.current !== selectedWorksheet
    lastWorksheet.current = selectedWorksheet

    if (isNewWorksheet) {
      clearParseCache()
      // NOTE: we intentionally do NOT clear selected fields here.
      // Fields from other worksheets remain selected so the user can
      // view fields from multiple worksheets simultaneously.
    }
    setFieldHierarchy(null as unknown as import('../models/fieldHierarchy').TreeNode)
    setFieldLoadError(null)

    async function loadSchema() {
      try {
        logger.info(`[useFieldHierarchy] Loading schema for worksheet "${selectedWorksheet}"...`)
        const columns = await tableauAdapter.getDataSourceSchema(selectedWorksheet!)
        logger.info(`[useFieldHierarchy] Got ${columns.length} columns from "${selectedWorksheet}"`)

        if (columns.length === 0) {
          const msg = `No columns returned from worksheet "${selectedWorksheet}". The worksheet may have no data or no fields on its shelves.`
          logger.warn(`[useFieldHierarchy] ${msg}`)
          setFieldLoadError(msg)
          return
        }

        logger.debug('[useFieldHierarchy] Column names:', columns.map(c => c.fieldName))
        const hierarchy = parseFieldHierarchy(columns)
        logger.info(`[useFieldHierarchy] Field hierarchy loaded: ${columns.length} columns, ${hierarchy.children.length} top-level groups`)

        if (hierarchy.children.length === 0) {
          const msg = 'Columns found but no field hierarchy could be built. Column names may not use dotted-path format.'
          logger.warn(`[useFieldHierarchy] ${msg}`)
          setFieldLoadError(msg)
          return
        }

        // Register which message types this worksheet provides
        const messageTypes = [...new Set(hierarchy.children.map((c) => c.messageType))]
        logger.info(`[useFieldHierarchy] Registering messageTypes for "${selectedWorksheet}": ${messageTypes.join(', ')}`)
        registerWorksheetMessageTypes(selectedWorksheet!, messageTypes)

        setFieldHierarchy(hierarchy)
      } catch (err) {
        let msg: string
        if (err instanceof TableauConnectionError) {
          msg = `Tableau connection error: ${err.message}`
          logger.error(`[useFieldHierarchy] ${msg}`)
        } else if (err instanceof TableauDataError) {
          msg = `Data error: ${err.message}`
          logger.error(`[useFieldHierarchy] ${msg}`)
        } else {
          msg = `Unexpected error: ${err instanceof Error ? err.message : String(err)}`
          logger.error('[useFieldHierarchy] Unexpected error loading field hierarchy', err)
        }
        setFieldLoadError(msg)
      }
    }

    loadSchema()
  }, [selectedWorksheet, setFieldHierarchy, setFieldLoadError, registerWorksheetMessageTypes])
}
