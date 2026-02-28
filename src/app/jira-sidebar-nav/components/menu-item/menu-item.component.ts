import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
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

  /**
   * Calculate indentation padding.
   */
  getIndentPadding(): string {
    return `${this.level * 20}px`;
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
}
