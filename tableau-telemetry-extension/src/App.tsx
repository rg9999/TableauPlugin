import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { muiTheme } from './theme/muiTheme'
import './theme/agGridTheme'
import './theme/agGridStyles.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-balham.css'
import PanelLayout from './components/PanelLayout/PanelLayout'
import TreeSelector from './components/TreeSelector/TreeSelector'
import { useFieldHierarchy } from './hooks/useFieldHierarchy'

function App() {
  useFieldHierarchy()

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <PanelLayout treeContent={<TreeSelector />} />
    </ThemeProvider>
  )
}

export default App
