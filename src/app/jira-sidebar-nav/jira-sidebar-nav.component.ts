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
import { Router, RouterOutlet, NavigationEnd } from "@angular/router";
import { Subscription, timer } from "rxjs";
import { filter } from "rxjs/operators";
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
import { ConfigInheritanceModalComponent } from "./components/modals/config-inheritance-modal/config-inheritance-modal.component";

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

  // Router events subscription for syncing active item with browser navigation
  private routerSubscription?: Subscription;

  // Settings
  protected autoSelectFirstChild = false;
  protected lockMenuEnabled = true; // Default to current behavior
  protected alwaysShowMenu = true; // Default to always show when lockMenu is disabled
  protected hideChildIcons = false; // Default to showing all icons

  // Computed property for icons-only mode
  protected get isIconsOnlyMode(): boolean {
    return !this.lockMenuEnabled && !this.alwaysShowMenu;
  }

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

    // Load settings from localStorage
    this.loadSettings();

    // Apply initial visibility mode based on loaded settings
    this.applyVisibilityMode();

    // Subscribe to router events to sync active item with browser navigation
    this.setupRouterSync();
  }

  /**
   * Load settings from localStorage.
   */
  private loadSettings(): void {
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
        this.hideChildIcons = settings.hideChildIcons || false;
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
  }

  /**
   * Setup router event listener to sync active item with browser back/forward navigation.
   */
  private setupRouterSync(): void {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Extract item ID from URL (pattern: /menu-demo/item/:id)
        const urlSegments = event.urlAfterRedirects.split("/");
        const itemIndex = urlSegments.indexOf("item");

        if (itemIndex !== -1 && itemIndex + 1 < urlSegments.length) {
          const itemId = urlSegments[itemIndex + 1];

          // Only update if the item exists and is different from current active
          const item = this.menuDataService.getItemById(itemId);
          if (item && this.activeItemId() !== itemId) {
            this.menuDataService.setActiveItem(itemId);

            // Also expand all parent nodes to make the item visible
            this.expandParentNodes(itemId);
          }
        }
      });
  }

  /**
   * Expand all parent nodes of the given item to make it visible in the tree.
   */
  private expandParentNodes(itemId: string): void {
    const parents = this.findParentChain(itemId);
    parents.forEach((parentId) => {
      const parent = this.menuDataService.getItemById(parentId);
      if (parent && !parent.expanded) {
        this.menuDataService.toggleNodeExpansion(parentId);
      }
    });
  }

  /**
   * Find all parent IDs in the chain from root to the given item.
   */
  private findParentChain(itemId: string): string[] {
    const chain: string[] = [];

    const findParent = (
      items: MenuItem[],
      targetId: string,
      currentChain: string[],
    ): boolean => {
      for (const item of items) {
        if (item.id === targetId) {
          chain.push(...currentChain);
          return true;
        }

        if (item.children && item.children.length > 0) {
          if (findParent(item.children, targetId, [...currentChain, item.id])) {
            return true;
          }
        }
      }
      return false;
    };

    findParent(this.menuItems(), itemId, []);
    return chain;
  }

  ngOnDestroy(): void {
    // Clean up auto-hide timer subscription if active
    this.autoHideSubscription?.unsubscribe();

    // Clean up router events subscription
    this.routerSubscription?.unsubscribe();
  }

  /**
   * Toggle sidebar lock state (T021, FR-011).
   */
  toggleLock(): void {
    this.menuDataService.setSidebarLocked(!this.isLocked());
  }

  /**
   * Handle toggle button click - behavior depends on lockMenuEnabled setting.
   */
  onToggleClicked(): void {
    if (this.lockMenuEnabled) {
      // Lock/unlock mode: toggle lock state
      this.toggleLock();
    } else {
      // Always/Icons mode: toggle between always show and icons only
      this.alwaysShowMenu = !this.alwaysShowMenu;
      // Save settings
      this.saveCurrentSettings();
      // Apply visibility mode based on alwaysShowMenu
      this.applyVisibilityMode();
    }
  }

  /**
   * Apply visibility mode based on current settings.
   */
  private applyVisibilityMode(): void {
    if (this.lockMenuEnabled) {
      // Lock mode: use current lock state (locked or temporary visible)
      if (this.isLocked()) {
        this.menuDataService.setSidebarVisibility(
          SidebarVisibilityMode.LOCKED_VISIBLE,
        );
      } else {
        this.menuDataService.setSidebarVisibility(
          SidebarVisibilityMode.TEMPORARY_VISIBLE,
        );
      }
    } else {
      // Always/Icons mode: apply based on alwaysShowMenu setting
      if (this.alwaysShowMenu) {
        this.menuDataService.setSidebarVisibility(
          SidebarVisibilityMode.ALWAYS_VISIBLE,
        );
      } else {
        this.menuDataService.setSidebarVisibility(
          SidebarVisibilityMode.FIRST_LEVEL_ONLY,
        );
      }
    }
  }

  /**
   * Save current settings to localStorage.
   */
  private saveCurrentSettings(): void {
    const settings = {
      autoSelectFirstChild: this.autoSelectFirstChild,
      lockMenuEnabled: this.lockMenuEnabled,
      alwaysShowMenu: this.alwaysShowMenu,
    };
    localStorage.setItem("jira-sidebar-settings", JSON.stringify(settings));
  }

  /**
   * Expand sidebar on hover (T022, FR-007).
   * Only applies in lock mode, not in always/icons mode.
   */
  expandSidebar(): void {
    if (this.lockMenuEnabled && !this.isLocked()) {
      this.menuDataService.setSidebarVisibility(
        SidebarVisibilityMode.TEMPORARY_VISIBLE,
      );
    }
  }

  /**
   * Collapse sidebar after timer (T022, FR-008).
   * Only applies in lock mode, not in always/icons mode.
   */
  collapseSidebar(): void {
    if (this.lockMenuEnabled && !this.isLocked()) {
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

    // Subscribe to settings changes
    offcanvasRef.componentInstance.settingsChanged.subscribe(
      (settings: {
        autoSelectFirstChild: boolean;
        lockMenuEnabled: boolean;
        alwaysShowMenu: boolean;
        hideChildIcons: boolean;
      }) => {
        this.autoSelectFirstChild = settings.autoSelectFirstChild;
        this.lockMenuEnabled = settings.lockMenuEnabled;
        this.alwaysShowMenu = settings.alwaysShowMenu;
        this.hideChildIcons = settings.hideChildIcons;
        // Apply visibility mode when settings change
        this.applyVisibilityMode();
      },
    );

    try {
      const reorderedItems: MenuItem[] = await offcanvasRef.result;

      // Update the menu structure with reordered items
      this.menuDataService.setRootItems(reorderedItems);
    } catch (error) {
      // User cancelled
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
   * - Parent nodes (with children): Toggle expansion
   *   - If auto-select setting is ON AND node was closed AND no child is active: Navigate to first child
   * - Leaf nodes (no children): Navigate to content and set active
   */
  onItemClicked(itemId: string): void {
    const item = this.menuDataService.getItemById(itemId);

    if (!item) {
      return;
    }

    // If item has children, toggle expansion (parent node behavior)
    if (item.children && item.children.length > 0) {
      // Check if node is currently closed (before toggling)
      const wasClosedBeforeToggle = !item.expanded;

      this.menuDataService.toggleNodeExpansion(itemId);

      // Auto-select only if: setting is ON, node was closed, AND no child is currently active
      if (this.autoSelectFirstChild && wasClosedBeforeToggle) {
        const activeItemId = this.menuDataService.activeItem()?.id;
        const hasActiveChild = this.isChildActive(item, activeItemId);

        // Only auto-select if no child is already active
        if (!hasActiveChild) {
          const firstChild = item.children[0];
          if (firstChild) {
            this.menuDataService.setActiveItem(firstChild.id);
            this.router.navigate(["/menu-demo/item", firstChild.id]);
          }
        }
      }
    } else {
      // Leaf node: Navigate to content
      this.menuDataService.setActiveItem(itemId);
      this.router.navigate(["/menu-demo/item", itemId]);
    }
  }

  /**
   * Check if the active item is a descendant of the given parent item.
   */
  private isChildActive(
    parent: MenuItem,
    activeItemId: string | null | undefined,
  ): boolean {
    if (!activeItemId || !parent.children) {
      return false;
    }

    // Recursively check all children
    for (const child of parent.children) {
      if (child.id === activeItemId) {
        return true;
      }
      if (child.children && this.isChildActive(child, activeItemId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Open dialog to create a new menu item (T049, FR-015).
   *
   * @param parentItem - Optional parent item (for creating child items)
   */
  async createMenuItem(parentItem?: MenuItem): Promise<void> {
    let configInheritorName: string | null = null;

    // Check if parent has config and no children - need to preserve config
    if (
      parentItem &&
      parentItem.contentConfig &&
      (!parentItem.children || parentItem.children.length === 0)
    ) {
      // Show modal to get name for config inheritor child
      const modalRef = this.modalService.open(ConfigInheritanceModalComponent, {
        centered: true,
        backdrop: "static",
      });

      modalRef.componentInstance.parentLabel = parentItem.label;
      modalRef.componentInstance.defaultChildName = `${parentItem.label} (Config)`;

      try {
        configInheritorName = await modalRef.result;
      } catch (error) {
        // User cancelled - don't proceed with creating child
        return;
      }
    }

    const offcanvasRef = this.offcanvasService.open(MenuItemEditorComponent, {
      position: "end",
      backdrop: "static",
      panelClass: "offcanvas-large",
    });

    // Pass undefined to create new item
    offcanvasRef.componentInstance.menuItem = undefined;

    try {
      const result: Partial<MenuItem> = await offcanvasRef.result;

      // Generate unique ID for the new item
      const newId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newItem: MenuItem = {
        id: newId,
        label: result.label!,
        icon: result.icon,
        order: configInheritorName ? 1 : 0, // If config child exists, this becomes second
        expanded: false,
        // Include contentConfig from the form if provided
        ...(result.contentConfig && { contentConfig: result.contentConfig }),
      };

      // If we need to create a config inheritor child, add it first (index 0)
      if (configInheritorName && parentItem) {
        // Create child item with inherited configuration
        const configChildId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const configChild: MenuItem = {
          id: configChildId,
          label: configInheritorName,
          icon: parentItem.icon,
          order: 0, // Always first child
          expanded: false,
          contentConfig: parentItem.contentConfig,
        };

        // Add config child to the parent first
        this.menuDataService.addItem(configChild, parentItem.id);

        // Remove contentConfig from parent (now inherited by child)
        if (parentItem.contentConfig) {
          // Update the parent to remove contentConfig
          this.menuDataService.updateItem(parentItem.id, {
            contentConfig: undefined,
          });
        }
      }

      // Add the user's new item after config child (if it exists)
      this.menuDataService.addItem(newItem, parentItem?.id);
    } catch (error) {
      // User cancelled or dismissed modal
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

      this.menuDataService.updateItem(menuItem.id, updates);
    } catch (error) {
      // User cancelled or dismissed modal
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
    }
  }

  /**
   * Open dialog to add multi-level submenu hierarchy (T062, FR-022).
   *
   * @param parentItem - Optional parent item to nest under (null for root level)
   */
  async openAddSubmenuDialog(parentItem: MenuItem | null): Promise<void> {
    const offcanvasRef = this.offcanvasService.open(AddSubmenuComponent, {
      position: "end",
      backdrop: "static",
      panelClass: "offcanvas-large",
    });

    offcanvasRef.componentInstance.parentItem = parentItem;

    try {
      const result: MenuItem = await offcanvasRef.result;

      // Add submenu hierarchy via service
      this.menuDataService.addSubmenu(parentItem?.id || null, result);
    } catch (error) {
      // User cancelled or dismissed modal
    }
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
