/**
 * fieldSelectionSlice.ts — Zustand slice for tree hierarchy and field selection state.
 *
 * Manages which fields the analyst has selected (via tree checkboxes or drag-and-drop)
 * and the parsed field hierarchy. This is the primary state that drives both the
 * TreeSelector (checkmarks) and GridArea (column definitions).
 *
 * State:  selectedFields (FieldNode[]), fieldHierarchy (TreeNode | null)
 * Actions: addField, removeField, addFields (bulk), removeFieldsByMessageType,
 *          setFieldHierarchy, clearAllFields
 */
import type { StateCreator } from 'zustand'
import type { TreeNode, FieldNode } from '../models/fieldHierarchy'

export interface FieldSelectionSlice {
  selectedFields: FieldNode[]
  fieldHierarchy: TreeNode | null

  addField: (field: FieldNode) => void
  removeField: (fieldPath: string) => void
  addFields: (fields: FieldNode[]) => void
  removeFieldsByMessageType: (messageType: string) => void
  setFieldHierarchy: (hierarchy: TreeNode) => void
  clearAllFields: () => void
}

export const createFieldSelectionSlice: StateCreator<FieldSelectionSlice> = (set) => ({
  selectedFields: [],
  fieldHierarchy: null,

  addField: (field) =>
    set((state) => {
      if (state.selectedFields.some((f) => f.dottedPath === field.dottedPath)) {
        return state // duplicate — no change
      }
      return { selectedFields: [...state.selectedFields, field] }
    }),

  removeField: (fieldPath) =>
    set((state) => ({
      selectedFields: state.selectedFields.filter((f) => f.dottedPath !== fieldPath),
    })),

  addFields: (fields) =>
    set((state) => {
      const existingPaths = new Set(state.selectedFields.map((f) => f.dottedPath))
      const newFields = fields.filter((f) => !existingPaths.has(f.dottedPath))
      if (newFields.length === 0) return state
      return { selectedFields: [...state.selectedFields, ...newFields] }
    }),

  removeFieldsByMessageType: (messageType) =>
    set((state) => ({
      selectedFields: state.selectedFields.filter((f) => f.messageType !== messageType),
    })),

  setFieldHierarchy: (hierarchy) => set({ fieldHierarchy: hierarchy }),

  clearAllFields: () => set({ selectedFields: [] }),
})
