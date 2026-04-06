import { useCallback, useEffect, useRef, useState } from 'react'
import type { IHeaderParams } from 'ag-grid-community'

/**
 * Custom AG Grid header component that renders column names as plain DOM
 * elements with inline styles. This completely bypasses the balham theme's
 * CSS/font pipeline which breaks in Tableau Desktop's embedded Chromium
 * (the agGridBalham icon font renders as black boxes and the CSS variable
 * chain for --ag-header-foreground-color is broken in the light variant).
 */
export default function CustomHeader(props: IHeaderParams) {
  const { displayName, column, enableSorting, enableMenu, api, showColumnMenu } = props
  const [sortState, setSortState] = useState<'asc' | 'desc' | null>(null)
  const [filterActive, setFilterActive] = useState(false)
  const menuButtonRef = useRef<HTMLSpanElement>(null)

  // Sync sort state from AG Grid
  useEffect(() => {
    const updateSort = () => {
      const colState = api.getColumnState().find((c) => c.colId === column.getColId())
      setSortState(colState?.sort === 'asc' ? 'asc' : colState?.sort === 'desc' ? 'desc' : null)
    }
    updateSort()
    api.addEventListener('sortChanged', updateSort)
    return () => {
      api.removeEventListener('sortChanged', updateSort)
    }
  }, [api, column])

  // Track whether this column has an active filter
  useEffect(() => {
    const updateFilter = () => {
      setFilterActive(api.isColumnFilterPresent() && column.isFilterActive())
    }
    updateFilter()
    api.addEventListener('filterChanged', updateFilter)
    return () => {
      api.removeEventListener('filterChanged', updateFilter)
    }
  }, [api, column])

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!enableSorting) return
      // Don't sort when clicking the menu button
      if ((event.target as HTMLElement).closest('[data-menu-btn]')) return
      // Cycle: none → asc → desc → none
      const nextSort = sortState === null ? 'asc' : sortState === 'asc' ? 'desc' : null
      api.applyColumnState({
        state: [{ colId: column.getColId(), sort: nextSort }],
        defaultState: { sort: null },
      })
    },
    [enableSorting, sortState, api, column],
  )

  const handleMenuClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      if (showColumnMenu) {
        showColumnMenu(menuButtonRef.current ?? undefined)
      }
    },
    [showColumnMenu],
  )

  const sortArrow =
    sortState === 'asc'
      ? ' ▲'
      : sortState === 'desc'
        ? ' ▼'
        : ''

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '0 4px 0 8px',
        cursor: enableSorting ? 'pointer' : 'default',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Column name */}
      <span
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
        }}
      >
        {displayName}
      </span>

      {/* Sort indicator */}
      {sortArrow && (
        <span
          style={{
            color: '#4E79A7',
            fontSize: '10px',
            marginLeft: '2px',
            flexShrink: 0,
          }}
        >
          {sortArrow}
        </span>
      )}

      {/* Filter / menu button */}
      {enableMenu && (
        <span
          ref={menuButtonRef}
          data-menu-btn="true"
          onClick={handleMenuClick}
          style={{
            marginLeft: '4px',
            flexShrink: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '3px',
            color: filterActive ? '#4E79A7' : '#999',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '11px',
            lineHeight: 1,
          }}
          title="Filter"
        >
          {/* Simple funnel icon using CSS borders */}
          <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 1h10L7.5 5.5V10l-3 1V5.5z"
              fill={filterActive ? '#4E79A7' : '#999'}
            />
          </svg>
        </span>
      )}
    </div>
  )
}
