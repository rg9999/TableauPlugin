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
