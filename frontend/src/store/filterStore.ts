import { create } from 'zustand';
import { FilterState } from '../types';

interface FilterStoreState {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  resetFilters: () => void;
  setFilters: (newFilters: Partial<FilterState>) => void;
}

const defaultFilters: FilterState = {
  sort: 'newest',
  page: 1,
};

export const useFilterStore = create<FilterStoreState>((set) => ({
  filters: defaultFilters,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    })),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    })),

  resetFilters: () =>
    set({ filters: defaultFilters }),
}));
