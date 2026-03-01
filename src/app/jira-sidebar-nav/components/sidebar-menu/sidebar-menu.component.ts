import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuItem } from "../../models";
import { MenuItemComponent } from "../menu-item/menu-item.component";

/**
 * Sidebar menu component (Dumb Component).
 * Renders hierarchical menu structure.
 *
 * @see specs/001-jira-sidebar-nav/contracts/component-interfaces.md for API
 */
@Component({
  selector: "app-sidebar-menu",
  standalone: true,
  imports: [CommonModule, MenuItemComponent],
  templateUrl: "./sidebar-menu.component.html",
  styleUrl: "./sidebar-menu.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuComponent implements OnInit, OnChanges {
  /**
   * Menu items to display (root level).
   */
  @Input({ required: true })
  menuItems!: MenuItem[];

  /**
   * Set of expanded node IDs.
   */
  @Input({ required: true })
  expandedNodeIds!: Set<string>;

  /**
   * ID of currently active menu item.
   */
  @Input()
  activeItemId: string | null = null;

  /**
   * Whether edit mode is active.
   */
  @Input()
  isEditMode: boolean = false;

  /**
   * Emitted when user clicks a menu item.
   */
  @Output()
  itemClicked = new EventEmitter<string>();

  /**
   * Emitted when user expands/collapses a node.
   */
  @Output()
  nodeToggled = new EventEmitter<{ itemId: string; expanded: boolean }>();

  /**
   * Emitted when user requests to edit an item (T054, FR-016).
   */
  @Output()
  editRequested = new EventEmitter<MenuItem>();

  /**
   * Emitted when user requests to delete an item (T054, FR-017).
   */
  @Output()
  deleteRequested = new EventEmitter<MenuItem>();

  /**
   * Emitted when user requests to add submenu hierarchy (T064, FR-022).
   */
  @Output()
  addSubmenuRequested = new EventEmitter<MenuItem | null>();

  /**
   * Emitted when user requests to add a single child to an item.
   */
  @Output()
  addChildRequested = new EventEmitter<MenuItem>();

  /**
   * Emitted when user requests to add a root-level menu item.
   */
  @Output()
  addRootItemRequested = new EventEmitter<void>();

  /**
   * Map of item IDs to their depth levels.
   */
  private itemLevelMap = new Map<string, number>();

  ngOnInit(): void {
    this.buildLevelMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["menuItems"]) {
      this.buildLevelMap();
    }
  }

  /**
   * Build a map of item IDs to their levels in the tree.
   */
  private buildLevelMap(): void {
    this.itemLevelMap.clear();
    this.traverseAndMapLevels(this.menuItems, 0);
  }

  /**
   * Recursively traverse menu items and map their levels.
   */
  private traverseAndMapLevels(items: MenuItem[], level: number): void {
    if (!items) {
      return;
    }
    for (const item of items) {
      this.itemLevelMap.set(item.id, level);
      if (item.children && item.children.length > 0) {
        this.traverseAndMapLevels(item.children, level + 1);
      }
    }
  }

  /**
   * Get the level of a menu item in the tree.
   */
  getLevel(item: MenuItem): number {
    return this.itemLevelMap.get(item.id) ?? 0;
  }

  /**
   * Check if node is expanded.
   */
  isExpanded(itemId: string): boolean {
    return this.expandedNodeIds.has(itemId);
  }

  /**
   * Check if a list contains any expanded items.
   */
  isListExpanded(items: MenuItem[] | undefined): boolean {
    if (!items || items.length === 0) {
      return false;
    }

    for (const item of items) {
      if (this.isExpanded(item.id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a list contains an active item (directly or in descendants).
   */
  hasActiveItemInList(items: MenuItem[] | undefined): boolean {
    if (!items || items.length === 0) {
      return false;
    }

    for (const item of items) {
      if (item.id === this.activeItemId) {
        return true;
      }
      if (this.hasActiveDescendant(item)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if an item has expanded children (has a visible expanded <ul>).
   */
  hasExpandedChildren(item: MenuItem): boolean {
    return this.hasChildren(item) && this.isExpanded(item.id);
  }

  /**
   * Check if an item has a tree inside (has descendants at any level with children).
   */
  hasTreeInside(item: MenuItem): boolean {
    if (!this.hasChildren(item)) {
      return false;
    }

    // Check if any child has children
    return this.hasTreeInsideRecursive(item.children!);
  }

  /**
   * Recursively check if any item in the tree has children.
   */
  private hasTreeInsideRecursive(items: MenuItem[]): boolean {
    for (const item of items) {
      if (this.hasChildren(item)) {
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (this.hasTreeInsideRecursive(item.children)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if there's an expanded or active sibling after this item in the same parent list.
   * Excludes level 0 (root level) items.
   */
  hasOpenSiblingAfter(item: MenuItem): boolean {
    // Skip level 0 (root level)
    if (this.getLevel(item) === 0) {
      return false;
    }

    const siblings = this.findSiblings(item);
    if (!siblings) {
      return false;
    }

    const currentIndex = siblings.findIndex(
      (sibling) => sibling.id === item.id,
    );
    if (currentIndex === -1) {
      return false;
    }

    // Check if any sibling after this item is expanded or active
    for (let i = currentIndex + 1; i < siblings.length; i++) {
      const sibling = siblings[i];
      // Check if sibling is active or has expanded children
      if (
        sibling.id === this.activeItemId ||
        this.hasExpandedChildren(sibling)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find the sibling array that contains this item.
   */
  private findSiblings(targetItem: MenuItem): MenuItem[] | null {
    // Check root level
    if (this.menuItems.some((item) => item.id === targetItem.id)) {
      return this.menuItems;
    }

    // Search recursively
    return this.findSiblingsRecursive(targetItem, this.menuItems);
  }

  /**
   * Recursively search for the siblings array containing the target item.
   */
  private findSiblingsRecursive(
    targetItem: MenuItem,
    items: MenuItem[],
  ): MenuItem[] | null {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        // Check if target is in this item's children
        if (item.children.some((child) => child.id === targetItem.id)) {
          return item.children;
        }

        // Recurse deeper
        const found = this.findSiblingsRecursive(targetItem, item.children);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Toggle node expansion.
   */
  toggleNode(item: MenuItem): void {
    const isCurrentlyExpanded = this.isExpanded(item.id);
    this.nodeToggled.emit({ itemId: item.id, expanded: !isCurrentlyExpanded });
  }

  /**
   * Handle item click.
   */
  onItemClick(itemId: string): void {
    this.itemClicked.emit(itemId);
  }

  /**
   * Check if item has children.
   */
  hasChildren(item: MenuItem): boolean {
    return !!(item.children && item.children.length > 0);
  }

  /**
   * Track by function for ngFor performance.
   */
  trackByItemId(index: number, item: MenuItem): string {
    return item.id;
  }

  /**
   * Check if any descendant of an item is active.
   */
  hasActiveDescendant(item: MenuItem): boolean {
    if (!item.children || item.children.length === 0) {
      return false;
    }

    for (const child of item.children) {
      if (child.id === this.activeItemId) {
        return true;
      }
      if (this.hasActiveDescendant(child)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle edit button click (T054).
   */
  onEditClick(item: MenuItem): void {
    this.editRequested.emit(item);
  }

  /**
   * Handle delete button click (T054).
   */
  onDeleteClick(item: MenuItem): void {
    this.deleteRequested.emit(item);
  }

  /**
   * Handle add submenu button click (T064).
   */
  onAddSubmenuClick(item: MenuItem | null): void {
    this.addSubmenuRequested.emit(item);
  }

  /**
   * Handle add child button click.
   */
  onAddChildClick(item: MenuItem): void {
    this.addChildRequested.emit(item);
  }

  /**
   * Handle add root item button click.
   */
  onAddRootItemClick(): void {
    this.addRootItemRequested.emit();
  }
}
