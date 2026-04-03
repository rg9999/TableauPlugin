import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { muiTheme } from './theme/muiTheme'
import './theme/agGridTheme'
import './theme/agGridStyles.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import PanelLayout from './components/PanelLayout/PanelLayout'

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <PanelLayout />
    </ThemeProvider>
  )
}

export default App
