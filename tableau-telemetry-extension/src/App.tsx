import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { muiTheme } from './theme/muiTheme'
import './theme/agGridTheme'
import './theme/agGridStyles.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div>Tableau Telemetry Extension</div>
    </ThemeProvider>
  )
}

export default App
