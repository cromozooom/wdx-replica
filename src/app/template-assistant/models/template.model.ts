/**
 * Document template with markdown content containing {{field_id}} placeholders.
 * Stored in localStorage for persistence.
 */
export interface DocumentTemplate {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Template name (1-100 characters) */
  name: string;

  /** Markdown content with {{field_id}} placeholders (max 50,000 characters) */
  content: string;

  /** Creation timestamp (ISO 8601) */
  createdAt: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt: string;

  /** Version number (currently 1) */
  version: number;

  /** Optional metadata */
  metadata?: {
    /** Template description (max 500 characters) */
    description?: string;

    /** Tags for categorization */
    tags?: string[];

    /** Last customer ID used in preview */
    lastPreviewCustomerId?: string;
  };
}
