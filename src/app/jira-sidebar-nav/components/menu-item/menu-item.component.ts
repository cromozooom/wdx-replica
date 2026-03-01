import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbTooltip,
} from "@ng-bootstrap/ng-bootstrap";
import { MenuItem } from "../../models";

/**
 * Menu item component (Dumb Component).
 * Renders individual menu item with icon, label, and router link.
 *
 * @see specs/001-jira-sidebar-nav/contracts/component-interfaces.md for API
 */
@Component({
  selector: "app-menu-item",
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbTooltip,
  ],
  templateUrl: "./menu-item.component.html",
  styleUrl: "./menu-item.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemComponent {
  /**
   * The menu item data to display.
   */
  @Input({ required: true })
  item!: MenuItem;

  /**
   * Nesting level for indentation calculation (0-based).
   */
  @Input({ required: true })
  level!: number;

  /**
   * Whether this item is currently active/selected.
   */
  @Input()
  isActive: boolean = false;

  /**
   * ID of the currently active item (global state for overlay).
   */
  @Input()
  activeItemId: string | null = null;

  /**
   * Whether this item has children.
   */
  @Input()
  hasChildren: boolean = false;

  /**
   * Whether this item is expanded (if it has children).
   */
  @Input()
  isExpanded: boolean = false;

  /**
   * Whether any descendant of this item is active.
   */
  @Input()
  hasChildrenActive: boolean = false;

  /**
   * Whether edit mode is active.
   */
  @Input()
  isEditMode: boolean = false;

  /**
   * Whether icons-only mode is active (FIRST_LEVEL_ONLY visibility).
   */
  @Input()
  isIconsOnlyMode: boolean = false;

  /**
   * Emitted when user clicks the item.
   */
  @Output()
  itemClicked = new EventEmitter<string>();

  /**
   * Emitted when user clicks expansion toggle.
   */
  @Output()
  expansionToggled = new EventEmitter<void>();

  /**
   * Emitted when user clicks edit button (T054, FR-016).
   */
  @Output()
  editRequested = new EventEmitter<MenuItem>();

  /**
   * Emitted when user clicks delete button (T054, FR-017).
   */
  @Output()
  deleteRequested = new EventEmitter<MenuItem>();

  /**
   * Emitted when user clicks add child button.
   */
  @Output()
  addChildRequested = new EventEmitter<MenuItem>();

  // Tooltip reference for icons-only mode
  private tooltipRef: any = null;
  private hideTooltipTimeout?: number;

  /**
   * Calculate indentation padding.
   */
  getIndentPadding(): string {
    return `${this.level * 20}px`;
  }

  /**
   * Should enable tooltip for icons-only mode.
   */
  get shouldEnableTooltip(): boolean {
    return this.isIconsOnlyMode && this.level === 0 && this.hasChildren;
  }

  /**
   * Should show expansion chevron.
   * Hidden in icons-only mode for level 0 items.
   */
  get shouldShowChevron(): boolean {
    return this.hasChildren && !(this.isIconsOnlyMode && this.level === 0);
  }

  /**
   * Check if this is a root level (level 0) item.
   */
  get isLevel0(): boolean {
    return this.level === 0;
  }

  /**
   * Handle item click.
   */
  onClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).classList.contains("expansion-icon")) {
      this.itemClicked.emit(this.item.id);
    }
  }

  /**
   * Handle expansion toggle click.
   */
  onToggleExpansion(event: MouseEvent): void {
    event.stopPropagation();
    this.expansionToggled.emit();
  }

  /**
   * Handle edit button click (T054).
   */
  onEditClick(event: MouseEvent): void {
    event.stopPropagation();
    this.editRequested.emit(this.item);
  }

  /**
   * Handle delete button click (T054).
   */
  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteRequested.emit(this.item);
  }

  /**
   * Handle add child button click.
   */
  onAddChildClick(event: MouseEvent): void {
    event.stopPropagation();
    this.addChildRequested.emit(this.item);
  }

  /**
   * Handle dropdown toggle click (prevent propagation).
   */
  onDropdownToggle(event: MouseEvent): void {
    event.stopPropagation();
  }

  /**
   * Handle mouse enter on item (for icons-only tooltip).
   */
  onItemMouseEnter(event: MouseEvent, tooltip?: any): void {
    if (this.shouldEnableTooltip && tooltip) {
      // Clear any pending hide timeout
      if (this.hideTooltipTimeout) {
        window.clearTimeout(this.hideTooltipTimeout);
        this.hideTooltipTimeout = undefined;
      }
      this.tooltipRef = tooltip;
      tooltip.open();
    }
  }

  /**
   * Handle mouse leave on item (for icons-only tooltip).
   */
  onItemMouseLeave(tooltip?: any): void {
    if (this.shouldEnableTooltip && tooltip) {
      // Delay hiding to allow moving into tooltip
      this.hideTooltipTimeout = window.setTimeout(() => {
        tooltip.close();
      }, 100);
    }
  }

  /**
   * Handle child click from tooltip.
   */
  onTooltipChildClick(childId: string, tooltip?: any): void {
    this.itemClicked.emit(childId);
    if (tooltip) {
      tooltip.close();
    }
    if (this.hideTooltipTimeout) {
      window.clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = undefined;
    }
  }

  /**
   * Handle tooltip content mouse leave.
   */
  onTooltipMouseLeave(tooltip?: any): void {
    if (tooltip) {
      tooltip.close();
    }
    if (this.hideTooltipTimeout) {
      window.clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = undefined;
    }
  }

  /**
   * Handle tooltip content mouse enter (cancel hide timeout).
   */
  onTooltipMouseEnter(): void {
    if (this.hideTooltipTimeout) {
      window.clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = undefined;
    }
  }
}
