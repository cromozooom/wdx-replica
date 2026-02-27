# Data Model: Adaptive Hierarchical Navigation Sidebar

**Feature**: 001-jira-sidebar-nav  
**Date**: February 27, 2026  
**Phase**: 1 - Data Model Design

## Overview

This document defines the data structures for the hierarchical navigation
sidebar component. All structures are designed for TypeScript strict mode and
Angular 19 signal-based architecture.

## Core Entities

### 1. MenuItem

Represents a single node in the navigation hierarchy.

```typescript
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
```

**Validation Rules:**

- `id`: Required, must be unique across entire menu structure
- `label`: Required, must be non-empty string (trimmed length > 0)
- `icon`: Optional, must match pattern `/^fa[srlab] fa-[a-z0-9-]+$/` if provided
- `children`: Optional, can be empty array or undefined (treated as leaf)
- Max nesting depth: 5 levels (enforced at runtime)

**Example:**

```typescript
const menuItem: MenuItem = {
  id: "1",
  label: "Dashboard",
  icon: "fas fa-tachometer-alt",
  routerLink: "/dashboard",
  expanded: true,
  order: 0,
  children: [
    {
      id: "1-1",
      label: "Analytics",
      icon: "fas fa-chart-line",
      routerLink: "/dashboard/analytics",
      order: 0,
    },
    {
      id: "1-2",
      label: "Reports",
      icon: "fas fa-file-alt",
      routerLink: "/dashboard/reports",
      order: 1,
      children: [
        {
          id: "1-2-1",
          label: "Monthly",
          icon: "fas fa-calendar-alt",
          routerLink: "/dashboard/reports/monthly",
          order: 0,
        },
      ],
    },
  ],
};
```

---

### 2. SidebarState

Represents the current visibility and mode configuration of the sidebar.

```typescript
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
```

**Default State:**

```typescript
const defaultState: SidebarState = {
  visibilityMode: SidebarVisibilityMode.HIDDEN,
  isLocked: false,
  isEditMode: false,
  currentWidth: 20,
  expandedNodeIds: new Set<string>(),
  activeItemId: null,
  autoHideTimerActive: false,
};
```

**State Transitions:**

```
HIDDEN -> (hover) -> TEMPORARY_VISIBLE
TEMPORARY_VISIBLE -> (3s timer) -> HIDDEN
TEMPORARY_VISIBLE -> (lock) -> LOCKED_VISIBLE
LOCKED_VISIBLE -> (unlock) -> TEMPORARY_VISIBLE
* -> (mouseenter within 3s) -> TEMPORARY_VISIBLE (timer cancelled)
```

---

### 3. MenuStructure

The complete hierarchical organization of the navigation menu.

```typescript
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
```

**Helper Methods (Utility Functions):**

```typescript
export class MenuStructureUtils {
  /**
   * Build itemsById map from root items.
   */
  static buildItemsMap(rootItems: MenuItem[]): Map<string, MenuItem> {
    const map = new Map<string, MenuItem>();

    function traverse(items: MenuItem[]): void {
      for (const item of items) {
        map.set(item.id, item);
        if (item.children) {
          traverse(item.children);
        }
      }
    }

    traverse(rootItems);
    return map;
  }

  /**
   * Calculate maximum depth of menu structure.
   */
  static calculateMaxDepth(rootItems: MenuItem[]): number {
    function getDepth(items: MenuItem[], currentDepth = 1): number {
      let maxDepth = currentDepth;
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          maxDepth = Math.max(
            maxDepth,
            getDepth(item.children, currentDepth + 1),
          );
        }
      }
      return maxDepth;
    }

    return getDepth(rootItems);
  }

  /**
   * Count total items in structure.
   */
  static countTotalItems(rootItems: MenuItem[]): number {
    let count = 0;

    function traverse(items: MenuItem[]): void {
      count += items.length;
      for (const item of items) {
        if (item.children) {
          traverse(item.children);
        }
      }
    }

    traverse(rootItems);
    return count;
  }

  /**
   * Validate menu structure constraints.
   */
  static validate(structure: MenuStructure): ValidationResult {
    const errors: string[] = [];

    // Check max depth
    if (structure.maxDepth > 5) {
      errors.push(`Maximum depth exceeded: ${structure.maxDepth} (max: 5)`);
    }

    // Check duplicate IDs
    const ids = new Set<string>();
    function checkDuplicates(items: MenuItem[]): void {
      for (const item of items) {
        if (ids.has(item.id)) {
          errors.push(`Duplicate ID found: ${item.id}`);
        }
        ids.add(item.id);
        if (item.children) {
          checkDuplicates(item.children);
        }
      }
    }
    checkDuplicates(structure.rootItems);

    // Check empty labels
    function checkLabels(items: MenuItem[]): void {
      for (const item of items) {
        if (!item.label || item.label.trim().length === 0) {
          errors.push(`Empty label for item ID: ${item.id}`);
        }
        if (item.children) {
          checkLabels(item.children);
        }
      }
    }
    checkLabels(structure.rootItems);

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

### 4. DragDropContext

Context information for drag-and-drop operations.

```typescript
export interface DragDropContext {
  /**
   * The menu item being dragged.
   */
  draggedItem: MenuItem;

  /**
   * Original parent of the dragged item (null for root items).
   */
  originalParent: MenuItem | null;

  /**
   * Original index within parent/root.
   */
  originalIndex: number;

  /**
   * Target parent for drop (null for root level).
   */
  targetParent: MenuItem | null;

  /**
   * Target index within new parent/root.
   */
  targetIndex: number;

  /**
   * Type of drop operation.
   */
  dropType: DropType;
}

export enum DropType {
  /** Reorder within same parent */
  REORDER_SIBLING = "reorder_sibling",

  /** Move to different parent at same level */
  MOVE_TO_SIBLING = "move_to_sibling",

  /** Move to become child of another item */
  MOVE_TO_CHILD = "move_to_child",

  /** Move from child to root level */
  PROMOTE_TO_ROOT = "promote_to_root",
}

export interface DragDropValidation {
  /**
   * Whether the drop operation is valid.
   */
  isValid: boolean;

  /**
   * Reason for invalidity (if applicable).
   */
  reason?: string;

  /**
   * Type of validation failure.
   */
  failureType?: DragDropFailure;
}

export enum DragDropFailure {
  /** Would create circular reference */
  CIRCULAR_REFERENCE = "circular_reference",

  /** Would exceed maximum depth */
  MAX_DEPTH_EXCEEDED = "max_depth_exceeded",

  /** Invalid target (e.g., cannot drop on self) */
  INVALID_TARGET = "invalid_target",
}
```

---

### 5. IconDefinition

Data structure for icon picker.

```typescript
export interface IconDefinition {
  /**
   * Full CSS class string.
   * Example: "fas fa-home"
   */
  id: string;

  /**
   * Human-readable label.
   * Example: "Home"
   */
  label: string;

  /**
   * Icon category for grouping.
   * Example: "navigation", "actions", "status"
   */
  category: IconCategory;

  /**
   * Font Awesome style.
   */
  style: FontAwesomeStyle;

  /**
   * Search keywords for filtering.
   */
  keywords?: string[];
}

export enum IconCategory {
  NAVIGATION = "navigation",
  ACTIONS = "actions",
  STATUS = "status",
  FILES = "files",
  UI = "ui",
  SOCIAL = "social",
  OTHER = "other",
}

export enum FontAwesomeStyle {
  SOLID = "fas", // fa-solid
  REGULAR = "far", // fa-regular
  BRANDS = "fab", // fa-brands
}
```

---

### 6. LocalStorage Schema

Data persisted to browser localStorage.

```typescript
export interface LocalStorageSchema {
  /**
   * Key: 'nav-menu-structure'
   * Value: Serialized MenuItem[]
   */
  menuStructure: MenuItem[];

  /**
   * Key: 'nav-expanded-nodes'
   * Value: Serialized string[] (node IDs)
   */
  expandedNodeIds: string[];

  /**
   * Key: 'nav-sidebar-locked'
   * Value: Serialized boolean
   */
  sidebarLocked: boolean;

  /**
   * Key: 'nav-sidebar-width'
   * Value: Serialized number (20 or 280)
   */
  sidebarWidth: number;

  /**
   * Metadata (optional, for future use).
   * Key: 'nav-metadata'
   */
  metadata?: {
    version: string;
    lastSaved: string; // ISO date string
  };
}

/**
 * Type-safe localStorage access.
 */
export class MenuLocalStorage {
  private static readonly KEYS = {
    MENU_STRUCTURE: "nav-menu-structure",
    EXPANDED_NODES: "nav-expanded-nodes",
    SIDEBAR_LOCKED: "nav-sidebar-locked",
    SIDEBAR_WIDTH: "nav-sidebar-width",
    METADATA: "nav-metadata",
  } as const;

  static saveMenuStructure(items: MenuItem[]): void {
    localStorage.setItem(this.KEYS.MENU_STRUCTURE, JSON.stringify(items));
  }

  static loadMenuStructure(): MenuItem[] | null {
    const data = localStorage.getItem(this.KEYS.MENU_STRUCTURE);
    return data ? JSON.parse(data) : null;
  }

  static saveExpandedNodes(nodeIds: string[]): void {
    localStorage.setItem(this.KEYS.EXPANDED_NODES, JSON.stringify(nodeIds));
  }

  static loadExpandedNodes(): string[] {
    const data = localStorage.getItem(this.KEYS.EXPANDED_NODES);
    return data ? JSON.parse(data) : [];
  }

  static saveSidebarLocked(locked: boolean): void {
    localStorage.setItem(this.KEYS.SIDEBAR_LOCKED, JSON.stringify(locked));
  }

  static loadSidebarLocked(): boolean {
    const data = localStorage.getItem(this.KEYS.SIDEBAR_LOCKED);
    return data ? JSON.parse(data) : false;
  }

  static clear(): void {
    Object.values(this.KEYS).forEach((key) => localStorage.removeItem(key));
  }
}
```

---

## Relationships

```
MenuStructure (1) --contains--> (n) MenuItem
MenuItem (1) --has--> (n) MenuItem (children)
MenuItem (n) --belongs-to--> (1) MenuItem (parent)
SidebarState (1) --references--> (1) MenuItem (activeItem)
SidebarState (1) --tracks--> (n) MenuItem (expandedNodes)
DragDropContext (1) --operates-on--> (2) MenuItem (dragged, target)
IconDefinition (n) --selected-for--> (1) MenuItem
```

## Data Flow

1. **Initialization:**

   - Load from localStorage → Parse into MenuItem[]
   - Build MenuStructure (calculate depth, itemsById)
   - Initialize SidebarState with defaults
   - Restore expanded nodes from localStorage

2. **User Interaction:**

   - Click menu item → Update activeItemId
   - Expand/collapse → Update expandedNodeIds → Save to localStorage
   - Drag-drop → Validate → Update MenuStructure → Save to localStorage
   - Edit item → Open modal → Save → Update MenuStructure → Save to localStorage

3. **State Synchronization:**
   - SidebarState changes → Angular effect → Save to localStorage
   - MenuStructure changes → Rebuild itemsById, recalculate depth → Save

## Constraints

- **Maximum depth**: 5 levels (enforced by validation)
- **Maximum items**: 50+ supported (per SC-007), no hard limit
- **ID uniqueness**: Enforced by validation, checked on load
- **Label validation**: Non-empty, trimmed (enforced in edit modal)
- **localStorage quota**: ~5-10MB per domain, menu data typically <100KB

## Future Considerations

- **Versioning**: Add schema version for migrations
- **Compression**: For very large menus, consider LZ-based compression
- **Partial updates**: Delta synchronization instead of full saves
- **Multi-user**: Operational transformation for concurrent editing
- **Backup/export**: JSON export/import functionality
- **Undo/redo**: Command pattern for edit operations
