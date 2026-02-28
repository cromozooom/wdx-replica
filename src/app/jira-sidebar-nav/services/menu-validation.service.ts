import { Injectable } from "@angular/core";
import { MenuItem } from "../models/menu-item.interface";
import { DragDropContext } from "../models/drag-drop.interface";

/**
 * Service for validating menu operations.
 * Prevents circular references during drag-drop and menu modifications.
 *
 * @service MenuValidationService
 * @injectable
 */
@Injectable({
  providedIn: "root",
})
export class MenuValidationService {
  /**
   * Check if targetItem is a descendant of sourceItem.
   * Used to prevent circular references when moving menu items.
   *
   * @param sourceItem - The item being moved
   * @param targetItem - The potential parent item
   * @returns True if targetItem is a descendant of sourceItem
   *
   * @example
   * // Dashboard > Analytics
   * // Moving Dashboard into Analytics would create circular ref
   * isDescendant(dashboard, analytics) // returns true (invalid)
   */
  isDescendant(sourceItem: MenuItem, targetItem: MenuItem): boolean {
    if (!sourceItem.children || sourceItem.children.length === 0) {
      return false;
    }

    // Check direct children
    for (const child of sourceItem.children) {
      if (child.id === targetItem.id) {
        return true;
      }
      // Recursively check descendants
      if (this.isDescendant(child, targetItem)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a drag-drop operation would create a circular reference.
   *
   * @param draggedItem - The item being dragged
   * @param targetParent - The proposed new parent (null for root level)
   * @returns True if the operation would create a circular reference
   *
   * @example
   * // Projects > Active Projects
   * // Dragging Projects into Active Projects = circular ref
   * wouldCreateCircularReference(projects, activeProjects) // returns true
   */
  wouldCreateCircularReference(
    draggedItem: MenuItem,
    targetParent: MenuItem | null,
  ): boolean {
    if (!targetParent) {
      // Moving to root level never creates circular ref
      return false;
    }

    // Cannot move item into itself
    if (draggedItem.id === targetParent.id) {
      return true;
    }

    // Check if target parent is a descendant of dragged item
    return this.isDescendant(draggedItem, targetParent);
  }

  /**
   * Validate a drag-drop context for all conditions.
   * Checks circular references, depth limits, and other constraints.
   *
   * @param context - The drag-drop operation context
   * @param maxDepth - Maximum allowed nesting depth (default: 5)
   * @returns Object with isValid flag and optional error message
   *
   * @example
   * const result = validateDrop(context, 5);
   * if (!result.isValid) {
   *   console.error(result.error);
   * }
   */
  validateDrop(
    context: DragDropContext,
    maxDepth: number = 5,
  ): { isValid: boolean; error?: string } {
    const { draggedItem, targetParent, dropType } = context;

    // Check circular reference
    if (this.wouldCreateCircularReference(draggedItem, targetParent)) {
      return {
        isValid: false,
        error: "Cannot move an item into its own descendant",
      };
    }

    // Check depth limit
    const wouldExceedDepth = this.wouldExceedMaxDepth(
      draggedItem,
      targetParent,
      maxDepth,
    );
    if (wouldExceedDepth) {
      return {
        isValid: false,
        error: `Maximum nesting depth of ${maxDepth} levels would be exceeded`,
      };
    }

    // Check if drop type is valid
    if (!["above", "below", "into"].includes(dropType)) {
      return {
        isValid: false,
        error: "Invalid drop type",
      };
    }

    return { isValid: true };
  }

  /**
   * Check if moving an item would exceed maximum depth.
   *
   * @param draggedItem - Item being moved (with its subtree)
   * @param targetParent - New parent (null for root)
   * @param maxDepth - Maximum allowed depth
   * @returns True if depth would be exceeded
   */
  private wouldExceedMaxDepth(
    draggedItem: MenuItem,
    targetParent: MenuItem | null,
    maxDepth: number,
  ): boolean {
    // Calculate depth of dragged item's subtree
    const subtreeDepth = this.calculateSubtreeDepth(draggedItem);

    // Calculate target parent depth (0 for root)
    let targetDepth = 0;
    if (targetParent) {
      // In real implementation, we'd calculate depth from root
      // For now, assume depth metadata or calculate from structure
      targetDepth = this.estimateDepth(targetParent);
    }

    // New depth = target depth + 1 (for the item itself) + subtree depth
    const newDepth = targetDepth + 1 + subtreeDepth;

    return newDepth > maxDepth;
  }

  /**
   * Calculate maximum depth of a subtree.
   *
   * @param item - Root of subtree
   * @returns Maximum depth (0 for leaf nodes)
   */
  private calculateSubtreeDepth(item: MenuItem): number {
    if (!item.children || item.children.length === 0) {
      return 0;
    }

    let maxChildDepth = 0;
    for (const child of item.children) {
      const childDepth = this.calculateSubtreeDepth(child);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return 1 + maxChildDepth;
  }

  /**
   * Estimate depth of an item in the tree.
   * Note: In production, this should be calculated from root or stored as metadata.
   *
   * @param item - Item to estimate depth for
   * @returns Estimated depth
   */
  private estimateDepth(item: MenuItem): number {
    // Placeholder - in real implementation, calculate from root
    // or store depth in metadata
    return 1;
  }

  /**
   * Get all descendant IDs of an item (recursively).
   * Useful for batch operations on subtrees.
   *
   * @param item - Root item
   * @returns Array of all descendant IDs
   */
  getAllDescendantIds(item: MenuItem): string[] {
    const ids: string[] = [];

    if (!item.children || item.children.length === 0) {
      return ids;
    }

    for (const child of item.children) {
      ids.push(child.id);
      ids.push(...this.getAllDescendantIds(child));
    }

    return ids;
  }
}
