/**
 * Represents a single node in the navigation hierarchy.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for complete specification
 */
export interface MenuItem {
  /**
   * Unique identifier for the menu item.
   * Used for localStorage persistence, drag-drop operations, and parent-child relationships.
   * Format: string (UUID or hierarchical like "1-2-3")
   */
  id: string;

  /**
   * Display label shown to users.
   * Required, non-empty (validated by FR-022).
   */
  label: string;

  /**
   * Icon reference as FontAwesome CSS class.
   * Example: "fas fa-home", "far fa-folder", "fab fa-github"
   * Optional - items without icons show only label.
   */
  icon?: string;

  /**
   * Router link for navigation when item is clicked.
   * Optional - parent items may not have routes.
   */
  routerLink?: string;

  /**
   * Child menu items for hierarchical structure.
   * Empty array or undefined for leaf nodes.
   * Recursive structure supporting up to 5 levels deep (per SC-007).
   */
  children?: MenuItem[];

  /**
   * Expansion state for items with children.
   * True = children visible, False = children hidden.
   * Persisted to localStorage for session restoration.
   */
  expanded?: boolean;

  /**
   * Order/position within parent or root level.
   * Used for drag-drop reordering.
   * Lower numbers appear first.
   */
  order?: number;

  /**
   * Content configuration for leaf nodes (items without children).
   * When a leaf node becomes a parent (first child added), this config
   * is automatically transferred to the first child.
   *
   * Only exists for leaf nodes - parent nodes should not have contentConfig.
   */
  contentConfig?: MenuItemContentConfig;

  /**
   * Optional metadata for future extensibility.
   */
  metadata?: {
    /**
     * Badge count for notifications (future enhancement).
     */
    badgeCount?: number;

    /**
     * Disable item (future enhancement).
     */
    disabled?: boolean;

    /**
     * Custom CSS classes for styling (future enhancement).
     */
    cssClasses?: string[];
  };
}

/**
 * Configuration for menu item content display.
 * Stores the configuration needed to render the item's content in the main area.
 */
export interface MenuItemContentConfig {
  /**
   * Type of component or content to display.
   * Examples: 'dashboard', 'grid', 'form', 'custom'
   */
  componentType?: string;

  /**
   * Component-specific settings and configuration.
   * Structure depends on componentType.
   */
  settings?: Record<string, any>;

  /**
   * Required permissions to view this content.
   */
  permissions?: string[];

  /**
   * Optional route parameters for dynamic routing.
   */
  routeParams?: Record<string, string>;
}
