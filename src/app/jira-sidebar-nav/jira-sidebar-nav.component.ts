import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { timer } from "rxjs";
import { MenuDataService } from "./services/menu-data.service";
import { SidebarVisibilityMode } from "./models";
import { SidebarMenuComponent } from "./components/sidebar-menu/sidebar-menu.component";
import { SidebarToggleComponent } from "./components/sidebar-toggle/sidebar-toggle.component";

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
  imports: [CommonModule, SidebarMenuComponent, SidebarToggleComponent],
  templateUrl: "./jira-sidebar-nav.component.html",
  styleUrl: "./jira-sidebar-nav.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JiraSidebarNavComponent implements OnInit {
  // Inject MenuDataService
  protected readonly menuDataService = inject(MenuDataService);

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
   */
  toggleEditMode(): void {
    this.menuDataService.setEditMode(!this.isEditMode());
  }

  /**
   * Handle node expansion toggle (T024).
   */
  onNodeToggled(event: { itemId: string; expanded: boolean }): void {
    this.menuDataService.toggleNodeExpansion(event.itemId);
  }

  /**
   * Handle item click for navigation (T034).
   */
  onItemClicked(itemId: string): void {
    this.menuDataService.setActiveItem(itemId);
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
    if (this.visibilityMode() === SidebarVisibilityMode.HIDDEN) {
      this.expandSidebar();
    }
  }

  /**
   * Handle mouse leave from sidebar (starts auto-hide timer).
   */
  onSidebarMouseLeave(): void {
    if (
      !this.isLocked() &&
      this.visibilityMode() === SidebarVisibilityMode.TEMPORARY_VISIBLE
    ) {
      // Start 3-second timer
      timer(3000)
        .pipe(takeUntilDestroyed())
        .subscribe(() => {
          if (!this.isLocked()) {
            this.collapseSidebar();
          }
        });
    }
  }
}
