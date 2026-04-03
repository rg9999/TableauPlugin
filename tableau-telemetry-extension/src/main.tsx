import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

declare const tableau:
  | {
      extensions: {
        initializeAsync: () => Promise<void>
      }
    }
  | undefined

const init = async () => {
  try {
    if (typeof tableau !== 'undefined') {
      await tableau.extensions.initializeAsync()
    }
  } catch (err) {
    console.error('Failed to initialize Tableau extension:', err)
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
