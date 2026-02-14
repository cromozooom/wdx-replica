import { SelectionItem } from "./selection-item.interface";

/**
 * Configuration defining available entities and relationships for business contexts
 */
export interface DomainSchema {
  /** Unique domain identifier (e.g., "crm-scheduling") */
  domainId: string;

  /** Human-readable domain name */
  name: string;

  /** Domain purpose and scope */
  description: string;

  /** Available business entities */
  entities: EntityDefinition[];

  /** Pre-configured common selections */
  defaultSelections?: SelectionItem[];

  /** Whether domain is currently available */
  isActive: boolean;
}

/**
 * Business entity specification within domain context
 */
export interface EntityDefinition {
  /** Entity name (e.g., "Contact", "Task") */
  name: string;

  /** User-friendly name */
  displayName: string;

  /** Available fields for querying */
  fields: FieldDefinition[];

  /** Main identifier field name */
  primaryKey: string;

  /** Connections to other entities */
  relationships?: EntityRelationship[];
}

/**
 * Field definition for entity properties
 */
export interface FieldDefinition {
  /** Field name */
  name: string;

  /** Field data type */
  type: FieldType;

  /** Whether field is required */
  required: boolean;

  /** Allowed values for enum types */
  values?: string[];
}

/**
 * Field data types
 */
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "object"
  | "array";

/**
 * Entity relationship specification
 */
export interface EntityRelationship {
  /** Related entity name */
  targetEntity: string;

  /** Relationship type */
  type: "one-to-one" | "one-to-many" | "many-to-many";

  /** Foreign key field name */
  foreignKey: string;
}
