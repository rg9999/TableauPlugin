/**
 * TreeSearchInput.tsx — Search/filter input displayed above the tree list.
 *
 * Controlled component: parent (TreeSelector) owns the search term state.
 * Typing filters the tree instantly (synchronous — no loading indicator).
 * Clear button (✕) resets the search and restores the full tree.
 */
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { SPACING, COLORS } from '../../theme/designTokens'

interface TreeSearchInputProps {
  value: string
  onChange: (value: string) => void
}

export default function TreeSearchInput({ value, onChange }: TreeSearchInputProps) {
  return (
    <TextField
      size="small"
      placeholder="Search fields..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      sx={{ px: SPACING.xs, pt: SPACING.xs, pb: SPACING.xs / 2 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: COLORS.textMuted }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange('')} edge="end" aria-label="clear search">
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { fontSize: 12 },
        },
      }}
    />
  )
}
