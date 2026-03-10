/**
 * Customer data record for template merging.
 * Contains actual customer data that populates template fields during preview/generation.
 */
export interface CustomerRecord {
  /** Unique customer identifier */
  id: string;

  /** Dynamic properties matching DataField IDs */
  [fieldId: string]: string | number | Date | null | undefined;

  // Personal Information
  full_name?: string;
  date_of_birth?: string; // ISO 8601 date string
  tax_id?: string;

  // Account Information
  sort_code?: string;
  account_number?: string;
  account_balance?: number;
  account_type?: string;
  client_since_date?: string; // ISO 8601 date string
  client_status?: string;

  // Wealth Management
  portfolio_value?: number;
  investment_advisor_name?: string;
  risk_profile?: string;
  annual_income?: number;
  net_worth?: number;
  last_review_date?: string; // ISO 8601 date string
  next_review_date?: string; // ISO 8601 date string

  // Contact Information
  primary_contact_phone?: string;
  primary_contact_email?: string;
  preferred_contact_method?: string;

  // Address
  mailing_address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}
