import { createAction, createReducer, on, props } from "@ngrx/store";

export interface WidgetDataHistoryFilters {
  selectedField: string | null;
  selectedAuthor: string | null;
}

export interface WidgetDataHistoryState {
  filters: WidgetDataHistoryFilters;
  // ... add other state like data, loading, error, etc.
}

export const initialWidgetDataHistoryState: WidgetDataHistoryState = {
  filters: {
    selectedField: null,
    selectedAuthor: null,
  },
  // ...
};

export const setFieldFilter = createAction(
  "[Widget Data History] Set Field Filter",
  props<{ field: string | null }>()
);

export const setAuthorFilter = createAction(
  "[Widget Data History] Set Author Filter",
  props<{ author: string | null }>()
);

export const widgetDataHistoryReducer = createReducer(
  initialWidgetDataHistoryState,
  on(
    setFieldFilter,
    (state: WidgetDataHistoryState, { field }: { field: string | null }) => ({
      ...state,
      filters: { ...state.filters, selectedField: field },
    })
  ),
  on(
    setAuthorFilter,
    (state: WidgetDataHistoryState, { author }: { author: string | null }) => ({
      ...state,
      filters: { ...state.filters, selectedAuthor: author },
    })
  )
);
