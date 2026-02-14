/**
 * Interfaces for the Three-Call API Strategy
 * Production-ready layered request pattern
 */

/**
 * Call A: Lightweight list for dropdown population
 * Only contains essential info needed for ng-select
 */
export interface FormSummary {
  id: string;
  type: "Form" | "Document";
  name: string;
  description?: string;
  category: string; // e.g., "scheduling", "crm", "inventory"
  entityName: string; // e.g., "Contact", "Appointment", "Product"
}

/**
 * Call B: Form metadata with available queries
 * Fetched when user selects a form from dropdown
 */
export interface FormMetadata {
  id: string;
  type: "Form" | "Document";
  name: string;
  description: string;
  category: string;
  entityName: string;
  entityId: string;
  queries: QuerySummary[];
  totalRecords: number;
  lastUpdated: string;
}

/**
 * Query summary for the metadata call
 */
export interface QuerySummary {
  id: string;
  name: string;
  description?: string;
  type: "default" | "filtered" | "custom";
  estimatedResults: number;
  lastRun?: string;
  parameters?: {
    filters?: string[];
    sortBy?: string;
    includeDrafts?: boolean;
  };
}

/**
 * Call C: Preview data response
 * Actual records for the inspector panel
 */
export interface PreviewDataResponse {
  entityId: string;
  queryId: string;
  totalCount: number;
  pageSize: number;
  currentPage: number;
  records: PreviewRecord[];
  schema?: FieldSchema[];
}

/**
 * Individual record in the preview
 */
export interface PreviewRecord {
  id: string;
  [key: string]: any; // Dynamic fields based on entity type
}

/**
 * Schema definition for preview columns
 */
export interface FieldSchema {
  fieldName: string;
  displayName: string;
  dataType: "string" | "number" | "date" | "boolean" | "object";
  isKey?: boolean;
  isRequired?: boolean;
  maxLength?: number;
}

/**
 * API Error response structure
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}
