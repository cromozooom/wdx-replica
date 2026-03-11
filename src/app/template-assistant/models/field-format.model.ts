/**
 * Configuration for formatting data field values in merged documents.
 */

/** Text formatting configuration */
export interface TextFormatConfig {
  /** Optional pattern (e.g., "##-##-##" for sort code) */
  pattern?: string;

  /** Text transform */
  transform?: "uppercase" | "lowercase" | "capitalize" | "none";
}

/** Date formatting configuration */
export interface DateFormatConfig {
  /**
   * Date format string using date-fns format tokens
   * Examples:
   * - 'dd MMM yyyy' → "10 Mar 2026"
   * - 'MM/dd/yyyy' → "03/10/2026"
   * - 'yyyy-MM-dd' → "2026-03-10"
   * - 'EEEE, MMMM do, yyyy' → "Monday, March 10th, 2026"
   */
  dateFormat: string;
}

/** Number formatting configuration */
export interface NumberFormatConfig {
  /** Number of decimal places */
  decimals: number;

  /** Thousand separator */
  thousandSeparator?: "," | "." | " " | "none";
}

/** Currency formatting configuration */
export interface CurrencyFormatConfig {
  /** ISO 4217 currency code */
  currencyCode: "GBP" | "EUR" | "USD";

  /** Decimal places (default: 2) */
  decimals?: number;

  /** Symbol position */
  symbolPosition?: "before" | "after";
}

/** Union type for all format configurations */
export type FieldFormatConfig =
  | TextFormatConfig
  | DateFormatConfig
  | NumberFormatConfig
  | CurrencyFormatConfig;
