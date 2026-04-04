import { useState, memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { COLORS, SPACING } from '../../theme/designTokens'

interface DetailTreeViewProps {
  data: Record<string, unknown>
}

interface TreeEntryProps {
  name: string
  value: unknown
  depth: number
}

const TreeEntry = memo(function TreeEntry({ name, value, depth }: TreeEntryProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2)
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)
  const isExpandable = isObject || isArray

  const displayValue = isArray
    ? `[${value.length} items]`
    : isObject
      ? ''
      : String(value ?? '')

  return (
    <Box sx={{ pl: depth * SPACING.lg }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.25,
          gap: 0.5,
          minHeight: 22,
        }}
      >
        {isExpandable ? (
          <IconButton size="small" onClick={() => setIsExpanded((p) => !p)} sx={{ p: 0, width: 18, height: 18 }}>
            {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        ) : (
          <Box sx={{ width: 18 }} />
        )}

        <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, mr: 0.5 }}>
          {name}
        </Typography>

        {!isExpandable && (
          <Typography component="span" sx={{ fontSize: 12, color: COLORS.textSecondary }}>
            {displayValue}
          </Typography>
        )}

        {isArray && (
          <Typography component="span" sx={{ fontSize: 11, color: COLORS.textMuted }}>
            {displayValue}
          </Typography>
        )}
      </Box>

      {isExpandable && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {isObject &&
            Object.entries(value as Record<string, unknown>).map(([k, v]) => (
              <TreeEntry key={k} name={k} value={v} depth={depth + 1} />
            ))}
          {isArray &&
            (value as unknown[]).map((item, i) => (
              <TreeEntry key={i} name={`[${i}]`} value={item} depth={depth + 1} />
            ))}
        </Collapse>
      )}
    </Box>
  )
})

export default function DetailTreeView({ data }: DetailTreeViewProps) {
  return (
    <Box>
      {Object.entries(data).map(([key, value]) => (
        <TreeEntry key={key} name={key} value={value} depth={0} />
      ))}
    </Box>
  )
}
