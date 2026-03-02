import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  CdkDrag,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import {
  NgbActiveOffcanvas,
  NgbModal,
  NgbNavModule,
} from "@ng-bootstrap/ng-bootstrap";
import { MenuItem } from "../../../models";
import { ConfigInheritanceModalComponent } from "../config-inheritance-modal/config-inheritance-modal.component";

/**
 * Flat menu item for drag-drop operations
 */
interface FlatMenuItem {
  item: MenuItem;
  level: number;
  parentId: string | null;
  hasChildren: boolean;
}

/**
 * Menu Settings Offcanvas Component.
 * Provides drag-and-drop reordering and menu behavior settings.
 */
@Component({
  selector: "app-menu-reorder-offcanvas",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbNavModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
  ],
  templateUrl: "./menu-reorder-offcanvas.component.html",
  styleUrl: "./menu-reorder-offcanvas.component.scss",
})
export class MenuReorderOffcanvasComponent {
  @Input() menuItems: MenuItem[] = [];
  @Output() menuReordered = new EventEmitter<MenuItem[]>();
  @Output() settingsChanged = new EventEmitter<{
    autoSelectFirstChild: boolean;
    lockMenuEnabled: boolean;
    alwaysShowMenu: boolean;
  }>();

  activeOffcanvas = inject(NgbActiveOffcanvas);
  private modalService = inject(NgbModal);
  private document = inject(DOCUMENT);

  // Active tab ID
  activeTab = 1; // 1 = Reorder, 2 = Settings

  // Settings
  autoSelectFirstChild = false;
  lockMenuEnabled = true; // Default to current behavior (lock/unlock button)
  alwaysShowMenu = true; // Default to always show when lockMenu is disabled

  // Flat array for drag-drop
  flatItems: FlatMenuItem[] = [];

  // Track expanded state
  expandedIds = new Set<string>();

  // Track currently dragging item
  draggingItem: FlatMenuItem | null = null;

  // Track mouse position for left/right half detection
  private lastMouseX = 0;
  private lastMouseY = 0;

  ngOnInit(): void {
    // Deep clone menu items to avoid mutating original
    this.menuItems = JSON.parse(JSON.stringify(this.menuItems));

    // Initialize children arrays to ensure consistency
    this.initializeChildren(this.menuItems);

    // Collect expanded IDs
    this.collectExpandedIds(this.menuItems);

    // Flatten the nested structure for drag-drop
    this.flatItems = this.flattenMenuItems(this.menuItems);

    console.log("📋 Initialized with flat items:", this.flatItems);

    // Load settings from localStorage
    this.loadSettings();
  }

  /**
   * Collect all expanded item IDs.
   */
  collectExpandedIds(items: MenuItem[]): void {
    items.forEach((item) => {
      if (item.expanded) {
        this.expandedIds.add(item.id);
      }
      if (item.children && item.children.length > 0) {
        this.collectExpandedIds(item.children);
      }
    });
  }

  /**
   * Flatten nested menu items into a single array with level tracking.
   */
  flattenMenuItems(
    items: MenuItem[],
    level: number = 0,
    parentId: string | null = null,
  ): FlatMenuItem[] {
    const result: FlatMenuItem[] = [];

    items.forEach((item) => {
      const hasChildren = !!(item.children && item.children.length > 0);

      result.push({
        item,
        level,
        parentId,
        hasChildren,
      });

      // Recursively flatten children
      if (hasChildren) {
        const childrenFlat = this.flattenMenuItems(
          item.children!,
          level + 1,
          item.id,
        );
        result.push(...childrenFlat);
      }
    });

    return result;
  }

  /**
   * Get visible items (only show items whose parents are all expanded).
   * Also hide descendants of currently dragging item.
   */
  get visibleItems(): FlatMenuItem[] {
    return this.flatItems.filter((flatItem) => {
      // Hide descendants of the item being dragged
      if (
        this.draggingItem &&
        this.isDescendantOf(flatItem, this.draggingItem)
      ) {
        return false;
      }

      // Root level items are always visible
      if (flatItem.level === 0) {
        return true;
      }

      // Check if all ancestors are expanded
      return this.areAncestorsExpanded(flatItem);
    });
  }

  /**
   * Check if an item is a descendant of another item.
   */
  isDescendantOf(item: FlatMenuItem, potentialParent: FlatMenuItem): boolean {
    const parentIndex = this.flatItems.indexOf(potentialParent);
    const itemIndex = this.flatItems.indexOf(item);

    // Item must come after parent in the flat array
    if (itemIndex <= parentIndex) {
      return false;
    }

    // Check if item's level is greater than parent's level and comes before next sibling
    if (item.level > potentialParent.level) {
      // Find the next item at or below the parent's level
      for (let i = parentIndex + 1; i < this.flatItems.length; i++) {
        if (
          this.flatItems[i].level <= potentialParent.level &&
          i !== itemIndex
        ) {
          // Found a sibling or uncle before reaching this item
          return i > itemIndex;
        }
        if (i === itemIndex) {
          return true;
        }
      }
      return true; // Item is at the end and has higher level
    }

    return false;
  }

  /**
   * Check if all ancestors of an item are expanded.
   */
  areAncestorsExpanded(flatItem: FlatMenuItem): boolean {
    let currentParentId = flatItem.parentId;

    while (currentParentId) {
      // If any parent is not expanded, return false
      if (!this.expandedIds.has(currentParentId)) {
        return false;
      }

      // Find the parent in flat items
      const parent = this.flatItems.find(
        (fi) => fi.item.id === currentParentId,
      );
      if (!parent) {
        return false;
      }

      currentParentId = parent.parentId;
    }

    return true;
  }

  /**
   * Load settings from localStorage.
   */
  loadSettings(): void {
    const savedSettings = localStorage.getItem("jira-sidebar-settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.autoSelectFirstChild = settings.autoSelectFirstChild || false;
        this.lockMenuEnabled =
          settings.lockMenuEnabled !== undefined
            ? settings.lockMenuEnabled
            : true;
        this.alwaysShowMenu =
          settings.alwaysShowMenu !== undefined
            ? settings.alwaysShowMenu
            : true;
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
  }

  /**
   * Save settings to localStorage and emit change.
   */
  saveSettings(): void {
    const settings = {
      autoSelectFirstChild: this.autoSelectFirstChild,
      lockMenuEnabled: this.lockMenuEnabled,
      alwaysShowMenu: this.alwaysShowMenu,
    };
    localStorage.setItem("jira-sidebar-settings", JSON.stringify(settings));
    this.settingsChanged.emit(settings);
  }

  /**
   * Initialize children arrays for all nodes.
   */
  initializeChildren(nodes: MenuItem[]): void {
    nodes.forEach((node) => {
      if (!node.children) {
        node.children = [];
      }
      if (node.children.length > 0) {
        this.initializeChildren(node.children);
      }
    });
  }

  /**
   * Toggle expansion of an item.
   */
  toggleExpansion(item: MenuItem): void {
    console.log(
      "🔄 TOGGLE EXPANSION:",
      item.label,
      "expanding:",
      !this.expandedIds.has(item.id),
    );

    if (this.expandedIds.has(item.id)) {
      this.expandedIds.delete(item.id);
      item.expanded = false;
    } else {
      this.expandedIds.add(item.id);
      item.expanded = true;
    }
  }

  /**
   * Check if item is expanded.
   */
  isExpanded(item: MenuItem): boolean {
    return this.expandedIds.has(item.id);
  }

  /**
   * Handle drag started - hide descendants of dragging item.
   */
  onDragStarted(flatItem: FlatMenuItem): void {
    console.log("🎯 DRAG STARTED:", flatItem.item.label);
    this.draggingItem = flatItem;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    const descendants = this.getDescendants(flatItem);
    console.log(
      "  Hiding descendants:",
      descendants.map((d) => d.item.label),
    );
  }

  /**
   * Track mouse position during drag for left/right half detection.
   */
  onDragMoved(event: CdkDragMove): void {
    this.lastMouseX = event.pointerPosition.x;
    this.lastMouseY = event.pointerPosition.y;
  }

  /**
   * Handle drag ended - show all items again.
   */
  onDragEnded(): void {
    console.log("🏁 DRAG ENDED");
    this.draggingItem = null;
  }

  /**
   * Handle drop event.
   */
  async drop(event: CdkDragDrop<FlatMenuItem[]>): Promise<void> {
    console.log("🔽 DROP EVENT TRIGGERED");
    console.log("  Previous Index:", event.previousIndex);
    console.log("  Current Index:", event.currentIndex);

    // Check if dropping on right half of the container (make child)
    const containerBounds = this.document
      .querySelector(".root-drop-list")
      ?.getBoundingClientRect();

    let isRightHalf = false;
    if (containerBounds && this.lastMouseX > 0) {
      const containerWidth = containerBounds.width;
      const containerLeft = containerBounds.left;
      const relativeX = this.lastMouseX - containerLeft;
      isRightHalf = relativeX > containerWidth / 2;

      console.log("  Container bounds:", {
        width: containerWidth,
        left: containerLeft,
      });
      console.log("  Mouse X:", this.lastMouseX, "Relative X:", relativeX);
      console.log("  Is Right Half:", isRightHalf);
    }

    // If same position but NOT right half, no change needed
    // Also if same position at index 0 with right half, no change (can't make child of nothing)
    if (
      event.previousIndex === event.currentIndex &&
      (!isRightHalf || event.currentIndex === 0)
    ) {
      console.log("  ⚠️ Same position, left half or at position 0 - no change");
      this.draggingItem = null;
      return;
    }

    const draggedItem = this.visibleItems[event.previousIndex];
    console.log(
      "  Dragged visible item:",
      draggedItem.item.label,
      "level:",
      draggedItem.level,
    );

    // Determine target parent for right-half drops BEFORE removing items
    let targetParentForRightHalf: FlatMenuItem | null = null;
    if (isRightHalf && event.currentIndex > 0) {
      // For same position drop, use the item before the current position
      // For different position drop, use the item at currentIndex - 1
      targetParentForRightHalf = this.visibleItems[event.currentIndex - 1];
      console.log(
        "  Target parent for right-half drop:",
        targetParentForRightHalf.item.label,
      );
    }

    // Get all descendants of the dragged item
    const descendants = this.getDescendants(draggedItem);
    console.log(
      "  Descendants:",
      descendants.map((d) => d.item.label),
    );

    // Move the item and its descendants
    const allMovingItems = [draggedItem, ...descendants];
    const movingCount = allMovingItems.length;

    console.log(
      "  Moving items:",
      allMovingItems.map((i) => i.item.label),
    );

    // Store original index before removing (for potential restoration on cancel)
    const originalIndex = this.flatItems.indexOf(draggedItem);

    // Remove from flat array
    allMovingItems.forEach((item) => {
      const index = this.flatItems.indexOf(item);
      if (index > -1) {
        this.flatItems.splice(index, 1);
      }
    });

    // Determine new level based on drop position and right/left half
    let newLevel: number;

    if (isRightHalf && targetParentForRightHalf) {
      // Check if target parent has configuration and no children (or will become parent for first time)
      const hasConfig =
        targetParentForRightHalf.item.contentConfig !== undefined;
      const hasNoChildren = !targetParentForRightHalf.hasChildren;

      if (hasConfig && hasNoChildren) {
        console.log(
          "  ⚠️ Target parent has configuration -",
          targetParentForRightHalf.item.label,
        );

        // Show modal for configuration inheritance
        const modalRef = this.modalService.open(
          ConfigInheritanceModalComponent,
          {
            centered: true,
            backdrop: "static",
          },
        );

        modalRef.componentInstance.parentLabel =
          targetParentForRightHalf.item.label;
        modalRef.componentInstance.defaultChildName = `${targetParentForRightHalf.item.label} (Config)`;

        try {
          const childName = await modalRef.result;

          console.log(
            "  ✅ Creating new child with inherited config:",
            childName,
          );

          // Create new child item with inherited configuration
          const newConfigChild: FlatMenuItem = {
            item: {
              id: `item-${Date.now()}-config-${Math.random().toString(36).substr(2, 9)}`,
              label: childName,
              icon: targetParentForRightHalf.item.icon,
              contentConfig: targetParentForRightHalf.item.contentConfig,
              order: 0,
            },
            level: targetParentForRightHalf.level + 1,
            parentId: targetParentForRightHalf.item.id,
            hasChildren: false,
          };

          // Remove contentConfig from parent (it's now inherited by child)
          delete targetParentForRightHalf.item.contentConfig;

          // We'll add this child after the dropped item is inserted
          // Store it temporarily
          (targetParentForRightHalf as any).pendingConfigChild = newConfigChild;
        } catch (error) {
          console.log("  ❌ User cancelled - configuration transfer aborted");
          // Restore items to their original position and abort drop
          this.flatItems.splice(originalIndex, 0, ...allMovingItems);
          this.draggingItem = null;
          return;
        }
      }

      // Right half: make child of the target parent we identified earlier
      newLevel = targetParentForRightHalf.level + 1;
      console.log(
        "  ⚡ RIGHT HALF DROP - Making child of:",
        targetParentForRightHalf.item.label,
      );
      console.log("  New level will be:", newLevel);
    } else {
      // Left half: same level as item at drop position
      newLevel = this.calculateNewLevel(
        event.currentIndex,
        event.previousIndex,
      );
      console.log("  ⬅️ LEFT HALF DROP - Same level as drop position");
    }

    const levelDiff = newLevel - draggedItem.level;

    console.log("  New level:", newLevel, "Level diff:", levelDiff);

    // Adjust levels for all moving items
    allMovingItems.forEach((item) => {
      item.level += levelDiff;
    });

    // Calculate actual insertion index in flat array
    const insertIndex = this.calculateInsertIndex(
      event.currentIndex,
      event.previousIndex,
    );
    console.log("  Insert index in flat array:", insertIndex);

    // Insert at new position
    this.flatItems.splice(insertIndex, 0, ...allMovingItems);

    // Update parent IDs based on new positions and levels
    this.updateParentIds();

    // If there's a pending config child to add, insert it now
    if (
      targetParentForRightHalf &&
      (targetParentForRightHalf as any).pendingConfigChild
    ) {
      const configChild = (targetParentForRightHalf as any).pendingConfigChild;

      // Find the target parent in the updated flat items
      const parentIndex = this.flatItems.findIndex(
        (fi) => fi.item.id === targetParentForRightHalf.item.id,
      );

      if (parentIndex !== -1) {
        // Insert config child right after the parent (index 0 for children)
        this.flatItems.splice(parentIndex + 1, 0, configChild);

        // Update hasChildren flag for parent
        this.flatItems[parentIndex].hasChildren = true;

        // Update order properties for all children of this parent
        // to ensure config child is always first
        const parentLevel = this.flatItems[parentIndex].level;
        let childOrder = 0;
        for (let i = parentIndex + 1; i < this.flatItems.length; i++) {
          const item = this.flatItems[i];

          // Stop when we reach an item that's not a child
          if (item.level <= parentLevel) {
            break;
          }

          // Only update direct children (not grandchildren)
          if (item.level === parentLevel + 1) {
            item.item.order = childOrder++;
          }
        }

        // Update parent IDs again to ensure everything is correct
        this.updateParentIds();

        console.log(
          "  ✅ Added config child at index 0:",
          configChild.item.label,
          "under",
          targetParentForRightHalf.item.label,
        );
      }

      // Clean up temporary property
      delete (targetParentForRightHalf as any).pendingConfigChild;
    }

    console.log("  ✅ Drop completed");
    console.log(
      "  New flat items:",
      this.flatItems.map((fi) => `${fi.item.label} (L${fi.level})`),
    );

    // Clear dragging state
    this.draggingItem = null;
  }

  /**
   * Get all descendants of an item.
   */
  getDescendants(flatItem: FlatMenuItem): FlatMenuItem[] {
    const descendants: FlatMenuItem[] = [];
    const startIndex = this.flatItems.indexOf(flatItem);

    if (startIndex === -1) {
      return descendants;
    }

    // Collect all items below this one that have a higher level (are children/descendants)
    for (let i = startIndex + 1; i < this.flatItems.length; i++) {
      const item = this.flatItems[i];
      if (item.level <= flatItem.level) {
        // Reached a sibling or parent level, stop
        break;
      }
      descendants.push(item);
    }

    return descendants;
  }

  /**
   * Calculate new level based on drop position.
   */
  calculateNewLevel(dropIndex: number, dragIndex: number): number {
    const visibleItems = this.visibleItems;

    // If dropped at the end
    if (dropIndex >= visibleItems.length) {
      if (visibleItems.length === 0) return 0;
      const lastVisible = visibleItems[visibleItems.length - 1];
      return lastVisible.level;
    }

    // If moving down, look at item that will be above after drop
    if (dropIndex > dragIndex) {
      const itemAbove = visibleItems[dropIndex];
      return itemAbove ? itemAbove.level : 0;
    }

    // Moving up - look at the item at drop position
    const itemAtDrop = visibleItems[dropIndex];
    return itemAtDrop ? itemAtDrop.level : 0;
  }

  /**
   * Calculate insertion index in the flat array based on visible drop index.
   */
  calculateInsertIndex(
    visibleDropIndex: number,
    visibleDragIndex: number,
  ): number {
    const visibleItems = this.visibleItems;

    // If dropping at the end
    if (visibleDropIndex >= visibleItems.length) {
      return this.flatItems.length;
    }

    // Get the target visible item at drop position
    const targetVisible = visibleItems[visibleDropIndex];
    const targetIndexInFlat = this.flatItems.indexOf(targetVisible);

    return targetIndexInFlat;
  }

  /**
   * Update parent IDs for all items based on their levels and positions.
   */
  updateParentIds(): void {
    const levelStack: Array<{ id: string; level: number }> = [];

    this.flatItems.forEach((flatItem) => {
      // Remove items from stack that are not ancestors
      while (
        levelStack.length > 0 &&
        levelStack[levelStack.length - 1].level >= flatItem.level
      ) {
        levelStack.pop();
      }

      // Set parent ID
      if (levelStack.length > 0) {
        flatItem.parentId = levelStack[levelStack.length - 1].id;
      } else {
        flatItem.parentId = null;
      }

      // Update hasChildren flag
      const nextItem = this.flatItems[this.flatItems.indexOf(flatItem) + 1];
      flatItem.hasChildren = nextItem && nextItem.level > flatItem.level;

      // Add this item to the stack
      levelStack.push({ id: flatItem.item.id, level: flatItem.level });
    });
  }

  /**
   * Rebuild nested menu structure from flat array.
   */
  rebuildNestedStructure(): MenuItem[] {
    console.log("🔨 Rebuilding nested structure from flat items");

    const result: MenuItem[] = [];
    const itemMap = new Map<string, MenuItem>();

    // First pass: create all items and add to map
    this.flatItems.forEach((flatItem) => {
      const item: MenuItem = {
        ...flatItem.item,
        children: [],
        expanded: this.expandedIds.has(flatItem.item.id),
      };
      itemMap.set(item.id, item);
    });

    // Second pass: build hierarchy
    this.flatItems.forEach((flatItem) => {
      const item = itemMap.get(flatItem.item.id)!;

      if (flatItem.parentId) {
        const parent = itemMap.get(flatItem.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(item);
        } else {
          console.warn(
            "⚠️ Parent not found for",
            item.label,
            "parent ID:",
            flatItem.parentId,
          );
          result.push(item);
        }
      } else {
        // Root level item
        result.push(item);
      }
    });

    console.log("  Rebuilt structure:", result);
    return result;
  }

  /**
   * Save reordered menu structure.
   */
  save(): void {
    // Rebuild nested structure from flat array
    this.menuItems = this.rebuildNestedStructure();
    this.menuReordered.emit(this.menuItems);
    this.activeOffcanvas.close(this.menuItems);
  }

  /**
   * Cancel and close offcanvas.
   */
  cancel(): void {
    this.activeOffcanvas.dismiss();
  }
}
