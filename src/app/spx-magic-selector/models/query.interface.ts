import { QueryParameters } from "./query-parameters.interface";
import { PreviewRecord } from "./preview-record.interface";

/**
 * Specific data filter/view associated with SelectionItem
 * Many queries can belong to one SelectionItem
 */
export interface Query {
  /** Unique identifier for the query */
  id: string;

  /** Display name (e.g., "All Contacts") */
  name: string;

  /** Human-readable explanation of filter logic */
  description: string;

  /** Filter criteria and conditions */
  parameters: QueryParameters;

  /** Sample records for validation (max 5) */
  previewData?: PreviewRecord[];

  /** Expected result count for performance planning */
  estimatedCount?: number;
}
