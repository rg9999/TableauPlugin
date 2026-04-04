import type { StateCreator } from 'zustand'
import type { TreeNode, FieldNode } from '../models/fieldHierarchy'

export interface FieldSelectionSlice {
  selectedFields: FieldNode[]
  fieldHierarchy: TreeNode | null

  addField: (field: FieldNode) => void
  removeField: (fieldPath: string) => void
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

  setFieldHierarchy: (hierarchy) => set({ fieldHierarchy: hierarchy }),

  clearAllFields: () => set({ selectedFields: [] }),
})
