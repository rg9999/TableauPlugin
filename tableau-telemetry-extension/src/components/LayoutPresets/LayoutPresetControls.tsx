import { useState, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import TextField from '@mui/material/TextField'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import SaveIcon from '@mui/icons-material/Save'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useStore } from '../../store/store'
import { tableauAdapter } from '../../services/tableauAdapter'
import { logger } from '../../utils/logger'
import { COLORS, SPACING } from '../../theme/designTokens'
import { resolveFieldNodes } from '../../utils/resolveFieldNodes'
import type { ExtensionSettings, LayoutPreset } from '../../models/extensionSettings'

/** Generate a short unique ID for presets */
function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function LayoutPresetControls() {
  const selectedFields = useStore((s) => s.selectedFields)
  const treePanelWidth = useStore((s) => s.treePanelWidth)
  const treePanelCollapsed = useStore((s) => s.treePanelCollapsed)
  const detailPanelWidth = useStore((s) => s.detailPanelWidth)
  const detailPanelCollapsed = useStore((s) => s.detailPanelCollapsed)
  const selectedWorksheet = useStore((s) => s.selectedWorksheet)
  const sortModel = useStore((s) => s.sortModel)
  const filterModel = useStore((s) => s.filterModel)
  const layoutPresets = useStore((s) => s.layoutPresets)
  const addLayoutPreset = useStore((s) => s.addLayoutPreset)
  const deleteLayoutPreset = useStore((s) => s.deleteLayoutPreset)

  // Restore actions
  const addFields = useStore((s) => s.addFields)
  const clearAllFields = useStore((s) => s.clearAllFields)
  const setTreePanelWidth = useStore((s) => s.setTreePanelWidth)
  const setTreePanelCollapsed = useStore((s) => s.setTreePanelCollapsed)
  const setDetailPanelWidth = useStore((s) => s.setDetailPanelWidth)
  const setDetailPanelCollapsed = useStore((s) => s.setDetailPanelCollapsed)
  const setSelectedWorksheet = useStore((s) => s.setSelectedWorksheet)
  const setSortModel = useStore((s) => s.setSortModel)
  const setFilterModel = useStore((s) => s.setFilterModel)
  const fieldHierarchy = useStore((s) => s.fieldHierarchy)

  // Save popover state
  const [saveAnchorEl, setSaveAnchorEl] = useState<HTMLElement | null>(null)
  const [presetName, setPresetName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Load menu state
  const [loadAnchorEl, setLoadAnchorEl] = useState<HTMLElement | null>(null)

  const handleOpenSave = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSaveAnchorEl(event.currentTarget)
    setPresetName('')
    // Focus input after popover opens
    setTimeout(() => nameInputRef.current?.focus(), 100)
  }, [])

  const handleCloseSave = useCallback(() => {
    setSaveAnchorEl(null)
    setPresetName('')
  }, [])

  const handleSavePreset = useCallback(async () => {
    const name = presetName.trim()
    if (!name) return

    const settings: ExtensionSettings = {
      selectedFieldPaths: selectedFields.map((f) => f.dottedPath),
      columnOrder: selectedFields.map((f) => f.dottedPath),
      treePanelWidth,
      treePanelCollapsed,
      detailPanelWidth,
      detailPanelCollapsed,
      selectedWorksheet,
      sortModel: sortModel.map((s) => ({ colId: s.colId, sort: s.sort as string })),
      filterModel,
      version: 2,
    }

    const preset: LayoutPreset = {
      id: makeId(),
      name,
      createdAt: new Date().toISOString(),
      settings,
    }

    addLayoutPreset(preset)

    // Persist to Tableau
    try {
      const allPresets = [...layoutPresets, preset]
      await tableauAdapter.savePresets(allPresets)
      logger.info(`Saved layout preset "${name}"`)
    } catch (err) {
      logger.warn('Failed to persist preset', err)
    }

    handleCloseSave()
  }, [
    presetName, selectedFields, treePanelWidth, treePanelCollapsed,
    detailPanelWidth, detailPanelCollapsed, selectedWorksheet,
    sortModel, filterModel, addLayoutPreset, layoutPresets, handleCloseSave,
  ])

  const handleOpenLoad = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setLoadAnchorEl(event.currentTarget)
  }, [])

  const handleCloseLoad = useCallback(() => {
    setLoadAnchorEl(null)
  }, [])

  const handleLoadPreset = useCallback((preset: LayoutPreset) => {
    const s = preset.settings

    // Restore layout panels
    if (s.treePanelWidth != null) setTreePanelWidth(s.treePanelWidth)
    if (s.treePanelCollapsed != null) setTreePanelCollapsed(s.treePanelCollapsed)
    if (s.detailPanelWidth != null) setDetailPanelWidth(s.detailPanelWidth)
    if (s.detailPanelCollapsed != null) setDetailPanelCollapsed(s.detailPanelCollapsed)
    if (s.selectedWorksheet) setSelectedWorksheet(s.selectedWorksheet)
    if (s.sortModel) setSortModel(s.sortModel as { colId: string; sort: 'asc' | 'desc' }[])
    if (s.filterModel) setFilterModel(s.filterModel)

    // Restore field selections (requires hierarchy to resolve paths)
    if (fieldHierarchy && s.selectedFieldPaths?.length) {
      clearAllFields()
      const resolved = resolveFieldNodes(s.selectedFieldPaths, fieldHierarchy)
      if (resolved.length > 0) {
        addFields(resolved)
      }
    }

    logger.info(`Loaded layout preset "${preset.name}"`)
    handleCloseLoad()
  }, [
    fieldHierarchy, clearAllFields, addFields,
    setTreePanelWidth, setTreePanelCollapsed,
    setDetailPanelWidth, setDetailPanelCollapsed,
    setSelectedWorksheet, setSortModel, setFilterModel, handleCloseLoad,
  ])

  const handleDeletePreset = useCallback(async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteLayoutPreset(id)

    // Persist
    try {
      const remaining = layoutPresets.filter((p) => p.id !== id)
      await tableauAdapter.savePresets(remaining)
    } catch (err) {
      logger.warn('Failed to persist preset deletion', err)
    }
  }, [deleteLayoutPreset, layoutPresets])

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px` }}>
      {/* Save preset button */}
      <Button
        size="small"
        startIcon={<SaveIcon sx={{ fontSize: '14px !important' }} />}
        onClick={handleOpenSave}
        sx={{
          fontSize: 11,
          textTransform: 'none',
          minWidth: 0,
          px: 1,
          py: 0.25,
          color: COLORS.textSecondary,
          '&:hover': { color: COLORS.accent },
        }}
      >
        Save Layout
      </Button>

      {/* Save popover with name input */}
      <Popover
        open={Boolean(saveAnchorEl)}
        anchorEl={saveAnchorEl}
        onClose={handleCloseSave}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 220 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>
            Save Layout Preset
          </Typography>
          <TextField
            inputRef={nameInputRef}
            size="small"
            placeholder="Preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset() }}
            sx={{ '& .MuiInputBase-input': { fontSize: 12, py: 0.75 } }}
            autoFocus
          />
          <Button
            size="small"
            variant="contained"
            disabled={!presetName.trim()}
            onClick={handleSavePreset}
            sx={{ fontSize: 11, textTransform: 'none' }}
          >
            Save
          </Button>
        </Box>
      </Popover>

      {/* Load preset button */}
      <Button
        size="small"
        startIcon={<FolderOpenIcon sx={{ fontSize: '14px !important' }} />}
        onClick={handleOpenLoad}
        disabled={layoutPresets.length === 0}
        sx={{
          fontSize: 11,
          textTransform: 'none',
          minWidth: 0,
          px: 1,
          py: 0.25,
          color: COLORS.textSecondary,
          '&:hover': { color: COLORS.accent },
        }}
      >
        Load{layoutPresets.length > 0 ? ` (${layoutPresets.length})` : ''}
      </Button>

      {/* Load menu with preset list */}
      <Menu
        open={Boolean(loadAnchorEl)}
        anchorEl={loadAnchorEl}
        onClose={handleCloseLoad}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Typography
          variant="body2"
          sx={{ px: 2, py: 0.5, fontWeight: 600, fontSize: 12, color: COLORS.textSecondary }}
        >
          Load Layout Preset
        </Typography>
        <Divider />
        {layoutPresets.map((preset) => (
          <MenuItem
            key={preset.id}
            onClick={() => handleLoadPreset(preset)}
            sx={{ fontSize: 12, py: 0.5 }}
          >
            <ListItemText
              primary={preset.name}
              secondary={`${preset.settings.selectedFieldPaths.length} fields`}
              primaryTypographyProps={{ fontSize: 12 }}
              secondaryTypographyProps={{ fontSize: 10 }}
            />
            <ListItemIcon sx={{ minWidth: 28 }}>
              <IconButton
                size="small"
                onClick={(e) => handleDeletePreset(preset.id, e)}
                sx={{ p: 0.25 }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
              </IconButton>
            </ListItemIcon>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

