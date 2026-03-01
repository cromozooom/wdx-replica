import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { CommonModule, DOCUMENT, isPlatformBrowser } from "@angular/common";
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  CdkDragMove,
} from "@angular/cdk/drag-drop";
import { NgbActiveOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { MenuItem } from "../../../models";

interface DropInfo {
  targetId: string;
  action?: "before" | "after" | "inside";
}

/**
 * Menu Reorder Offcanvas Component.
 * Provides drag-and-drop interface for reordering menu items.
 * Based on StackBlitz working pattern.
 */
@Component({
  selector: "app-menu-reorder-offcanvas",
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag],
  templateUrl: "./menu-reorder-offcanvas.component.html",
  styleUrl: "./menu-reorder-offcanvas.component.scss",
  // Using default ViewEncapsulation.Emulated for proper style scoping
})
export class MenuReorderOffcanvasComponent {
  @Input() menuItems: MenuItem[] = [];
  @Output() menuReordered = new EventEmitter<MenuItem[]>();

  activeOffcanvas = inject(NgbActiveOffcanvas);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  // IDs for connected drop lists (built from menu tree)
  dropTargetIds: string[] = [];

  // Lookup map for quick node access by ID
  nodeLookup: { [key: string]: MenuItem } = {};

  // Current drag-drop action info
  dropActionTodo: DropInfo | null = null;

  // Debounce timer for dragMoved
  private dragMoveTimer: any = null;

  ngOnInit(): void {
    // Deep clone menu items to avoid mutating original
    this.menuItems = JSON.parse(JSON.stringify(this.menuItems));
    this.prepareDragDrop(this.menuItems);
  }

  /**
   * Build drop target IDs and node lookup map.
   * Based on StackBlitz prepareDragDrop() method.
   */
  prepareDragDrop(nodes: MenuItem[]): void {
    nodes.forEach((node) => {
      this.dropTargetIds.push(node.id);
      this.nodeLookup[node.id] = node;
      if (node.children && node.children.length > 0) {
        this.prepareDragDrop(node.children);
      }
    });
  }

  /**
   * Handle drag move event to determine drop action (before/after/inside).
   * Debounced to improve performance.
   */
  dragMoved(event: CdkDragMove): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Clear previous timer
    if (this.dragMoveTimer) {
      clearTimeout(this.dragMoveTimer);
    }

    // Debounce to 50ms
    this.dragMoveTimer = setTimeout(() => {
      const element = this.document.elementFromPoint(
        event.pointerPosition.x,
        event.pointerPosition.y,
      );

      if (!element) {
        this.clearDragInfo();
        return;
      }

      const container = element.classList.contains("node-item")
        ? element
        : element.closest(".node-item");

      if (!container) {
        this.clearDragInfo();
        return;
      }

      this.dropActionTodo = {
        targetId: container.getAttribute("data-id") || "",
      };

      const targetRect = container.getBoundingClientRect();
      const oneThird = targetRect.height / 3;

      if (event.pointerPosition.y - targetRect.top < oneThird) {
        // Drop before
        this.dropActionTodo.action = "before";
      } else if (event.pointerPosition.y - targetRect.top > 2 * oneThird) {
        // Drop after
        this.dropActionTodo.action = "after";
      } else {
        // Drop inside (as child)
        this.dropActionTodo.action = "inside";
      }

      this.showDragInfo();
    }, 50);
  }

  /**
   * Handle drop event.
   */
  drop(event: CdkDragDrop<MenuItem[]>): void {
    if (!this.dropActionTodo) {
      return;
    }

    const draggedItemId = event.item.data as string;
    const parentItemId = event.previousContainer.id;
    const targetListId = this.getParentNodeId(
      this.dropActionTodo.targetId,
      this.menuItems,
      "main",
    );

    console.log(
      "\nMoving\n[" + draggedItemId + "] from list [" + parentItemId + "]",
      "\n[" +
        this.dropActionTodo.action +
        "]\n[" +
        this.dropActionTodo.targetId +
        "] from list [" +
        targetListId +
        "]",
    );

    const draggedItem = this.nodeLookup[draggedItemId];

    const oldItemContainer =
      parentItemId !== "main"
        ? this.nodeLookup[parentItemId].children || []
        : this.menuItems;

    const newContainer =
      targetListId && targetListId !== "main"
        ? this.nodeLookup[targetListId].children || []
        : this.menuItems;

    // Remove from old position
    const oldIndex = oldItemContainer.findIndex(
      (c: MenuItem) => c.id === draggedItemId,
    );
    oldItemContainer.splice(oldIndex, 1);

    // Insert at new position
    switch (this.dropActionTodo.action) {
      case "before":
      case "after":
        const targetIndex = newContainer.findIndex(
          (c: MenuItem) => c.id === this.dropActionTodo!.targetId,
        );
        if (this.dropActionTodo.action === "before") {
          newContainer.splice(targetIndex, 0, draggedItem);
        } else {
          newContainer.splice(targetIndex + 1, 0, draggedItem);
        }
        break;

      case "inside":
        const targetNode = this.nodeLookup[this.dropActionTodo.targetId];
        if (!targetNode.children) {
          targetNode.children = [];
        }
        targetNode.children.push(draggedItem);
        targetNode.expanded = true;
        break;
    }

    this.clearDragInfo(true);
  }

  /**
   * Find parent node ID for a given node.
   */
  getParentNodeId(
    id: string,
    nodesToSearch: MenuItem[],
    parentId: string,
  ): string | null {
    for (const node of nodesToSearch) {
      if (node.id === id) {
        return parentId;
      }
      if (node.children && node.children.length > 0) {
        const ret = this.getParentNodeId(id, node.children, node.id);
        if (ret) {
          return ret;
        }
      }
    }
    return null;
  }

  /**
   * Show drag info visual indicators.
   */
  showDragInfo(): void {
    this.clearDragInfo();
    if (this.dropActionTodo && isPlatformBrowser(this.platformId)) {
      const element = this.document.getElementById(
        "node-" + this.dropActionTodo.targetId,
      );
      if (element) {
        element.classList.add("drop-" + this.dropActionTodo.action);
      }
    }
  }

  /**
   * Clear drag info visual indicators.
   */
  clearDragInfo(dropped = false): void {
    if (dropped) {
      this.dropActionTodo = null;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.document
        .querySelectorAll(".drop-before")
        .forEach((element) => element.classList.remove("drop-before"));
      this.document
        .querySelectorAll(".drop-after")
        .forEach((element) => element.classList.remove("drop-after"));
      this.document
        .querySelectorAll(".drop-inside")
        .forEach((element) => element.classList.remove("drop-inside"));
    }
  }

  /**
   * Toggle node expansion.
   */
  toggleExpansion(node: MenuItem): void {
    node.expanded = !node.expanded;
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
