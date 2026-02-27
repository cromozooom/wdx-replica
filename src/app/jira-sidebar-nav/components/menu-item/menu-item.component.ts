import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
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
  imports: [CommonModule, RouterModule],
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
   * Calculate indentation padding.
   */
  getIndentPadding(): string {
    return `${this.level * 24}px`;
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
}
