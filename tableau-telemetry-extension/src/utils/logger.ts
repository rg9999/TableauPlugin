type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
}

type LogListener = (entry: LogEntry) => void

const VALID_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']
const raw = import.meta.env.VITE_LOG_LEVEL as string | undefined
const LOG_LEVEL: LogLevel = raw && VALID_LEVELS.includes(raw as LogLevel) ? (raw as LogLevel) : 'info'

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

const MAX_BUFFER = 500
const buffer: LogEntry[] = []
const listeners = new Set<LogListener>()

// ── Server-side log shipping ──────────────────────────────────────────
// Batches entries and POSTs them to the Vite dev server's /api/log endpoint.
// Entries are written to logs/session-<timestamp>.log on disk so you can
// review full session logs after the fact.
const SERVER_FLUSH_MS = 500
const serverQueue: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

// Derive the dev-server origin from the page URL (works for both localhost & LAN IP)
const serverOrigin = (() => {
  try {
    const loc = globalThis.location
    if (loc && loc.protocol && loc.hostname) {
      return `${loc.protocol}//${loc.hostname}:${loc.port}`
    }
  } catch { /* not in browser */ }
  return ''
})()

function flushToServer() {
  flushTimer = null
  if (serverQueue.length === 0 || !serverOrigin) return
  const batch = serverQueue.splice(0, serverQueue.length)
  fetch(`${serverOrigin}/api/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
  }).catch(() => {
    // Silently drop — server may not be running (production build)
  })
}

function shipToServer(entry: LogEntry) {
  serverQueue.push(entry)
  if (!flushTimer) {
    flushTimer = setTimeout(flushToServer, SERVER_FLUSH_MS)
  }
}

// ── Core emit ─────────────────────────────────────────────────────────

function emit(level: LogLevel, msg: string, args: unknown[]) {
  if (levels[LOG_LEVEL] > levels[level]) return

  // Build full message string (flatten args so they're visible in-app)
  const parts = [msg, ...args.map(a => {
    if (a instanceof Error) return a.message
    if (typeof a === 'object') {
      try { return JSON.stringify(a) } catch { return String(a) }
    }
    return String(a)
  })]
  const full = parts.join(' ')

  // Still log to console for dev
  const consoleFn = level === 'debug' ? console.debug
    : level === 'info' ? console.info
    : level === 'warn' ? console.warn
    : console.error
  consoleFn(`[${level.toUpperCase()}] ${msg}`, ...args)

  // Buffer + notify in-app console
  const entry: LogEntry = { level, message: full, timestamp: Date.now() }
  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) buffer.shift()
  for (const fn of listeners) fn(entry)

  // Ship to server for file logging
  shipToServer(entry)
}

export const logger = {
  debug: (msg: string, ...args: unknown[]) => emit('debug', msg, args),
  info:  (msg: string, ...args: unknown[]) => emit('info', msg, args),
  warn:  (msg: string, ...args: unknown[]) => emit('warn', msg, args),
  error: (msg: string, ...args: unknown[]) => emit('error', msg, args),
}

/** Get the current log buffer (for initial render) */
export function getLogBuffer(): LogEntry[] {
  return [...buffer]
}

/** Subscribe to new log entries. Returns unsubscribe function. */
export function subscribeToLogs(fn: LogListener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
