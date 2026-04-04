import { useState, useCallback, memo } from 'react'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Collapse from '@mui/material/Collapse'
import Checkbox from '@mui/material/Checkbox'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useStore } from '../../store/store'
import type { TreeNode } from '../../models/fieldHierarchy'
import { TYPOGRAPHY, SPACING, COLORS } from '../../theme/designTokens'

interface TreeNodeItemProps {
  node: TreeNode
  depth: number
}

const TreeNodeItem = memo(function TreeNodeItem({ node, depth }: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const selectedFields = useStore((state) => state.selectedFields)
  const addField = useStore((state) => state.addField)
  const removeField = useStore((state) => state.removeField)

  const isLeaf = node.isField && node.children.length === 0
  const isBranch = node.children.length > 0
  const isSelected = isLeaf && selectedFields.some((f) => f.dottedPath === node.dottedPath)

  const handleToggle = useCallback(() => {
    if (isBranch) {
      setIsExpanded((prev) => !prev)
    }
  }, [isBranch])

  const handleFieldSelect = useCallback(() => {
    if (!isLeaf) return
    if (isSelected) {
      removeField(node.dottedPath)
    } else {
      addField({
        shortName: node.name,
        dottedPath: node.dottedPath,
        messageType: node.messageType,
        dataType: 'string', // default; actual type not stored on TreeNode
      })
    }
  }, [isLeaf, isSelected, node, addField, removeField])

  return (
    <>
      <ListItemButton
        onClick={isBranch ? handleToggle : handleFieldSelect}
        sx={{
          pl: SPACING.sm + depth * SPACING.lg,
          py: 0.25,
          minHeight: 28,
        }}
        dense
      >
        {isBranch && (
          <ListItemIcon sx={{ minWidth: 24 }}>
            {isExpanded ? (
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            )}
          </ListItemIcon>
        )}

        {isLeaf && (
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Checkbox
              edge="start"
              checked={isSelected}
              size="small"
              tabIndex={-1}
              disableRipple
              onClick={(e) => {
                e.stopPropagation()
                handleFieldSelect()
              }}
              sx={{ p: 0.25 }}
            />
          </ListItemIcon>
        )}

        {isLeaf ? (
          <Tooltip title={node.dottedPath} placement="right" enterDelay={500}>
            <ListItemText
              primary={node.name}
              primaryTypographyProps={{
                fontSize: TYPOGRAPHY.treeNode.size,
                fontWeight: isSelected ? TYPOGRAPHY.treeNodeSelected.weight : TYPOGRAPHY.treeNode.weight,
                noWrap: true,
              }}
              secondary={node.dottedPath}
              secondaryTypographyProps={{
                fontSize: 10,
                noWrap: true,
                sx: { color: COLORS.textMuted },
              }}
            />
          </Tooltip>
        ) : (
          <ListItemText
            primary={node.name}
            primaryTypographyProps={{
              fontSize: TYPOGRAPHY.treeNode.size,
              fontWeight: 600,
              noWrap: true,
            }}
            sx={{ ml: !isBranch ? 3 : 0 }}
          />
        )}
      </ListItemButton>

      {isBranch && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map((child) => (
              <TreeNodeItem key={child.dottedPath} node={child} depth={depth + 1} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
})

export default function TreeSelector() {
  const fieldHierarchy = useStore((state) => state.fieldHierarchy)

  if (!fieldHierarchy) {
    return (
      <Box sx={{ p: SPACING.md, color: COLORS.textMuted, fontSize: TYPOGRAPHY.treeNode.fontSize }}>
        Loading fields...
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        bgcolor: COLORS.background,
      }}
    >
      <List component="nav" dense disablePadding>
        {fieldHierarchy.children.map((node) => (
          <TreeNodeItem key={node.dottedPath} node={node} depth={0} />
        ))}
      </List>
    </Box>
  )
}
