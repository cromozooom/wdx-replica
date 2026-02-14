/**
 * Filter criteria and conditions that define data retrieval
 * Immutable - modifications create new instances
 */
export interface QueryParameters {
  /** Array of filter criteria */
  filters: FilterCondition[];

  /** Ordering specification */
  sortBy?: SortDefinition;

  /** Time-based filtering */
  dateRange?: DateRangeFilter;

  /** Status-based inclusion criteria */
  statusFilters?: string[];

  /** Advanced filtering logic */
  customMatchers?: CustomMatchCondition[];
}

/**
 * Individual filter criterion within QueryParameters
 */
export interface FilterCondition {
  /** Target field name */
  field: string;

  /** Comparison type */
  operator: FilterOperator;

  /** Filter value */
  value: any;

  /** Whether filter is currently applied */
  isActive: boolean;
}

/**
 * Filter comparison operators
 */
export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "in"
  | "notIn"
  | "between";

/**
 * Sort order specification
 */
export interface SortDefinition {
  /** Field to sort by */
  field: string;

  /** Sort direction */
  direction: "asc" | "desc";
}

/**
 * Date range filter specification
 */
export interface DateRangeFilter {
  /** Target date field */
  field: string;

  /** Range start date */
  start: Date;

  /** Range end date */
  end: Date;
}

/**
 * Custom match condition for advanced filtering
 */
export interface CustomMatchCondition {
  /** Custom matcher identifier */
  matcherId: string;

  /** Match expression or pattern */
  expression: string;

  /** Match parameters */
  parameters?: Record<string, any>;
}
