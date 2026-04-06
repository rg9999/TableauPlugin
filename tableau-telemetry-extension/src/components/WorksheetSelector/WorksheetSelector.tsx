import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { useStore } from '../../store/store'
import { COLORS, SPACING, TYPOGRAPHY, MESSAGE_TYPE_COLORS } from '../../theme/designTokens'

/**
 * Displays a list of available worksheets (message types) on the dashboard.
 * The user picks which one to explore, then fields populate from that worksheet.
 */
export default function WorksheetSelector() {
  const availableWorksheets = useStore((state) => state.availableWorksheets)
  const selectedWorksheet = useStore((state) => state.selectedWorksheet)
  const worksheetError = useStore((state) => state.worksheetError)
  const setSelectedWorksheet = useStore((state) => state.setSelectedWorksheet)

  if (worksheetError) {
    return (
      <Box sx={{ p: SPACING.lg, textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box>
          <Typography sx={{ fontSize: 32, mb: SPACING.sm + 'px' }}>
            &#x26A0;
          </Typography>
          <Typography
            sx={{
              color: '#e53935',
              fontWeight: 600,
              fontSize: TYPOGRAPHY.panelHeader.size,
              mb: SPACING.sm + 'px',
            }}
          >
            No Worksheets Found
          </Typography>
          <Typography sx={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.treeNode.size, lineHeight: 1.5 }}>
            {worksheetError}
          </Typography>
        </Box>
      </Box>
    )
  }

  if (availableWorksheets.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: SPACING.sm + 'px' }}>
        <CircularProgress size={24} sx={{ color: COLORS.accent }} />
        <Typography sx={{ color: COLORS.textMuted, fontSize: TYPOGRAPHY.treeNode.size }}>
          Connecting to Tableau...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          px: SPACING.md + 'px',
          py: SPACING.sm + 'px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Typography
          sx={{
            fontSize: TYPOGRAPHY.panelHeader.size,
            fontWeight: TYPOGRAPHY.panelHeader.weight,
            color: COLORS.textPrimary,
          }}
        >
          Select Message Type
        </Typography>
        <Typography sx={{ fontSize: TYPOGRAPHY.statusBar.size, color: COLORS.textMuted, mt: '2px' }}>
          {availableWorksheets.length} worksheet{availableWorksheets.length !== 1 ? 's' : ''} available
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense disablePadding>
          {availableWorksheets.map((ws, idx) => {
            const isSelected = ws.name === selectedWorksheet
            const stripeColor = MESSAGE_TYPE_COLORS[idx % MESSAGE_TYPE_COLORS.length]

            return (
              <ListItemButton
                key={ws.name}
                selected={isSelected}
                onClick={() => setSelectedWorksheet(ws.name)}
                sx={{
                  borderLeft: `4px solid ${stripeColor}`,
                  py: SPACING.sm + 'px',
                  px: SPACING.md + 'px',
                  '&.Mui-selected': {
                    backgroundColor: `${stripeColor}15`,
                    '&:hover': {
                      backgroundColor: `${stripeColor}25`,
                    },
                  },
                  '&:hover': {
                    backgroundColor: `${stripeColor}10`,
                  },
                }}
              >
                <ListItemText
                  primary={ws.name}
                  primaryTypographyProps={{
                    fontSize: TYPOGRAPHY.treeNode.size,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? COLORS.accent : COLORS.textPrimary,
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>
    </Box>
  )
}
