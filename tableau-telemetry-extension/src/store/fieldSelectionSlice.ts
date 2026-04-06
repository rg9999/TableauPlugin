import type { StateCreator } from 'zustand'
import type { TreeNode, FieldNode } from '../models/fieldHierarchy'

export interface FieldSelectionSlice {
  selectedFields: FieldNode[]
  fieldHierarchy: TreeNode | null
  fieldLoadError: string | null
  /** Maps messageType (first path segment) → Tableau worksheet name */
  messageTypeToWorksheet: Record<string, string>

  addField: (field: FieldNode) => void
  removeField: (fieldPath: string) => void
  addFields: (fields: FieldNode[]) => void
  removeFieldsByMessageType: (messageType: string) => void
  setFieldHierarchy: (hierarchy: TreeNode | null) => void
  setFieldLoadError: (error: string | null) => void
  clearAllFields: () => void
  /** Register which worksheet provides a set of message types */
  registerWorksheetMessageTypes: (worksheetName: string, messageTypes: string[]) => void
}

export const createFieldSelectionSlice: StateCreator<FieldSelectionSlice> = (set) => ({
  selectedFields: [],
  fieldHierarchy: null,
  fieldLoadError: null,
  messageTypeToWorksheet: {},

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

  setFieldHierarchy: (hierarchy) => set({ fieldHierarchy: hierarchy, fieldLoadError: null }),

  setFieldLoadError: (error) => set({ fieldLoadError: error }),

  clearAllFields: () => set({ selectedFields: [] }),

  registerWorksheetMessageTypes: (worksheetName, messageTypes) =>
    set((state) => {
      const updated = { ...state.messageTypeToWorksheet }
      for (const mt of messageTypes) {
        updated[mt] = worksheetName
      }
      return { messageTypeToWorksheet: updated }
    }),
})
