import type { StateCreator } from 'zustand'
import type { LayoutPreset } from '../models/extensionSettings'
import { LAYOUT } from '../theme/designTokens'

export interface LayoutSlice {
  /** Tree panel width in pixels */
  treePanelWidth: number
  /** Whether tree panel is collapsed */
  treePanelCollapsed: boolean
  /** Detail panel width in pixels */
  detailPanelWidth: number
  /** Whether detail panel is collapsed */
  detailPanelCollapsed: boolean
  /** Saved named presets */
  layoutPresets: LayoutPreset[]

  setTreePanelWidth: (width: number) => void
  setTreePanelCollapsed: (collapsed: boolean) => void
  setDetailPanelWidth: (width: number) => void
  setDetailPanelCollapsed: (collapsed: boolean) => void
  setLayoutPresets: (presets: LayoutPreset[]) => void
  addLayoutPreset: (preset: LayoutPreset) => void
  deleteLayoutPreset: (id: string) => void
}

export const createLayoutSlice: StateCreator<LayoutSlice> = (set) => ({
  treePanelWidth: LAYOUT.treePanelWidth,
  treePanelCollapsed: false,
  detailPanelWidth: LAYOUT.detailPanelWidth,
  detailPanelCollapsed: false,
  layoutPresets: [],

  setTreePanelWidth: (width) => set({ treePanelWidth: width }),
  setTreePanelCollapsed: (collapsed) => set({ treePanelCollapsed: collapsed }),
  setDetailPanelWidth: (width) => set({ detailPanelWidth: width }),
  setDetailPanelCollapsed: (collapsed) => set({ detailPanelCollapsed: collapsed }),
  setLayoutPresets: (presets) => set({ layoutPresets: presets }),
  addLayoutPreset: (preset) =>
    set((state) => ({ layoutPresets: [...state.layoutPresets, preset] })),
  deleteLayoutPreset: (id) =>
    set((state) => ({ layoutPresets: state.layoutPresets.filter((p) => p.id !== id) })),
})
