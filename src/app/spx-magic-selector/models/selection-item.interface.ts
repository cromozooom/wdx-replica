import { Query } from "./query.interface";

/**
 * Primary selectable item (Form/Document) with associated query relationships
 * One SelectionItem can have multiple Query definitions
 */
export interface SelectionItem {
  /** Unique identifier for the item */
  id: string;

  /** Item classification */
  type: "Form" | "Document";

  /** Display name (e.g., "Appointment Form") */
  name: string;

  /** Associated business entity (e.g., "Contact") */
  entityName: string;

  /** Entity identifier for API calls (e.g., "entity-contact") */
  entityId: string;

  /** Optional detailed description */
  description?: string;

  /** Array of associated query definitions */
  queries: Query[];

  /** Additional item properties */
  metadata?: ItemMetadata;
}

/**
 * Extensible metadata container for additional properties
 */
export interface ItemMetadata {
  /** Creation timestamp */
  createdDate?: Date;

  /** Last update timestamp */
  lastModified?: Date;

  /** Classification tags */
  tags?: string[];

  /** Domain-specific attributes */
  customProperties?: Record<string, any>;
}
