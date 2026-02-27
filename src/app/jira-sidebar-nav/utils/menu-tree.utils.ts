import { MenuItem, MenuStructure, ValidationResult } from "../models";

/**
 * Utility functions for menu tree operations.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for utilities specification
 */
export class MenuTreeUtils {
  /**
   * Maximum allowed nesting depth (FR-033).
   */
  private static readonly MAX_DEPTH = 5;

  /**
   * Build itemsById map from root items.
   * Recursively traverses tree and creates flat lookup map.
   *
   * @param rootItems Root-level menu items
   * @returns Map of item ID to MenuItem reference
   */
  static buildItemsMap(rootItems: MenuItem[]): Map<string, MenuItem> {
    const map = new Map<string, MenuItem>();

    function traverse(items: MenuItem[]): void {
      for (const item of items) {
        map.set(item.id, item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    }

    traverse(rootItems);
    return map;
  }

  /**
   * Calculate maximum depth of menu structure.
   *
   * @param rootItems Root-level menu items
   * @returns Maximum depth (1 for flat structure, 2+ for nested)
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

    return rootItems.length > 0 ? getDepth(rootItems) : 0;
  }

  /**
   * Count total items in structure (including nested).
   *
   * @param rootItems Root-level menu items
   * @returns Total count of all items
   */
  static countTotalItems(rootItems: MenuItem[]): number {
    let count = 0;

    function traverse(items: MenuItem[]): void {
      count += items.length;
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    }

    traverse(rootItems);
    return count;
  }

  /**
   * Validate menu structure constraints (FR-033, FR-022).
   * Enforces maximum depth of 5 levels, checks for duplicate IDs, and validates labels.
   *
   * @param structure Menu structure to validate
   * @returns Validation result with errors array
   * @throws Error if maximum depth exceeded (T080)
   */
  static validateStructure(structure: MenuStructure): ValidationResult {
    const errors: string[] = [];

    // Check max depth (FR-033, T080)
    if (structure.maxDepth > this.MAX_DEPTH) {
      const errorMsg = `Maximum depth exceeded: ${structure.maxDepth} (max allowed: ${this.MAX_DEPTH})`;
      errors.push(errorMsg);
      // Throw error for immediate feedback (T080 requirement)
      throw new Error(errorMsg);
    }

    // Check duplicate IDs
    const ids = new Set<string>();
    function checkDuplicates(items: MenuItem[], path = ""): void {
      for (const item of items) {
        if (ids.has(item.id)) {
          errors.push(`Duplicate ID found: ${item.id} at path: ${path}`);
        }
        ids.add(item.id);
        if (item.children && item.children.length > 0) {
          checkDuplicates(item.children, `${path}/${item.label}`);
        }
      }
    }
    checkDuplicates(structure.rootItems);

    // Check empty labels (FR-022)
    function checkLabels(items: MenuItem[], path = ""): void {
      for (const item of items) {
        if (!item.label || item.label.trim().length === 0) {
          errors.push(
            `Empty or whitespace-only label for item ID: ${item.id} at path: ${path}`,
          );
        }
        if (item.children && item.children.length > 0) {
          checkLabels(item.children, `${path}/${item.label}`);
        }
      }
    }
    checkLabels(structure.rootItems);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Find menu item by ID using itemsById map (O(1) lookup).
   *
   * @param id Item ID to find
   * @param structure Menu structure
   * @returns MenuItem if found, undefined otherwise
   */
  static findItemById(
    id: string,
    structure: MenuStructure,
  ): MenuItem | undefined {
    return structure.itemsById.get(id);
  }

  /**
   * Get all descendant IDs of a menu item (recursive).
   *
   * @param item Menu item to get descendants for
   * @returns Array of descendant item IDs (includes item itself)
   */
  static getAllDescendants(item: MenuItem): string[] {
    const descendants: string[] = [item.id];

    function traverse(children: MenuItem[] | undefined): void {
      if (!children) return;
      for (const child of children) {
        descendants.push(child.id);
        if (child.children && child.children.length > 0) {
          traverse(child.children);
        }
      }
    }

    traverse(item.children);
    return descendants;
  }

  /**
   * Find parent of a menu item by traversing structure.
   *
   * @param itemId ID of item to find parent for
   * @param rootItems Root-level items to search
   * @returns Parent MenuItem or null if item is at root level or not found
   */
  static findParent(itemId: string, rootItems: MenuItem[]): MenuItem | null {
    function searchParent(items: MenuItem[]): MenuItem | null {
      for (const item of items) {
        if (item.children) {
          // Check if itemId is in direct children
          if (item.children.some((child) => child.id === itemId)) {
            return item;
          }
          // Recurse into children
          const parent = searchParent(item.children);
          if (parent) return parent;
        }
      }
      return null;
    }

    return searchParent(rootItems);
  }

  /**
   * Get path from root to item (array of labels).
   *
   * @param itemId ID of target item
   * @param rootItems Root-level items
   * @returns Array of labels from root to item, or empty array if not found
   */
  static getItemPath(itemId: string, rootItems: MenuItem[]): string[] {
    function findPath(
      items: MenuItem[],
      currentPath: string[],
    ): string[] | null {
      for (const item of items) {
        const newPath = [...currentPath, item.label];
        if (item.id === itemId) {
          return newPath;
        }
        if (item.children) {
          const result = findPath(item.children, newPath);
          if (result) return result;
        }
      }
      return null;
    }

    return findPath(rootItems, []) || [];
  }

  /**
   * Check if adding item as child would exceed max depth.
   *
   * @param parentItem Parent item to add child to
   * @param childItem Child item to add
   * @param rootItems Root items for context
   * @returns true if operation would exceed max depth
   */
  static wouldExceedMaxDepth(
    parentItem: MenuItem | null,
    childItem: MenuItem,
    rootItems: MenuItem[],
  ): boolean {
    // Calculate depth of parent
    const parentDepth = parentItem
      ? this.getItemPath(parentItem.id, rootItems).length
      : 0;

    // Calculate max depth of child tree
    const childTreeDepth = this.calculateMaxDepth([childItem]);

    // Total depth would be parent depth + child tree depth
    const totalDepth = parentDepth + childTreeDepth;

    return totalDepth > this.MAX_DEPTH;
  }

  /**
   * Check for circular reference in drag-drop operations.
   *
   * @param draggedItem Item being dragged
   * @param targetParent Target parent item
   * @returns true if dropping would create circular reference
   */
  static wouldCreateCircularReference(
    draggedItem: MenuItem,
    targetParent: MenuItem | null,
  ): boolean {
    if (!targetParent) return false; // Dropping to root cannot create circular reference

    // Get all descendants of dragged item
    const descendants = this.getAllDescendants(draggedItem);

    // Check if target parent is a descendant of dragged item
    return descendants.includes(targetParent.id);
  }

  /**
   * Clone menu item (deep copy) for immutable operations.
   *
   * @param item Item to clone
   * @returns Deep copy of item
   */
  static cloneItem(item: MenuItem): MenuItem {
    return JSON.parse(JSON.stringify(item));
  }

  /**
   * Clone menu items array (deep copy).
   *
   * @param items Items array to clone
   * @returns Deep copy of items array
   */
  static cloneItems(items: MenuItem[]): MenuItem[] {
    return JSON.parse(JSON.stringify(items));
  }
}
