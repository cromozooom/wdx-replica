/**
 * Sample data record for query validation and user confirmation
 */
export interface PreviewRecord {
  /** Record identifier in source system */
  id: string | number;

  /** Key-value pairs for preview display */
  displayData: Record<string, any>;

  /** Additional record properties for context */
  metadata?: RecordMetadata;

  /** Timestamp for data freshness indication */
  lastUpdated?: Date;
}

/**
 * Extensible metadata container for record properties
 */
export interface RecordMetadata {
  /** Creation timestamp */
  createdDate?: Date;

  /** Last update timestamp */
  lastModified?: Date;

  /** Classification tags */
  tags?: string[];

  /** Domain-specific attributes */
  customProperties?: Record<string, any>;
}
