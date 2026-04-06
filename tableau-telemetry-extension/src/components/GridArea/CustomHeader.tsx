import { useCallback, useEffect, useRef, useState } from 'react'
import type { IHeaderParams } from 'ag-grid-community'

/**
 * Custom AG Grid header component that renders column names as plain DOM
 * elements with inline styles. This completely bypasses the balham theme's
 * CSS/font pipeline which breaks in Tableau Desktop's embedded Chromium.
 */
export default function CustomHeader(props: IHeaderParams) {
  const { displayName, column, enableSorting, enableMenu, api } = props
  const [sortState, setSortState] = useState<'asc' | 'desc' | null>(null)
  const [filterActive, setFilterActive] = useState(false)
  const menuButtonRef = useRef<HTMLDivElement>(null)

  // Check if filtering is enabled on this column
  const colDef = column.getColDef()
  const hasFilter = colDef.filter !== false && colDef.filter !== undefined

  // Sync sort state
  useEffect(() => {
    const updateSort = () => {
      const colState = api.getColumnState().find((c) => c.colId === column.getColId())
      setSortState(colState?.sort === 'asc' ? 'asc' : colState?.sort === 'desc' ? 'desc' : null)
    }
    updateSort()
    api.addEventListener('sortChanged', updateSort)
    return () => { api.removeEventListener('sortChanged', updateSort) }
  }, [api, column])

  // Track active filter state
  useEffect(() => {
    const updateFilter = () => {
      setFilterActive(column.isFilterActive())
    }
    updateFilter()
    api.addEventListener('filterChanged', updateFilter)
    return () => { api.removeEventListener('filterChanged', updateFilter) }
  }, [api, column])

  // Sort on header text click
  const handleSort = useCallback(
    (event: React.MouseEvent) => {
      if (!enableSorting) return
      const nextSort = sortState === null ? 'asc' : sortState === 'asc' ? 'desc' : null
      api.applyColumnState({
        state: [{ colId: column.getColId(), sort: nextSort }],
        defaultState: { sort: null },
      })
    },
    [enableSorting, sortState, api, column],
  )

  // Open filter/menu — try multiple AG Grid API approaches
  const handleMenuClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      const colId = column.getColId()
      try {
        // v35: showColumnMenu via header params
        if (enableMenu && (props as Record<string, unknown>).showColumnMenu) {
          ;(props as Record<string, unknown> & { showColumnMenu: (el?: HTMLElement) => void })
            .showColumnMenu(menuButtonRef.current ?? undefined)
          return
        }
      } catch { /* fallback below */ }
      try {
        // v35: open filter popup directly
        if ((api as Record<string, unknown>).showColumnFilter) {
          ;(api as Record<string, unknown> & { showColumnFilter: (colId: string) => void })
            .showColumnFilter(colId)
          return
        }
      } catch { /* fallback below */ }
      try {
        // Older API: menuFactory approach
        ;(api as Record<string, unknown> & { showColumnMenu: (colId: string) => void })
          .showColumnMenu(colId)
      } catch { /* no menu available */ }
    },
    [enableMenu, props, api, column],
  )

  const sortArrow =
    sortState === 'asc' ? ' ▲'
    : sortState === 'desc' ? ' ▼'
    : ''

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '0 4px 0 8px',
        userSelect: 'none',
        overflow: 'hidden',
        borderRight: '1px solid #d4d4d4',
        boxSizing: 'border-box',
      }}
    >
      {/* Column name — clickable for sort */}
      <span
        onClick={handleSort}
        style={{
          color: '#333333',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
          cursor: enableSorting ? 'pointer' : 'default',
        }}
      >
        {displayName}
        {sortArrow && (
          <span style={{ color: '#4E79A7', fontSize: '9px', marginLeft: '3px' }}>
            {sortArrow}
          </span>
        )}
      </span>

      {/* Filter button — always visible when column has filter */}
      {hasFilter && (
        <div
          ref={menuButtonRef}
          onClick={handleMenuClick}
          style={{
            marginLeft: '4px',
            flexShrink: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '3px',
            opacity: filterActive ? 1 : 0.4,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { if (!filterActive) e.currentTarget.style.opacity = '0.4' }}
          title={filterActive ? 'Filter active — click to edit' : 'Click to filter'}
        >
          {/* Funnel rendered as pure CSS triangle + rectangle — no SVG, no font */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `6px solid ${filterActive ? '#4E79A7' : '#888'}`,
            }} />
            <div style={{
              width: '3px',
              height: '4px',
              backgroundColor: filterActive ? '#4E79A7' : '#888',
              marginTop: '-1px',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
