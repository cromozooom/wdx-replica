/**
 * Merged document result (runtime only, not persisted).
 * Represents a template merged with customer data for preview/generation.
 */
export interface MergedDocument {
  /** Template ID used for merging */
  templateId: string;

  /** Customer ID whose data was merged */
  customerId: string;

  /** Rendered HTML output from merged markdown */
  renderedHtml: string;
}
