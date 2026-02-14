import { SelectionItem } from "./selection-item.interface";
import { Query } from "./query.interface";

/**
 * Event emitted when selection changes in the component
 */
export interface SelectionChangeEvent {
  /** Currently selected item (null if cleared) */
  selectedItem: SelectionItem | null;

  /** Currently selected query (null if cleared) */
  selectedQuery: Query | null;

  /** Previously selected item for change tracking */
  previousSelection?: SelectionItem;

  /** Event timestamp */
  timestamp: Date;

  /** Source of the selection change */
  source: "dropdown" | "modal" | "api";
}

/**
 * Event emitted when domain is switched
 */
export interface DomainSwitchEvent {
  /** Previous domain identifier */
  fromDomain: string;

  /** New domain identifier */
  toDomain: string;

  /** Event timestamp */
  timestamp: Date;
}

/**
 * Event emitted when validation error occurs
 */
export interface ValidationErrorEvent {
  /** Validation error details */
  error: ValidationError;

  /** Field that triggered validation error */
  field: string;

  /** Value that failed validation */
  value: any;

  /** Event timestamp */
  timestamp: Date;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code identifier */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Error severity level */
  severity: "error" | "warning" | "info";

  /** Additional error context */
  details?: Record<string, any>;
}
