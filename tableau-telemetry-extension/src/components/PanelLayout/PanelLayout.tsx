import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../../theme/designTokens'
import ResizeHandle from './ResizeHandle'

interface PanelLayoutProps {
  treeContent?: ReactNode
  gridContent?: ReactNode
  detailContent?: ReactNode
  detailOpen?: boolean
}

export default function PanelLayout({
  treeContent,
  gridContent,
  detailContent,
  detailOpen = false,
}: PanelLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [treeWidth, setTreeWidth] = useState<number>(LAYOUT.treePanelWidth)
  const [collapsed, setCollapsed] = useState(false)
  const [prevWidth, setPrevWidth] = useState<number>(LAYOUT.treePanelWidth)
  const [containerWidth, setContainerWidth] = useState(1000)
  // Default to a reasonable size so features work before ResizeObserver fires
  const [containerHeight, setContainerHeight] = useState(500)

  // Observe container size for zone-responsive behavior
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerWidth(width)
        setContainerHeight(height)
      }
    })

    observer.observe(el)
    // Set initial size only if element has real dimensions
    if (el.clientWidth > 0) setContainerWidth(el.clientWidth)
    if (el.clientHeight > 0) setContainerHeight(el.clientHeight)

    return () => observer.disconnect()
  }, [])

  // Zone-responsive: auto-collapse tree for narrow zones
  // Only apply when we have a real measurement (not the initial default)
  const hasMeasured = useRef(false)
  useEffect(() => {
    if (!hasMeasured.current) {
      // Skip first render — wait for ResizeObserver to provide real size
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        hasMeasured.current = true
      } else {
        return
      }
    }
    if (containerWidth < 600) {
      setCollapsed(true)
    }
    // Don't auto-expand when zone grows — user may have collapsed intentionally
  }, [containerWidth])

  const handleResize = useCallback(
    (deltaX: number) => {
      if (collapsed) return
      setTreeWidth((w) => {
        const newWidth = Math.max(120, Math.min(w + deltaX, containerWidth * 0.5))
        return newWidth
      })
    },
    [collapsed, containerWidth],
  )

  const handleCollapseToggle = useCallback(() => {
    if (collapsed) {
      setCollapsed(false)
      setTreeWidth(prevWidth)
    } else {
      setPrevWidth(treeWidth)
      setCollapsed(true)
    }
  }, [collapsed, prevWidth, treeWidth])

  const detailDisabled = containerHeight < 300
  const showDetail = detailOpen && !detailDisabled

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: COLORS.background,
      }}
      data-testid="panel-layout"
    >
      {/* Main area: tree + resize handle + grid */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Tree panel */}
        {collapsed ? (
          <Box
            onClick={handleCollapseToggle}
            sx={{
              width: LAYOUT.treePanelCollapsedWidth,
              minWidth: LAYOUT.treePanelCollapsedWidth,
              backgroundColor: COLORS.surface,
              borderRight: `1px solid ${COLORS.border}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: `${SPACING.sm}px`,
            }}
            data-testid="tree-panel-collapsed"
          >
            <Typography
              sx={{
                writingMode: 'vertical-lr',
                fontSize: TYPOGRAPHY.panelHeader.size,
                fontWeight: TYPOGRAPHY.panelHeader.weight,
                color: COLORS.accent,
                letterSpacing: '1px',
              }}
            >
              ▶ Fields
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              width: treeWidth,
              minWidth: treeWidth,
              backgroundColor: COLORS.surface,
              borderRight: 'none',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            data-testid="tree-panel"
          >
            {/* Tree panel header with collapse button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: `${SPACING.sm}px`,
                py: `${SPACING.xs}px`,
                borderBottom: `1px solid ${COLORS.border}`,
                minHeight: 28,
              }}
            >
              <Typography
                sx={{
                  fontSize: TYPOGRAPHY.panelHeader.size,
                  fontWeight: TYPOGRAPHY.panelHeader.weight,
                  color: COLORS.textPrimary,
                }}
              >
                Fields
              </Typography>
              <IconButton
                size="small"
                onClick={handleCollapseToggle}
                aria-label="collapse tree panel"
                data-testid="tree-collapse-button"
                sx={{ p: 0.25 }}
              >
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* Tree content */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              {treeContent ?? (
                <Box sx={{ padding: `${SPACING.md}px`, color: COLORS.textMuted }}>
                  No fields loaded
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Resize handle — only when tree is expanded */}
        {!collapsed && (
          <ResizeHandle onResize={handleResize} onDoubleClick={handleCollapseToggle} />
        )}

        {/* Grid + detail area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Grid area */}
          <Box sx={{ flex: 1, overflow: 'hidden' }} data-testid="grid-panel">
            {gridContent ?? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: COLORS.textMuted,
                }}
                data-testid="empty-state"
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 32, marginBottom: `${SPACING.sm}px` }}>
                    ⬅ ╌ ╌ ▦
                  </Typography>
                  <Typography sx={{ fontSize: TYPOGRAPHY.emptyState.size }}>
                    Drag fields from the tree to start exploring
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Detail panel — only when open and zone is tall enough */}
          {showDetail && (
            <Box
              sx={{
                height: LAYOUT.detailPanelHeight,
                minHeight: LAYOUT.detailPanelHeight,
                borderTop: `2px solid ${COLORS.border}`,
                backgroundColor: COLORS.surface,
                overflow: 'auto',
              }}
              data-testid="detail-panel"
            >
              {detailContent ?? (
                <Box sx={{ padding: `${SPACING.md}px`, color: COLORS.textMuted }}>
                  Row detail
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Status bar */}
      <Box
        sx={{
          height: LAYOUT.statusBarHeight,
          minHeight: LAYOUT.statusBarHeight,
          backgroundColor: COLORS.surface,
          borderTop: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${SPACING.md}px`,
          fontSize: TYPOGRAPHY.statusBar.size,
          color: COLORS.textSecondary,
        }}
        data-testid="status-bar"
      >
        Ready
      </Box>
    </Box>
  )
}
