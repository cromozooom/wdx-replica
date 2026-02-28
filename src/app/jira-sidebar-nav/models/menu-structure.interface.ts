import { MenuItem } from "./menu-item.interface";

/**
 * Represents the complete hierarchical menu organization.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for complete specification
 */
export interface MenuStructure {
  /**
   * Root-level menu items.
   * Top-level items in the navigation hierarchy.
   */
  rootItems: MenuItem[];

  /**
   * Flat map of all items by ID for quick lookup.
   * Key: MenuItem.id, Value: MenuItem reference.
   * Updated whenever structure changes.
   */
  itemsById: Map<string, MenuItem>;

  /**
   * Maximum depth of nesting in current structure.
   * Calculated on load/update for validation.
   * Max allowed: 5 levels (per SC-007).
   */
  maxDepth: number;

  /**
   * Total count of menu items (including nested).
   * Used for performance tracking (SC-007: handles 50+ items).
   */
  totalItemCount: number;

  /**
   * Version/timestamp for change tracking.
   * Updated on every structural modification.
   * Can be used for optimistic locking in future multi-user scenarios.
   */
  version: number;

  /**
   * Metadata about the menu structure.
   */
  metadata: {
    /**
     * When this structure was last modified.
     */
    lastModified: Date;

    /**
     * Source of the data: 'localStorage' | 'default' | 'imported'
     */
    source: MenuDataSource;
  };
}

export enum MenuDataSource {
  /** Loaded from browser localStorage (FR-028) */
  LOCAL_STORAGE = "localStorage",

  /** Default hardcoded mock data (FR-028 fallback) */
  DEFAULT = "default",

  /** Imported from external file (future enhancement) */
  IMPORTED = "imported",
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
