/**
 * errors.ts — Typed error classes for the Tableau Telemetry Explorer.
 *
 * These errors are thrown by tableauAdapter.ts and caught by hooks.
 * Each maps to a specific failure domain:
 *   - TableauConnectionError: Tableau Extensions API not available or no worksheets found
 *   - TableauDataError: Failed to query schema or data from the Tableau data source
 *   - SettingsPersistError: Failed to save/load extension settings to/from the workbook
 *
 * Error handling pattern: adapter throws typed errors → hooks catch and update
 * Zustand state → components read error state and render inline (never modal).
 */

/** Thrown when Tableau Extensions API is unavailable or dashboard has no worksheets */
export class TableauConnectionError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TableauConnectionError'
  }
}

/** Thrown when a schema or data query to the Tableau data source fails */
export class TableauDataError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TableauDataError'
  }
}

/** Thrown when saving or loading extension settings via Tableau Settings API fails */
export class SettingsPersistError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'SettingsPersistError'
  }
}
