import { MenuItem } from "./menu-item.interface";

/**
 * Represents the context for drag-and-drop operations.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for complete specification
 */
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
