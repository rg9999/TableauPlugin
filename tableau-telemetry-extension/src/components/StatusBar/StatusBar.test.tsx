import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from './StatusBar'
import { useStore } from '../../store/store'

describe('StatusBar', () => {
  beforeEach(() => {
    useStore.setState({
      gridData: [],
      isRefreshing: false,
      lastRefreshTime: null,
      newRowCount: 0,
      consecutiveFailures: 0,
      errorMessage: null,
    })
  })

  it('shows "0 rows" when grid is empty', () => {
    render(<StatusBar />)
    expect(screen.getByText('0 rows')).toBeInTheDocument()
  })

  it('shows row count and message type count', () => {
    useStore.setState({
      gridData: [
        { rowId: '1', timestamp: 't1', messageType: 'nav.gps' },
        { rowId: '2', timestamp: 't2', messageType: 'nav.gps' },
        { rowId: '3', timestamp: 't3', messageType: 'sensors.radar' },
      ],
    })
    render(<StatusBar />)
    expect(screen.getByText('3 rows')).toBeInTheDocument()
    expect(screen.getByText('2 message types')).toBeInTheDocument()
  })

  it('shows new row count in green when newRowCount > 0', () => {
    useStore.setState({ newRowCount: 5, gridData: [] })
    render(<StatusBar />)
    expect(screen.getByText('+5 new')).toBeInTheDocument()
  })

  it('shows "Last refresh: never" when no refresh has happened', () => {
    render(<StatusBar />)
    expect(screen.getByText(/Last refresh: never/)).toBeInTheDocument()
  })

  it('shows retry failed message on single failure', () => {
    useStore.setState({ consecutiveFailures: 1, errorMessage: 'timeout' })
    render(<StatusBar />)
    expect(screen.getByText(/retry failed/)).toBeInTheDocument()
  })

  it('shows persistent error after 3 consecutive failures', () => {
    useStore.setState({ consecutiveFailures: 3, errorMessage: 'Connection lost' })
    render(<StatusBar />)
    expect(screen.getByText(/Refresh error: Connection lost/)).toBeInTheDocument()
  })
})
