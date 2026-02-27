/**
 * Represents the current visibility and mode configuration of the sidebar.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for complete specification
 */
export interface SidebarState {
  /**
   * Current visibility mode of the sidebar.
   */
  visibilityMode: SidebarVisibilityMode;

  /**
   * Whether sidebar is locked in visible state.
   * True = ignores auto-hide timers, False = responsive to hover behavior.
   * Toggled by lock button, persisted to localStorage (FR-010, FR-011).
   */
  isLocked: boolean;

  /**
   * Whether edit mode is active.
   * True = show action buttons and drag handles, False = navigation mode.
   * Restricted to authorized users (FR-014).
   */
  isEditMode: boolean;

  /**
   * Current width of the sidebar in pixels.
   * Values: 20 (hidden), 280 (visible) per clarifications.
   * Animated via CSS transitions (SC-005: <300ms).
   */
  currentWidth: number;

  /**
   * IDs of currently expanded nodes.
   * Used to restore expansion state from localStorage.
   */
  expandedNodeIds: Set<string>;

  /**
   * ID of the currently active/selected menu item.
   * Highlights the user's current location in navigation.
   * Synced with router events.
   */
  activeItemId: string | null;

  /**
   * Whether auto-hide timer is currently active.
   * Internal state for debugging/testing.
   */
  autoHideTimerActive: boolean;
}

export enum SidebarVisibilityMode {
  /**
   * Hidden state - sidebar collapsed to 20px strip.
   * Shows minimal visual indicator for hover target.
   */
  HIDDEN = "hidden",

  /**
   * Temporary visible - sidebar expanded to 280px.
   * Auto-hides after 3 seconds when mouse leaves (FR-008).
   */
  TEMPORARY_VISIBLE = "temporary_visible",

  /**
   * Locked visible - sidebar permanently expanded to 280px.
   * Ignores auto-hide timers until unlocked (FR-011).
   */
  LOCKED_VISIBLE = "locked_visible",
}
