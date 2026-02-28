/**
 * Represents an icon definition for the icon picker.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for complete specification
 */
export interface IconDefinition {
  /**
   * Unique identifier (CSS class string).
   * Example: "fas fa-home"
   */
  id: string;

  /**
   * Human-readable label.
   * Example: "Home"
   */
  label: string;

  /**
   * Icon category for grouping in picker.
   * Example: "Navigation", "Actions", "Status"
   */
  category: string;

  /**
   * Full CSS class for rendering.
   * Example: "fas fa-home"
   */
  cssClass: string;

  /**
   * Search keywords for filtering (optional).
   */
  keywords?: string[];
}
