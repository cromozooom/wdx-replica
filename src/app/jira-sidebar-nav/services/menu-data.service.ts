import { computed, effect, Injectable, signal, inject } from "@angular/core";
import {
  MenuItem,
  MenuStructure,
  MenuDataSource,
  SidebarState,
  SidebarVisibilityMode,
} from "../models";
import { MenuLocalStorage } from "../utils/menu-local-storage";
import { MenuTreeUtils } from "../utils/menu-tree.utils";
import { MenuMockDataService } from "./menu-mock-data.service";

/**
 * Central state management service for menu data.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * Uses Angular signals for reactive state management.
 * Syncs with localStorage via effects (FR-028, FR-029).
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for state structure
 * @see specs/001-jira-sidebar-nav/tasks.md Task T014
 */
@Injectable({
  providedIn: "root",
})
export class MenuDataService {
  // ========== DEPENDENCIES ==========

  private readonly mockDataService = inject(MenuMockDataService);

  // ========== SIGNALS (State) ==========

  /**
   * Menu structure signal (reactive state).
   */
  private menuStructureSignal = signal<MenuStructure>(
    this.initializeMenuStructure(),
  );

  /**
   * Sidebar state signal (reactive state).
   */
  private sidebarStateSignal = signal<SidebarState>(
    this.initializeSidebarState(),
  );

  // ========== COMPUTED SIGNALS ==========

  /**
   * Read-only menu structure (computed).
   */
  readonly menuStructure = this.menuStructureSignal.asReadonly();

  /**
   * Read-only sidebar state (computed).
   */
  readonly sidebarState = this.sidebarStateSignal.asReadonly();

  /**
   * Root menu items (computed from structure).
   */
  readonly rootItems = computed(() => this.menuStructure().rootItems);

  /**
   * Current active item (computed from state).
   */
  readonly activeItem = computed(() => {
    const activeId = this.sidebarState().activeItemId;
    if (!activeId) return null;
    return this.menuStructure().itemsById.get(activeId) || null;
  });

  /**
   * Is sidebar visible (computed from state).
   */
  readonly isSidebarVisible = computed(() => {
    const mode = this.sidebarState().visibilityMode;
    return (
      mode === SidebarVisibilityMode.TEMPORARY_VISIBLE ||
      mode === SidebarVisibilityMode.LOCKED_VISIBLE
    );
  });

  /**
   * Is sidebar locked (computed from state).
   */
  readonly isSidebarLocked = computed(() => this.sidebarState().isLocked);

  /**
   * Is edit mode active (computed from state).
   */
  readonly isEditMode = computed(() => this.sidebarState().isEditMode);

  constructor() {
    // Setup localStorage sync effects
    this.setupLocalStorageSyncEffects();
  }

  // ========== INITIALIZATION ==========

  /**
   * Initialize menu structure from localStorage or default data.
   */
  private initializeMenuStructure(): MenuStructure {
    // Try to load from localStorage
    const savedItems = MenuLocalStorage.loadMenuStructure();
    const rootItems =
      savedItems || this.mockDataService.getDefaultMenuStructure();

    // Build structure
    const itemsById = MenuTreeUtils.buildItemsMap(rootItems);
    const maxDepth = MenuTreeUtils.calculateMaxDepth(rootItems);
    const totalItemCount = MenuTreeUtils.countTotalItems(rootItems);

    const structure: MenuStructure = {
      rootItems,
      itemsById,
      maxDepth,
      totalItemCount,
      version: 1,
      metadata: {
        lastModified: new Date(),
        source: savedItems
          ? MenuDataSource.LOCAL_STORAGE
          : MenuDataSource.DEFAULT,
      },
    };

    // Validate structure (throws if max depth exceeded)
    MenuTreeUtils.validateStructure(structure);

    return structure;
  }

  /**
   * Initialize sidebar state from localStorage or defaults.
   */
  private initializeSidebarState(): SidebarState {
    const savedLocked = MenuLocalStorage.loadSidebarLocked();
    const savedWidth = MenuLocalStorage.loadSidebarWidth();
    const savedExpandedNodes = MenuLocalStorage.loadExpandedNodes();

    return {
      visibilityMode: savedLocked
        ? SidebarVisibilityMode.LOCKED_VISIBLE
        : SidebarVisibilityMode.HIDDEN,
      isLocked: savedLocked,
      isEditMode: false,
      currentWidth: savedWidth,
      expandedNodeIds: new Set(savedExpandedNodes),
      activeItemId: null,
      autoHideTimerActive: false,
    };
  }

  /**
   * Setup effects to sync state to localStorage.
   */
  private setupLocalStorageSyncEffects(): void {
    // Sync menu structure to localStorage
    effect(() => {
      const structure = this.menuStructure();
      MenuLocalStorage.saveMenuStructure(structure.rootItems);
    });

    // Sync expanded nodes to localStorage
    effect(() => {
      const expandedNodes = Array.from(this.sidebarState().expandedNodeIds);
      MenuLocalStorage.saveExpandedNodes(expandedNodes);
    });

    // Sync sidebar locked state to localStorage
    effect(() => {
      const locked = this.sidebarState().isLocked;
      MenuLocalStorage.saveSidebarLocked(locked);
    });

    // Sync sidebar width to localStorage
    effect(() => {
      const width = this.sidebarState().currentWidth;
      MenuLocalStorage.saveSidebarWidth(width);
    });
  }

  // ========== MENU STRUCTURE MUTATIONS ==========

  /**
   * Add new menu item (FR-015, FR-016).
   *
   * @param item New menu item to add
   * @param parentId Parent item ID (null for root level)
   * @returns true if successful, false otherwise
   */
  addItem(item: MenuItem, parentId: string | null = null): boolean {
    const currentStructure = this.menuStructureSignal();

    // Clone root items for immutability
    const newRootItems = MenuTreeUtils.cloneItems(currentStructure.rootItems);

    if (parentId === null) {
      // Add to root level
      newRootItems.push(item);
    } else {
      // Find parent and add as child
      const parent = this.findItemInTree(parentId, newRootItems);
      if (!parent) {
        console.error(`[MenuDataService] Parent item not found: ${parentId}`);
        return false;
      }

      // Check if adding would exceed max depth
      if (MenuTreeUtils.wouldExceedMaxDepth(parent, item, newRootItems)) {
        console.error(
          "[MenuDataService] Adding item would exceed maximum depth",
        );
        return false;
      }

      if (!parent.children) {
        parent.children = [];
      }

      // CONTENT CONFIG TRANSFER: If parent is becoming a parent for the first time
      // and has contentConfig, transfer it to the new child
      if (parent.children.length === 0 && parent.contentConfig) {
        item.contentConfig = { ...parent.contentConfig };
        delete parent.contentConfig;
        console.log(
          `[MenuDataService] Transferred contentConfig from parent "${parent.label}" to child "${item.label}"`,
        );
      }

      parent.children.push(item);
    }

    // Update structure
    this.updateMenuStructure(newRootItems);
    return true;
  }

  /**
   * Add nested submenu hierarchy (T063, FR-022).
   * Recursively adds a nested structure of menu items.
   *
   * @param parentId - ID of parent item (null for root level)
   * @param nestedStructure - Root of the nested MenuItem tree
   * @returns true if successful, false otherwise
   */
  addSubmenu(parentId: string | null, nestedStructure: MenuItem): boolean {
    const currentStructure = this.menuStructureSignal();
    const newRootItems = MenuTreeUtils.cloneItems(currentStructure.rootItems);

    // Helper to recursively add items to itemsById map
    const addToMap = (item: MenuItem, map: Map<string, MenuItem>): void => {
      map.set(item.id, item);
      if (item.children) {
        item.children.forEach((child) => addToMap(child, map));
      }
    };

    if (!parentId) {
      // Add at root level
      newRootItems.push(nestedStructure);
    } else {
      // Find parent and add as child
      const parent = this.findItemInTree(parentId, newRootItems);
      if (!parent) {
        console.error(`[MenuDataService] Parent item not found: ${parentId}`);
        return false;
      }

      // Check if adding would exceed max depth
      if (
        MenuTreeUtils.wouldExceedMaxDepth(parent, nestedStructure, newRootItems)
      ) {
        console.error(
          "[MenuDataService] Adding submenu would exceed maximum depth",
        );
        return false;
      }

      if (!parent.children) {
        parent.children = [];
      }

      // CONTENT CONFIG CLEANUP: If parent is becoming a parent for the first time
      // and has contentConfig, remove it (transfer is handled in the form)
      if (parent.children.length === 0 && parent.contentConfig) {
        delete parent.contentConfig;
        console.log(
          `[MenuDataService] Removed contentConfig from parent "${parent.label}" (transferred via form)`,
        );
      }

      parent.children.push(nestedStructure);
    }

    // Update structure (this will rebuild itemsById map)
    this.updateMenuStructure(newRootItems);
    return true;
  }

  /**
   * Update existing menu item (FR-020, FR-021).
   *
   * @param itemId ID of item to update
   * @param updates Partial updates to apply
   * @returns true if successful, false otherwise
   */
  updateItem(itemId: string, updates: Partial<MenuItem>): boolean {
    const currentStructure = this.menuStructureSignal();
    const newRootItems = MenuTreeUtils.cloneItems(currentStructure.rootItems);

    const item = this.findItemInTree(itemId, newRootItems);
    if (!item) {
      console.error(`[MenuDataService] Item not found: ${itemId}`);
      return false;
    }

    // Apply updates
    Object.assign(item, updates);

    // Validate label if updated
    if (updates.label && updates.label.trim().length === 0) {
      console.error("[MenuDataService] Label cannot be empty");
      return false;
    }

    this.updateMenuStructure(newRootItems);
    return true;
  }

  /**
   * Delete menu item (FR-024).
   *
   * @param itemId ID of item to delete
   * @returns true if successful, false otherwise
   */
  deleteItem(itemId: string): boolean {
    const currentStructure = this.menuStructureSignal();
    const newRootItems = MenuTreeUtils.cloneItems(currentStructure.rootItems);

    // Try to remove from root
    const rootIndex = newRootItems.findIndex((item) => item.id === itemId);
    if (rootIndex !== -1) {
      newRootItems.splice(rootIndex, 1);
      this.updateMenuStructure(newRootItems);
      return true;
    }

    // Find and remove from parent's children
    const parent = MenuTreeUtils.findParent(itemId, newRootItems);
    if (parent && parent.children) {
      const childIndex = parent.children.findIndex(
        (child) => child.id === itemId,
      );
      if (childIndex !== -1) {
        parent.children.splice(childIndex, 1);
        this.updateMenuStructure(newRootItems);
        return true;
      }
    }

    console.error(`[MenuDataService] Item not found for deletion: ${itemId}`);
    return false;
  }

  /**
   * Move menu item (drag-drop, FR-026).
   *
   * @param itemId ID of item to move
   * @param newParentId New parent ID (null for root)
   * @param newIndex New index within parent/root
   * @returns true if successful, false otherwise
   */
  moveItem(
    itemId: string,
    newParentId: string | null,
    newIndex: number,
  ): boolean {
    console.log("🔧 [MenuDataService] moveItem called:", {
      itemId,
      newParentId: newParentId || "ROOT",
      newIndex,
    });

    const currentStructure = this.menuStructureSignal();
    const newRootItems = MenuTreeUtils.cloneItems(currentStructure.rootItems);

    // Find item and remove from old location
    const item = this.findItemInTree(itemId, newRootItems);
    if (!item) {
      console.error(`❌ [MenuDataService] Item not found: ${itemId}`);
      return false;
    }

    console.log("📦 [MenuDataService] Item found:", {
      id: item.id,
      label: item.label,
      hasChildren: !!(item.children && item.children.length > 0),
    });

    // Remove from old location
    if (!this.removeItemFromTree(itemId, newRootItems)) {
      console.error(
        `❌ [MenuDataService] Failed to remove item from tree: ${itemId}`,
      );
      return false;
    }

    console.log("✂️ [MenuDataService] Item removed from old location");

    // Add to new location
    if (newParentId === null) {
      // Insert at root
      console.log(`⬆️ [MenuDataService] Inserting at root, index ${newIndex}`);
      newRootItems.splice(newIndex, 0, item);
    } else {
      const newParent = this.findItemInTree(newParentId, newRootItems);
      if (!newParent) {
        console.error(
          `❌ [MenuDataService] New parent not found: ${newParentId}`,
        );
        return false;
      }

      console.log(`➡️ [MenuDataService] Moving to parent:`, {
        parentId: newParent.id,
        parentLabel: newParent.label,
        targetIndex: newIndex,
      });

      // Check for circular reference
      if (MenuTreeUtils.wouldCreateCircularReference(item, newParent)) {
        console.error(
          "❌ [MenuDataService] Move would create circular reference",
        );
        return false;
      }

      // Check depth
      if (MenuTreeUtils.wouldExceedMaxDepth(newParent, item, newRootItems)) {
        console.error("❌ [MenuDataService] Move would exceed maximum depth");
        return false;
      }

      if (!newParent.children) {
        newParent.children = [];
      }

      // CONTENT CONFIG TRANSFER: If parent is becoming a parent for the first time
      // and has contentConfig, transfer it to the first child
      if (newParent.children.length === 0 && newParent.contentConfig) {
        item.contentConfig = { ...newParent.contentConfig };
        delete newParent.contentConfig;
        console.log(
          `🔄 [MenuDataService] Transferred contentConfig from "${newParent.label}" to "${item.label}" during move`,
        );
      }

      newParent.children.splice(newIndex, 0, item);
      console.log(
        `✅ [MenuDataService] Item inserted at index ${newIndex} in parent "${newParent.label}"`,
      );
    }

    this.updateMenuStructure(newRootItems);
    console.log("💾 [MenuDataService] Menu structure updated and saved");
    return true;
  }

  /**
   * Move item onto another item with special merge logic.
   * When both items have contentConfig:
   * - Target becomes parent (loses contentConfig)
   * - Target's original contentConfig goes to new auto-created child
   * - Dragged item becomes another child (keeps its contentConfig)
   *
   * @param draggedItemId - ID of item being dragged
   * @param targetItemId - ID of item being dropped onto
   * @returns true if successful, false otherwise
   */
  mergeItemsWithConfig(draggedItemId: string, targetItemId: string): boolean {
    const currentStructure = this.menuStructureSignal();
    const newRootItems = MenuTreeUtils.cloneItems(currentStructure.rootItems);

    // Find both items
    const draggedItem = this.findItemInTree(draggedItemId, newRootItems);
    const targetItem = this.findItemInTree(targetItemId, newRootItems);

    if (!draggedItem || !targetItem) {
      console.error("[MenuDataService] Items not found for merge");
      return false;
    }

    // Check for circular reference
    if (MenuTreeUtils.wouldCreateCircularReference(draggedItem, targetItem)) {
      console.error("[MenuDataService] Merge would create circular reference");
      return false;
    }

    // Both must have contentConfig for this operation
    if (!draggedItem.contentConfig || !targetItem.contentConfig) {
      console.error(
        "[MenuDataService] Both items must have contentConfig for merge",
      );
      return false;
    }

    // Target must not already have children
    if (targetItem.children && targetItem.children.length > 0) {
      console.error(
        "[MenuDataService] Target already has children, cannot merge",
      );
      return false;
    }

    // Create new child with target's original label + " Content"
    const newChildId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const originalContentChild: MenuItem = {
      id: newChildId,
      label: `${targetItem.label} Content`,
      icon: targetItem.icon,
      order: 0,
      expanded: false,
      contentConfig: { ...targetItem.contentConfig },
    };

    // Remove dragged item from its current location
    if (!this.removeItemFromTree(draggedItemId, newRootItems)) {
      return false;
    }

    // Update target: remove contentConfig, add children
    delete targetItem.contentConfig;
    targetItem.children = [originalContentChild, draggedItem];
    targetItem.expanded = true; // Auto-expand to show new structure

    console.log(
      `[MenuDataService] Merged "${draggedItem.label}" into "${targetItem.label}" with original content preserved`,
    );

    this.updateMenuStructure(newRootItems);
    return true;
  }

  // ========== SIDEBAR STATE MUTATIONS ==========

  /**
   * Set sidebar visibility mode.
   */
  setSidebarVisibility(mode: SidebarVisibilityMode): void {
    this.sidebarStateSignal.update((state) => ({
      ...state,
      visibilityMode: mode,
      currentWidth: mode === SidebarVisibilityMode.HIDDEN ? 20 : 280,
    }));
  }

  /**
   * Lock/unlock sidebar (FR-011).
   */
  setSidebarLocked(locked: boolean): void {
    this.sidebarStateSignal.update((state) => ({
      ...state,
      isLocked: locked,
      visibilityMode: locked
        ? SidebarVisibilityMode.LOCKED_VISIBLE
        : SidebarVisibilityMode.TEMPORARY_VISIBLE,
    }));
  }

  /**
   * Toggle edit mode (FR-014).
   */
  setEditMode(enabled: boolean): void {
    this.sidebarStateSignal.update((state) => ({
      ...state,
      isEditMode: enabled,
    }));
  }

  /**
   * Set active menu item (FR-004).
   */
  setActiveItem(itemId: string | null): void {
    this.sidebarStateSignal.update((state) => ({
      ...state,
      activeItemId: itemId,
    }));
  }

  /**
   * Toggle node expansion (FR-005).
   */
  toggleNodeExpansion(itemId: string): void {
    this.sidebarStateSignal.update((state) => {
      const newExpandedNodeIds = new Set(state.expandedNodeIds);
      if (newExpandedNodeIds.has(itemId)) {
        newExpandedNodeIds.delete(itemId);
      } else {
        newExpandedNodeIds.add(itemId);
      }
      return {
        ...state,
        expandedNodeIds: newExpandedNodeIds,
      };
    });

    // Update expanded state in menu item
    this.updateItem(itemId, {
      expanded: this.sidebarState().expandedNodeIds.has(itemId),
    });
  }

  /**
   * Set auto-hide timer active state.
   */
  setAutoHideTimerActive(active: boolean): void {
    this.sidebarStateSignal.update((state) => ({
      ...state,
      autoHideTimerActive: active,
    }));
  }

  // ========== UTILITY METHODS ==========

  /**
   * Reset menu structure to default.
   */
  resetToDefault(): void {
    const defaultItems = this.mockDataService.getDefaultMenuStructure();
    this.updateMenuStructure(defaultItems);
    MenuLocalStorage.clear();
  }

  /**
   * Get item by ID.
   */
  getItemById(itemId: string): MenuItem | undefined {
    return this.menuStructure().itemsById.get(itemId);
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Reorder menu items (from drag-drop editor).
   *
   * @param newRootItems New ordered menu items (replacing entire structure)
   * @returns true if successful, false otherwise
   */
  setRootItems(newRootItems: MenuItem[]): boolean {
    try {
      // Clone for immutability
      const clonedItems = MenuTreeUtils.cloneItems(newRootItems);

      // Update structure (will validate and rebuild maps)
      this.updateMenuStructure(clonedItems);

      console.log("[MenuDataService] Root items updated successfully");
      return true;
    } catch (error) {
      console.error("[MenuDataService] Failed to set root items:", error);
      return false;
    }
  }

  /**
   * Update menu structure and recalculate derived data.
   */
  private updateMenuStructure(newRootItems: MenuItem[]): void {
    const itemsById = MenuTreeUtils.buildItemsMap(newRootItems);
    const maxDepth = MenuTreeUtils.calculateMaxDepth(newRootItems);
    const totalItemCount = MenuTreeUtils.countTotalItems(newRootItems);

    const newStructure: MenuStructure = {
      rootItems: newRootItems,
      itemsById,
      maxDepth,
      totalItemCount,
      version: this.menuStructureSignal().version + 1,
      metadata: {
        lastModified: new Date(),
        source: MenuDataSource.LOCAL_STORAGE,
      },
    };

    // Validate before updating (throws if invalid)
    MenuTreeUtils.validateStructure(newStructure);

    this.menuStructureSignal.set(newStructure);
  }

  /**
   * Find item in tree (mutable search for updates).
   */
  private findItemInTree(itemId: string, items: MenuItem[]): MenuItem | null {
    for (const item of items) {
      if (item.id === itemId) return item;
      if (item.children) {
        const found = this.findItemInTree(itemId, item.children);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Remove item from tree (mutable operation).
   */
  private removeItemFromTree(itemId: string, items: MenuItem[]): boolean {
    const index = items.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      items.splice(index, 1);
      return true;
    }

    for (const item of items) {
      if (item.children && this.removeItemFromTree(itemId, item.children)) {
        return true;
      }
    }

    return false;
  }
}
