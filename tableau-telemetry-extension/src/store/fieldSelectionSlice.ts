import type { StateCreator } from 'zustand'

export interface FieldSelectionSlice {
  // TODO: State — selectedFields, fieldHierarchy
  // TODO: Actions — addField, removeField, setFieldHierarchy, clearAllFields
}

export const createFieldSelectionSlice: StateCreator<FieldSelectionSlice> = () => ({
  // Empty skeleton — populated in Epic 2
})
