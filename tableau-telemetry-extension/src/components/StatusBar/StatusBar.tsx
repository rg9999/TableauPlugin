/**
 * StatusBar.tsx — Fixed 24px bar at the bottom showing grid state and refresh status.
 *
 * Displays (left to right):
 *   - Row count: "{N} rows"
 *   - Message type count: "{N} message types"
 *   - New row indicator: "+{N} new" in green (when useLiveRefresh finds new rows)
 *   - Refresh dot: green (active), orange (1-2 failures), red (3+ failures)
 *   - Last refresh time: "just now", "Xs ago", "Xm ago", or "never"
 *   - Error message: shown in red after 3 consecutive refresh failures
 *   - Version: "v1.0.X" right-aligned (injected at build time via __APP_VERSION__)
 */
import { useMemo } from 'react'
import Box from '@mui/material/Box'
import { useStore } from '../../store/store'
import { COLORS, SPACING, TYPOGRAPHY, SEMANTIC } from '../../theme/designTokens'

function formatTimeSince(date: Date | null): string {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

export default function StatusBar() {
  const gridData = useStore((state) => state.gridData)
  const isRefreshing = useStore((state) => state.isRefreshing)
  const lastRefreshTime = useStore((state) => state.lastRefreshTime)
  const newRowCount = useStore((state) => state.newRowCount)
  const consecutiveFailures = useStore((state) => state.consecutiveFailures)
  const errorMessage = useStore((state) => state.errorMessage)

  const messageTypeCount = useMemo(() => {
    const types = new Set(gridData.map((r) => r.messageType))
    return types.size
  }, [gridData])

  const refreshIndicatorColor = consecutiveFailures >= 3
    ? SEMANTIC.error
    : consecutiveFailures > 0
      ? SEMANTIC.warning
      : '#4CAF50' // green

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${SPACING.md}px`,
        width: '100%',
        fontSize: TYPOGRAPHY.statusBar.size,
        color: COLORS.textSecondary,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Row count */}
      <span>{gridData.length} rows</span>

      <span>|</span>

      {/* Message type count */}
      <span>{messageTypeCount} message types</span>

      {/* New row indicator */}
      {newRowCount > 0 && (
        <>
          <span>|</span>
          <span style={{ color: '#4CAF50', fontWeight: 600 }}>+{newRowCount} new</span>
        </>
      )}

      <span>|</span>

      {/* Refresh status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px` }}>
        {/* Refresh dot indicator */}
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: refreshIndicatorColor,
            animation: isRefreshing ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.3 },
            },
          }}
        />
        <span>
          Last refresh: {formatTimeSince(lastRefreshTime)}
          {consecutiveFailures > 0 && consecutiveFailures < 3 && (
            <span style={{ color: SEMANTIC.warning }}> — retry failed</span>
          )}
        </span>
      </Box>

      {/* Persistent error warning */}
      {consecutiveFailures >= 3 && (
        <>
          <span>|</span>
          <span style={{ color: SEMANTIC.error, fontWeight: 600 }}>
            Refresh error: {errorMessage ?? 'Connection lost'}
          </span>
        </>
      )}

      {/* Version — pushed to the right */}
      <Box sx={{ ml: 'auto', color: COLORS.textMuted }}>
        v{__APP_VERSION__}
      </Box>
    </Box>
  )
}
