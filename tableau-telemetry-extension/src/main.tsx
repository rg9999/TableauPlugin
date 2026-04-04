/**
 * main.tsx — Vite entry point for the Tableau Telemetry Explorer extension.
 *
 * Initialization sequence:
 *   1. Call tableauAdapter.initialize() to connect to the Tableau Extensions API
 *      (gracefully logs a warning if running outside Tableau — dev mode)
 *   2. Mount the React app into the #root DOM element
 *   3. Render App in StrictMode for development checks
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { tableauAdapter } from './services/tableauAdapter'
import { logger } from './utils/logger'

const init = async () => {
  try {
    await tableauAdapter.initialize()
  } catch (err) {
    logger.error('Failed to initialize Tableau extension:', err)
  }

  const container = document.getElementById('root')
  if (!container) {
    throw new Error('Root mount point #root not found in DOM')
  }

  const root = createRoot(container)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

init()
