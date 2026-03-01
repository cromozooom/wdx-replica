import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";

/**
 * Sidebar toggle component (Dumb Component).
 * Renders lock/unlock button for sidebar.
 *
 * @see specs/001-jira-sidebar-nav/contracts/component-interfaces.md for API
 */
@Component({
  selector: "app-sidebar-toggle",
  standalone: true,
  imports: [CommonModule, NgbTooltip],
  templateUrl: "./sidebar-toggle.component.html",
  styleUrl: "./sidebar-toggle.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarToggleComponent {
  /**
   * Whether sidebar is locked.
   */
  @Input()
  isLocked: boolean = false;

  /**
   * Whether the toggle button is disabled (e.g., in edit mode).
   */
  @Input()
  disabled: boolean = false;

  /**
   * Emitted when user clicks the toggle button.
   */
  @Output()
  toggleClicked = new EventEmitter<void>();

  /**
   * Emitted when mouse enters the toggle button.
   */
  @Output()
  mouseEnter = new EventEmitter<void>();

  /**
   * Emitted when mouse leaves the toggle button.
   */
  @Output()
  mouseLeave = new EventEmitter<void>();

  /**
   * Handle toggle button click.
   */
  onToggle(): void {
    this.toggleClicked.emit();
  }

  /**
   * Handle mouse enter event.
   */
  onMouseEnter(): void {
    this.mouseEnter.emit();
  }

  /**
   * Handle mouse leave event.
   */
  onMouseLeave(): void {
    this.mouseLeave.emit();
  }

  /**
   * Get tooltip text based on lock state.
   */
  getTooltipText(): string {
    return this.isLocked ? "Unlock sidebar" : "Lock sidebar open";
  }
}
