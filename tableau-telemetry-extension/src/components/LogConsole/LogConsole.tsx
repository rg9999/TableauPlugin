import { useEffect, useRef, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { COLORS } from '../../theme/designTokens'
import { getLogBuffer, subscribeToLogs, type LogEntry } from '../../utils/logger'

const LEVEL_COLORS: Record<string, string> = {
  debug: '#888',
  info: '#4a90d9',
  warn: '#e5a100',
  error: '#e53935',
}

const MAX_VISIBLE = 200

/**
 * Small collapsible log console shown at the bottom of the extension.
 * Captures all logger output so you can debug inside Tableau Desktop
 * where browser DevTools aren't available.
 */
export default function LogConsole() {
  const [entries, setEntries] = useState<LogEntry[]>(() => getLogBuffer())
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  useEffect(() => {
    const unsub = subscribeToLogs((entry) => {
      setEntries((prev) => {
        const next = [...prev, entry]
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next
      })
    })
    return unsub
  }, [])

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // Disable auto-scroll if user scrolled up
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30
    autoScrollRef.current = atBottom
  }, [])

  const handleClear = useCallback(() => {
    setEntries([])
  }, [])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`
  }

  return (
    <Box
      sx={{
        borderTop: `1px solid ${COLORS.border}`,
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Header bar — always visible, clickable to toggle */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '6px',
          py: '1px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: '#2d2d2d',
          minHeight: 18,
          '&:hover': { backgroundColor: '#333' },
        }}
      >
        <Typography sx={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>
          {expanded ? '▼' : '▶'} Console ({entries.length})
        </Typography>
        {expanded && (
          <Typography
            component="span"
            onClick={(e) => { e.stopPropagation(); handleClear() }}
            sx={{
              fontSize: 10,
              color: '#888',
              fontFamily: 'monospace',
              cursor: 'pointer',
              '&:hover': { color: '#ccc' },
            }}
          >
            clear
          </Typography>
        )}
      </Box>

      {/* Log entries — shown when expanded */}
      {expanded && (
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            height: 120,
            overflow: 'auto',
            px: '6px',
            py: '2px',
            fontFamily: 'monospace',
            fontSize: 10,
            lineHeight: 1.5,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#555', borderRadius: 3 },
          }}
        >
          {entries.map((entry, i) => (
            <Box key={i} sx={{ display: 'flex', gap: '6px', color: LEVEL_COLORS[entry.level] ?? '#ccc' }}>
              <span style={{ color: '#666', flexShrink: 0 }}>{formatTime(entry.timestamp)}</span>
              <span style={{ color: LEVEL_COLORS[entry.level], flexShrink: 0, width: 36 }}>
                {entry.level.toUpperCase().padEnd(5)}
              </span>
              <span style={{ color: entry.level === 'error' ? '#ff6b6b' : entry.level === 'warn' ? '#ffd93d' : '#ccc', wordBreak: 'break-all' }}>
                {entry.message}
              </span>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
