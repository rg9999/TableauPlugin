import { createRoot } from 'react-dom/client'
import App from './App'

declare const tableau: {
  extensions: {
    initializeAsync: () => Promise<void>
  }
} | undefined

const init = async () => {
  try {
    if (typeof tableau !== 'undefined') {
      await tableau.extensions.initializeAsync()
    }
  } catch (err) {
    console.error('Failed to initialize Tableau extension:', err)
  }

  const root = createRoot(document.getElementById('root')!)
  root.render(<App />)
}

init()
