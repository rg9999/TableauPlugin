type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const VALID_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']
const raw = import.meta.env.VITE_LOG_LEVEL as string | undefined
const LOG_LEVEL: LogLevel = raw && VALID_LEVELS.includes(raw as LogLevel) ? (raw as LogLevel) : 'info'

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export const logger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (levels[LOG_LEVEL] <= levels.debug) console.debug(`[DEBUG] ${msg}`, ...args)
  },
  info: (msg: string, ...args: unknown[]) => {
    if (levels[LOG_LEVEL] <= levels.info) console.info(`[INFO] ${msg}`, ...args)
  },
  warn: (msg: string, ...args: unknown[]) => {
    if (levels[LOG_LEVEL] <= levels.warn) console.warn(`[WARN] ${msg}`, ...args)
  },
  error: (msg: string, ...args: unknown[]) => {
    if (levels[LOG_LEVEL] <= levels.error) console.error(`[ERROR] ${msg}`, ...args)
  },
}
