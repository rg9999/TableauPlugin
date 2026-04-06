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
  const { displayName, column, enableSorting, api } = props
  const [sortState, setSortState] = useState<'asc' | 'desc' | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)

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

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!enableSorting) return
      // Cycle: none → asc → desc → none
      const nextSort = sortState === null ? 'asc' : sortState === 'asc' ? 'desc' : null
      api.applyColumnState({
        state: [{ colId: column.getColId(), sort: nextSort }],
        defaultState: { sort: null },
      })
    },
    [enableSorting, sortState, api, column],
  )

  const sortArrow =
    sortState === 'asc'
      ? ' ▲'
      : sortState === 'desc'
        ? ' ▼'
        : ''

  return (
    <div
      ref={headerRef}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '0 8px',
        cursor: enableSorting ? 'pointer' : 'default',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          color: '#333333',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayName}
      </span>
      {sortArrow && (
        <span
          style={{
            color: '#4E79A7',
            fontSize: '10px',
            marginLeft: '4px',
            flexShrink: 0,
          }}
        >
          {sortArrow}
        </span>
      )}
    </div>
  )
}
