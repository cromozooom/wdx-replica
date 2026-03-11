import { type FieldFormatConfig } from "./field-format.model";

/**
 * Data field definition for customer data merging.
 * Fields are dynamically extracted from customer JSON data at runtime.
 */
export interface DataField {
  /** Unique identifier (snake_case) */
  id: string;

  /** Display name shown in pill menu and rendered pills */
  label: string;

  /** Data type */
  type: "text" | "date" | "number" | "currency";

  /** Optional formatting configuration */
  formatConfig?: FieldFormatConfig;

  /** Optional description for user guidance */
  description?: string;

  /** Whether this field is required */
  required?: boolean;

  /** Field category for organization */
  category?: "personal" | "account" | "address" | "other";
}
