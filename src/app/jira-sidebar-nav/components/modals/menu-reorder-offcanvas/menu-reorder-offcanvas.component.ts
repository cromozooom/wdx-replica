import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { NgbActiveOffcanvas, NgbNavModule } from "@ng-bootstrap/ng-bootstrap";
import { MenuItem } from "../../../models";

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
  private document = inject(DOCUMENT);

  // Active tab ID
  activeTab = 1; // 1 = Reorder, 2 = Settings

  // Settings
  autoSelectFirstChild = false;
  lockMenuEnabled = true; // Default to current behavior (lock/unlock button)
  alwaysShowMenu = true; // Default to always show when lockMenu is disabled

  // IDs for connected drop lists (built from menu tree)
  dropTargetIds: string[] = [];

  // Lookup map for quick node access by ID
  nodeLookup: { [key: string]: MenuItem } = {};

  // Track last mouse position during drag
  private lastMouseX = 0;
  private lastMouseY = 0;

  ngOnInit(): void {
    // Deep clone menu items to avoid mutating original
    this.menuItems = JSON.parse(JSON.stringify(this.menuItems));

    // Initialize children arrays to ensure drop zones work
    this.initializeChildren(this.menuItems);

    // Build drop target IDs
    this.prepareDragDrop(this.menuItems);

    // Load settings from localStorage
    this.loadSettings();
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
   * Build drop target IDs including children drop zones.
   */
  prepareDragDrop(nodes: MenuItem[]): void {
    // Clear and rebuild
    this.dropTargetIds = [];

    // Add root drop list
    this.dropTargetIds.push("root");

    nodes.forEach((node) => {
      // Only add children list if node is expanded (only in DOM when expanded)
      if (node.expanded && node.children && node.children.length > 0) {
        this.dropTargetIds.push("children-" + node.id + "-list");
      }

      this.nodeLookup[node.id] = node;

      if (node.children && node.children.length > 0) {
        this.prepareDragDrop(node.children);
      }
    });
  }

  /**
   * Track mouse position during drag
   */
  onDragMoved(event: CdkDragMove): void {
    this.lastMouseX = event.pointerPosition.x;
    this.lastMouseY = event.pointerPosition.y;
  }

  /**
   * Reset state when drag starts
   */
  onDragStarted(): void {
    this.lastMouseX = 0;
    this.lastMouseY = 0;
  }

  /**
   * Handle drop event - check if drop is on right half (child) or left half (reorder)
   */
  drop(event: CdkDragDrop<MenuItem[]>): void {
    // Get the container bounds to determine if drop is on right or left half
    const containerBounds = this.document
      .querySelector(".root-drop-list")
      ?.getBoundingClientRect();

    if (containerBounds) {
      const containerWidth = containerBounds.width;
      const containerLeft = containerBounds.left;
      const relativeX = this.lastMouseX - containerLeft;
      const isRightHalf = relativeX > containerWidth / 2;

      // If dropped on right half, add as child to the item at currentIndex - 1
      if (isRightHalf && event.container.id === "root") {
        const targetIndex = event.currentIndex > 0 ? event.currentIndex - 1 : 0;
        const targetNode = this.menuItems[targetIndex];

        if (targetNode) {
          // Initialize children array if needed
          if (!targetNode.children) {
            targetNode.children = [];
          }

          // Transfer the item
          transferArrayItem(
            event.previousContainer.data,
            targetNode.children,
            event.previousIndex,
            targetNode.children.length,
          );

          // Expand the parent to show the new child
          if (!targetNode.expanded) {
            targetNode.expanded = true;
          }

          // Rebuild drop targets
          this.prepareDragDrop(this.menuItems);

          return;
        }
      }
    }

    // Normal drop behavior (left half or no right-half target)
    if (event.previousContainer === event.container) {
      // Same list - just reorder
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      // Different list - transfer item
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // If dropped into a children zone, expand the parent
      if (event.container.id.startsWith("children-")) {
        // Extract parent ID (handles "children-X" and "children-X-list")
        const parentId = event.container.id
          .replace("children-", "")
          .replace("-list", "");
        const parent = this.nodeLookup[parentId];
        if (parent) {
          if (!parent.expanded) {
            parent.expanded = true;
            // Rebuild drop targets since we just expanded a node
            this.prepareDragDrop(this.menuItems);
          }
        }
      }
    }
  }

  /**
   * Toggle node expansion and rebuild drop targets.
   */
  toggleExpansion(node: MenuItem): void {
    node.expanded = !node.expanded;
    // Rebuild drop target IDs to include/exclude the expanded children list
    this.prepareDragDrop(this.menuItems);
  }

  /**
   * Save reordered menu structure.
   */
  save(): void {
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
