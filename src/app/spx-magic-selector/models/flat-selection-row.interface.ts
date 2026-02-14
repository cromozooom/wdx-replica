import { Query } from "./query.interface";
import { SelectionItem } from "./selection-item.interface";

/**
 * Flattened representation for ag-grid display
 * One row per query (each SelectionItem with N queries becomes N rows)
 */
export interface FlatSelectionRow {
  /** Combination key: ${itemId}-${queryId} */
  uniqueId: string;

  /** Item name for grid display */
  sourceName: string;

  /** Business entity for grid display */
  entityName: string;

  /** Query name for grid display */
  queryName: string;

  /** Query explanation for grid display */
  queryDescription: string;

  /** Expected result count */
  estimatedRecords: number;

  /** Reference to full query object */
  queryRef: Query;

  /** Reference to parent item */
  originalItem: SelectionItem;

  /** Grid selection state (radio button) */
  isSelected?: boolean;
}
