import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuItem } from "../../models/menu-item.interface";

/**
 * Menu Children Overlay Component.
 * Shows children items in a tooltip-like overlay when in icons-only mode.
 * Appears on hover next to parent icon.
 */
@Component({
  selector: "app-menu-children-overlay",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./menu-children-overlay.component.html",
  styleUrl: "./menu-children-overlay.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuChildrenOverlayComponent {
  /**
   * Children items to display in the overlay.
   */
  @Input() children: MenuItem[] = [];

  /**
   * Active item ID for highlighting.
   */
  @Input() activeItemId: string | null = null;

  /**
   * Position of the overlay (top offset in pixels).
   */
  @Input() topPosition: number = 0;

  /**
   * Emitted when a child item is clicked.
   */
  @Output() childClicked = new EventEmitter<string>();

  /**
   * Emitted when mouse leaves the overlay.
   */
  @Output() overlayMouseLeave = new EventEmitter<void>();

  /**
   * Emitted when mouse enters the overlay.
   */
  @Output() overlayMouseEnter = new EventEmitter<void>();

  /**
   * Handle child item click.
   */
  onChildClick(itemId: string): void {
    this.childClicked.emit(itemId);
  }

  /**
   * Handle mouse leave event.
   */
  onMouseLeave(): void {
    this.overlayMouseLeave.emit();
  }

  /**
   * Handle mouse enter event.
   */
  onMouseEnter(): void {
    this.overlayMouseEnter.emit();
  }
}
