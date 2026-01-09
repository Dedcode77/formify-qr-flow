import { create } from 'zustand';
import { FormField, Form } from '@/types/form';

interface FormStore {
  forms: Form[];
  currentForm: Form | null;
  fields: FormField[];
  selectedFieldId: string | null;
  
  // Actions
  setCurrentForm: (form: Form | null) => void;
  addField: (field: FormField) => void;
  removeField: (fieldId: string) => void;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  reorderFields: (fields: FormField[]) => void;
  selectField: (fieldId: string | null) => void;
  clearFields: () => void;
}

export const useFormStore = create<FormStore>((set) => ({
  forms: [],
  currentForm: null,
  fields: [],
  selectedFieldId: null,
  
  setCurrentForm: (form) => set({ currentForm: form, fields: form?.fields || [] }),
  
  addField: (field) => set((state) => ({ 
    fields: [...state.fields, field] 
  })),
  
  removeField: (fieldId) => set((state) => ({
    fields: state.fields.filter((f) => f.id !== fieldId),
    selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
  })),
  
  updateField: (fieldId, updates) => set((state) => ({
    fields: state.fields.map((f) => 
      f.id === fieldId ? { ...f, ...updates } : f
    ),
  })),
  
  reorderFields: (fields) => set({ fields }),
  
  selectField: (fieldId) => set({ selectedFieldId: fieldId }),
  
  clearFields: () => set({ fields: [], selectedFieldId: null }),
}));
