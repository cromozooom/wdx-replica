import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterOutlet } from "@angular/router";
import { Subscription, timer } from "rxjs";
import { NgbModal, NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { MenuDataService } from "./services/menu-data.service";
import { MenuItem } from "./models/menu-item.interface";
import { SidebarVisibilityMode } from "./models";
import { SidebarMenuComponent } from "./components/sidebar-menu/sidebar-menu.component";
import { SidebarToggleComponent } from "./components/sidebar-toggle/sidebar-toggle.component";
import { MenuItemEditorComponent } from "./components/modals/menu-item-editor/menu-item-editor.component";
import {
  DeleteConfirmationComponent,
  DeleteConfirmationResult,
} from "./components/modals/delete-confirmation/delete-confirmation.component";
import { AddSubmenuComponent } from "./components/modals/add-submenu/add-submenu.component";
import { MenuReorderOffcanvasComponent } from "./components/modals/menu-reorder-offcanvas/menu-reorder-offcanvas.component";

/**
 * Container component for jira-sidebar-nav feature (Smart Component).
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * Manages state, localStorage sync, auto-hide behavior, and coordinates child components.
 *
 * @see specs/001-jira-sidebar-nav/contracts/component-interfaces.md for API
 */
@Component({
  selector: "app-jira-sidebar-nav",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarMenuComponent,
    SidebarToggleComponent,
  ],
  templateUrl: "./jira-sidebar-nav.component.html",
  styleUrl: "./jira-sidebar-nav.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JiraSidebarNavComponent implements OnInit, OnDestroy {
  // Inject MenuDataService
  protected readonly menuDataService = inject(MenuDataService);

  // Inject NgbModal for confirmations
  private readonly modalService = inject(NgbModal);

  // Inject NgbOffcanvas for edit forms
  private readonly offcanvasService = inject(NgbOffcanvas);

  // Inject Router for navigation
  private readonly router = inject(Router);

  // Timer subscription for auto-hide
  private autoHideSubscription?: Subscription;

  // Computed signals from service
  protected readonly menuItems = this.menuDataService.rootItems;
  protected readonly isLocked = this.menuDataService.isSidebarLocked;
  protected readonly isEditMode = this.menuDataService.isEditMode;
  protected readonly currentWidth = computed(
    () => this.menuDataService.sidebarState().currentWidth,
  );
  protected readonly activeItemId = computed(
    () => this.menuDataService.sidebarState().activeItemId,
  );
  protected readonly expandedNodeIds = computed(
    () => this.menuDataService.sidebarState().expandedNodeIds,
  );
  protected readonly visibilityMode = computed(
    () => this.menuDataService.sidebarState().visibilityMode,
  );

  constructor() {
    // Setup auto-hide timer (T026)
    this.setupAutoHideTimer();
  }

  ngOnInit(): void {
    // State is already initialized by MenuDataService
  }

  ngOnDestroy(): void {
    // Clean up auto-hide timer subscription if active
    this.autoHideSubscription?.unsubscribe();
  }

  /**
   * Toggle sidebar lock state (T021, FR-011).
   */
  toggleLock(): void {
    this.menuDataService.setSidebarLocked(!this.isLocked());
  }

  /**
   * Expand sidebar on hover (T022, FR-007).
   */
  expandSidebar(): void {
    if (!this.isLocked()) {
      this.menuDataService.setSidebarVisibility(
        SidebarVisibilityMode.TEMPORARY_VISIBLE,
      );
    }
  }

  /**
   * Collapse sidebar after timer (T022, FR-008).
   */
  collapseSidebar(): void {
    if (!this.isLocked()) {
      this.menuDataService.setSidebarVisibility(SidebarVisibilityMode.HIDDEN);
    }
  }

  /**
   * Toggle edit mode (FR-014).
   * When entering edit mode, automatically lock the sidebar.
   */
  toggleEditMode(): void {
    const newEditMode = !this.isEditMode();
    this.menuDataService.setEditMode(newEditMode);

    // Lock sidebar when entering edit mode
    if (newEditMode && !this.isLocked()) {
      this.menuDataService.setSidebarLocked(true);
    }
  }

  /**
   * Open menu reorder offcanvas to drag-and-drop reorder menu items.
   */
  async openReorderOffcanvas(): Promise<void> {
    const offcanvasRef = this.offcanvasService.open(
      MenuReorderOffcanvasComponent,
      {
        position: "end",
        backdrop: "static",
        panelClass: "offcanvas-large",
      },
    );

    // Pass current menu items
    offcanvasRef.componentInstance.menuItems = this.menuItems();

    try {
      const reorderedItems: MenuItem[] = await offcanvasRef.result;

      // Update the menu structure with reordered items
      this.menuDataService.setRootItems(reorderedItems);

      console.log("[REORDER] Menu items reordered successfully");
    } catch (error) {
      // User cancelled
      console.log("[REORDER] Menu reorder cancelled");
    }
  }

  /**
   * Handle node expansion toggle (T024).
   */
  onNodeToggled(event: { itemId: string; expanded: boolean }): void {
    this.menuDataService.toggleNodeExpansion(event.itemId);
  }

  /**
   * Handle item click for navigation (T034).
   *
   * Behavior:
   * - Parent nodes (with children): Toggle expansion only
   * - Leaf nodes (no children): Navigate to content and set active
   */
  onItemClicked(itemId: string): void {
    const item = this.menuDataService.getItemById(itemId);

    if (!item) {
      console.warn(`Item not found: ${itemId}`);
      return;
    }

    // If item has children, just toggle expansion (parent node behavior)
    if (item.children && item.children.length > 0) {
      this.menuDataService.toggleNodeExpansion(itemId);
    } else {
      // Leaf node: Navigate to content
      this.menuDataService.setActiveItem(itemId);
      this.router.navigate(["/menu-demo/item", itemId]);
    }
  }

  /**
   * Open dialog to create a new menu item (T049, FR-015).
   *
   * @param parentItem - Optional parent item (for creating child items)
   */
  async createMenuItem(parentItem?: MenuItem): Promise<void> {
    // Check if parent will lose its content config
    if (
      parentItem &&
      parentItem.contentConfig &&
      (!parentItem.children || parentItem.children.length === 0)
    ) {
      const confirmed = await this.confirmContentTransfer(parentItem);
      if (!confirmed) {
        return; // User cancelled
      }
    }

    const offcanvasRef = this.offcanvasService.open(MenuItemEditorComponent, {
      position: "end",
      backdrop: "static",
      panelClass: "offcanvas-large",
    });

    // Pass undefined to create new item, and parentItem for content transfer
    offcanvasRef.componentInstance.menuItem = undefined;
    offcanvasRef.componentInstance.parentItem = parentItem;

    try {
      const result: Partial<MenuItem> = await offcanvasRef.result;

      // Generate unique ID
      const newId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newItem: MenuItem = {
        id: newId,
        label: result.label!,
        icon: result.icon,
        order: 0,
        expanded: false,
        // Include contentConfig from the form if provided
        ...(result.contentConfig && { contentConfig: result.contentConfig }),
      };

      console.log("[CREATE] New item contentConfig:", newItem.contentConfig);

      // Add item via service (content transfer happens automatically)
      this.menuDataService.addItem(newItem, parentItem?.id);
    } catch (error) {
      // User cancelled or dismissed modal
      console.log("Create cancelled");
    }
  }

  /**
   * Open dialog to edit an existing menu item (T047, FR-016).
   *
   * @param menuItem - Item to edit
   */
  async openEditDialog(menuItem: MenuItem): Promise<void> {
    const offcanvasRef = this.offcanvasService.open(MenuItemEditorComponent, {
      position: "end",
      backdrop: "static",
      panelClass: "offcanvas-large",
    });

    offcanvasRef.componentInstance.menuItem = menuItem;

    try {
      const result: Partial<MenuItem> = await offcanvasRef.result;

      // Update item via service
      const updates = {
        label: result.label!,
        icon: result.icon,
        ...(result.contentConfig && { contentConfig: result.contentConfig }),
      };

      console.log("[EDIT] Updating item with:", updates);
      this.menuDataService.updateItem(menuItem.id, updates);
    } catch (error) {
      // User cancelled or dismissed modal
      console.log("Edit cancelled");
    }
  }

  /**
   * Open dialog to confirm deletion of a menu item (T048, FR-017).
   *
   * @param menuItem - Item to delete
   */
  async openDeleteDialog(menuItem: MenuItem): Promise<void> {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: "md",
      backdrop: "static",
    });

    modalRef.componentInstance.menuItem = menuItem;

    try {
      const result: DeleteConfirmationResult = await modalRef.result;

      // Delete item via service
      // TODO: Implement cascade/promote logic based on result.strategy
      this.menuDataService.deleteItem(menuItem.id);
    } catch (error) {
      // User cancelled or dismissed modal
      console.log("Delete cancelled");
    }
  }

  /**
   * Open dialog to add multi-level submenu hierarchy (T062, FR-022).
   *
   * @param parentItem - Optional parent item to nest under (null for root level)
   */
  async openAddSubmenuDialog(parentItem: MenuItem | null): Promise<void> {
    console.log("[AddSubmenuDialog] Opening with parentItem:", parentItem);

    // Check if parent will lose its content config
    if (
      parentItem &&
      parentItem.contentConfig &&
      (!parentItem.children || parentItem.children.length === 0)
    ) {
      console.log(
        "[AddSubmenuDialog] Parent has contentConfig, showing confirmation",
      );
      const confirmed = await this.confirmContentTransfer(parentItem);
      if (!confirmed) {
        return; // User cancelled
      }
    }

    const offcanvasRef = this.offcanvasService.open(AddSubmenuComponent, {
      position: "end",
      backdrop: "static",
      panelClass: "offcanvas-large",
    });

    offcanvasRef.componentInstance.parentItem = parentItem;
    console.log(
      "[AddSubmenuDialog] Offcanvas component parentItem set to:",
      offcanvasRef.componentInstance.parentItem,
    );

    try {
      const result: MenuItem = await offcanvasRef.result;

      // Add submenu hierarchy via service (content transfer happens automatically)
      this.menuDataService.addSubmenu(parentItem?.id || null, result);
    } catch (error) {
      // User cancelled or dismissed modal
      console.log("Add submenu cancelled");
    }
  }

  /**
   * Show confirmation dialog before transferring content configuration.
   *
   * @param parentItem - The parent item that will lose its content
   * @returns Promise<boolean> - true if user confirmed, false if cancelled
   */
  private async confirmContentTransfer(parentItem: MenuItem): Promise<boolean> {
    return new Promise((resolve) => {
      const widgetName =
        parentItem.contentConfig?.settings?.["widgetName"] || "N/A";
      const apiEndpoint =
        parentItem.contentConfig?.settings?.["apiEndpoint"] || "N/A";

      const message =
        `⚠️ Content Configuration Transfer\n\n` +
        `The item "${parentItem.label}" currently has content configuration:\n` +
        `• Widget: ${widgetName}\n` +
        `• API: ${apiEndpoint}\n\n` +
        `Adding a child will automatically:\n` +
        `✓ Transfer this configuration to the first child\n` +
        `✓ Convert "${parentItem.label}" into a container (no content)\n\n` +
        `Continue?`;

      if (confirm(message)) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  /**
   * Setup auto-hide timer with RxJS (T026, FR-008).
   * Sidebar auto-hides after 3 seconds when not locked.
   */
  private setupAutoHideTimer(): void {
    // Effect to manage auto-hide state
    effect(() => {
      const mode = this.visibilityMode();
      const locked = this.isLocked();

      if (mode === SidebarVisibilityMode.TEMPORARY_VISIBLE && !locked) {
        this.menuDataService.setAutoHideTimerActive(true);
      } else {
        this.menuDataService.setAutoHideTimerActive(false);
      }
    });
  }

  /**
   * Handle mouse enter on sidebar (cancels auto-hide).
   */
  onSidebarMouseEnter(): void {
    // Cancel any pending auto-hide timer
    this.autoHideSubscription?.unsubscribe();
    this.autoHideSubscription = undefined;

    if (this.visibilityMode() === SidebarVisibilityMode.HIDDEN) {
      this.expandSidebar();
    }
  }

  /**
   * Handle mouse leave from sidebar (starts auto-hide timer).
   */
  onSidebarMouseLeave(): void {
    // Cancel any existing timer first
    this.autoHideSubscription?.unsubscribe();
    this.autoHideSubscription = undefined;

    if (
      !this.isLocked() &&
      this.visibilityMode() === SidebarVisibilityMode.TEMPORARY_VISIBLE
    ) {
      // Start 2-second timer
      this.autoHideSubscription = timer(2000).subscribe(() => {
        if (!this.isLocked()) {
          this.collapseSidebar();
        }
      });
    }
  }
}
