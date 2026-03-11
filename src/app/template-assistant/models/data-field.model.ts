import { type FieldFormatConfig } from "./field-format.model";

/**
 * Data field definition for customer data merging.
 * Defines available fields that can be inserted as pills in templates.
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

/**
 * Predefined wealth management fields (27 total).
 * Used for MVP implementation with sample customer data.
 */
export const CUSTOMER_FIELDS: DataField[] = [
  // Personal Information
  {
    id: "full_name",
    label: "Full Name",
    type: "text",
    category: "personal",
    required: true,
  },
  {
    id: "date_of_birth",
    label: "Date of Birth",
    type: "date",
    category: "personal",
    formatConfig: { dateFormat: "dd MMM yyyy" },
  },
  {
    id: "tax_id",
    label: "Tax ID",
    type: "text",
    category: "personal",
  },

  // Account Information
  {
    id: "sort_code",
    label: "Sort Code",
    type: "text",
    category: "account",
    formatConfig: { pattern: "##-##-##" },
  },
  {
    id: "account_number",
    label: "Account Number",
    type: "text",
    category: "account",
  },
  {
    id: "account_balance",
    label: "Account Balance",
    type: "currency",
    category: "account",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 2,
      symbolPosition: "before",
    },
  },
  {
    id: "account_type",
    label: "Account Type",
    type: "text",
    category: "account",
  },
  {
    id: "client_since_date",
    label: "Client Since",
    type: "date",
    category: "account",
    formatConfig: { dateFormat: "dd MMM yyyy" },
  },
  {
    id: "client_status",
    label: "Client Status",
    type: "text",
    category: "account",
  },

  // Wealth Management
  {
    id: "portfolio_value",
    label: "Portfolio Value",
    type: "currency",
    category: "other",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 2,
      symbolPosition: "before",
    },
  },
  {
    id: "investment_advisor_name",
    label: "Investment Advisor",
    type: "text",
    category: "other",
  },
  {
    id: "risk_profile",
    label: "Risk Profile",
    type: "text",
    category: "other",
  },
  {
    id: "annual_income",
    label: "Annual Income",
    type: "currency",
    category: "other",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 0,
      symbolPosition: "before",
    },
  },
  {
    id: "net_worth",
    label: "Net Worth",
    type: "currency",
    category: "other",
    formatConfig: {
      currencyCode: "GBP",
      decimals: 0,
      symbolPosition: "before",
    },
  },
  {
    id: "last_review_date",
    label: "Last Review Date",
    type: "date",
    category: "other",
    formatConfig: { dateFormat: "dd MMM yyyy" },
  },
  {
    id: "next_review_date",
    label: "Next Review Date",
    type: "date",
    category: "other",
    formatConfig: { dateFormat: "dd MMM yyyy" },
  },

  // Contact Information
  {
    id: "primary_contact_phone",
    label: "Primary Phone",
    type: "text",
    category: "personal",
  },
  {
    id: "primary_contact_email",
    label: "Primary Email",
    type: "text",
    category: "personal",
  },
  {
    id: "preferred_contact_method",
    label: "Preferred Contact Method",
    type: "text",
    category: "personal",
  },

  // Address
  {
    id: "mailing_address",
    label: "Mailing Address",
    type: "text",
    category: "address",
  },
  {
    id: "city",
    label: "City",
    type: "text",
    category: "address",
  },
  {
    id: "postal_code",
    label: "Postal Code",
    type: "text",
    category: "address",
  },
  {
    id: "country",
    label: "Country",
    type: "text",
    category: "address",
  },
];
