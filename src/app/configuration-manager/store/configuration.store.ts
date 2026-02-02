import { computed, Injectable } from "@angular/core";
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from "@ngrx/signals";
import { Configuration } from "../models/configuration.model";
import { ConfigurationType } from "../models/configuration-type.enum";

export interface ConfigurationState {
  configurations: Configuration[];
  selectedIds: number[];
  filterType: ConfigurationType | null;
  searchTerm: string;
  loading: boolean;
  error: string | null;
}

const initialState: ConfigurationState = {
  configurations: [],
  selectedIds: [],
  filterType: null,
  searchTerm: "",
  loading: false,
  error: null,
};

export const ConfigurationStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed(({ configurations, filterType, searchTerm }) => ({
    filteredConfigurations: computed(() => {
      let filtered = configurations();

      // Apply type filter
      if (filterType()) {
        filtered = filtered.filter((c) => c.type === filterType());
      }

      // Apply search term
      if (searchTerm()) {
        const term = searchTerm().toLowerCase();
        filtered = filtered.filter((c) => c.name.toLowerCase().includes(term));
      }

      return filtered;
    }),
  })),
  withMethods((store) => ({
    setConfigurations(configurations: Configuration[]): void {
      patchState(store, { configurations, loading: false });
    },

    addConfiguration(configuration: Configuration): void {
      patchState(store, {
        configurations: [...store.configurations(), configuration],
      });
    },

    updateConfiguration(updated: Configuration): void {
      patchState(store, {
        configurations: store
          .configurations()
          .map((c) => (c.id === updated.id ? updated : c)),
      });
    },

    removeConfiguration(id: number): void {
      patchState(store, {
        configurations: store.configurations().filter((c) => c.id !== id),
        selectedIds: store.selectedIds().filter((sid) => sid !== id),
      });
    },

    setSelectedIds(ids: number[]): void {
      patchState(store, { selectedIds: ids });
    },

    toggleSelection(id: number): void {
      const currentIds = store.selectedIds();
      const newIds = currentIds.includes(id)
        ? currentIds.filter((sid) => sid !== id)
        : [...currentIds, id];
      patchState(store, { selectedIds: newIds });
    },

    setFilterType(type: ConfigurationType | null): void {
      patchState(store, { filterType: type });
    },

    setSearchTerm(term: string): void {
      patchState(store, { searchTerm: term });
    },

    setLoading(loading: boolean): void {
      patchState(store, { loading });
    },

    setError(error: string | null): void {
      patchState(store, { error });
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),
);
