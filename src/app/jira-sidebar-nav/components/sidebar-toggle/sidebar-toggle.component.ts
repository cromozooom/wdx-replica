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
 * Renders lock/unlock button OR always/icons toggle based on settings.
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
   * Whether sidebar is locked (used when lockMenuEnabled is true).
   */
  @Input()
  isLocked: boolean = false;

  /**
   * Whether lock menu mode is enabled.
   * True = show lock/unlock button, False = show always/icons toggle.
   */
  @Input()
  lockMenuEnabled: boolean = true;

  /**
   * Whether menu is in "always show" mode (used when lockMenuEnabled is false).
   * True = full menu always visible, False = icons only mode.
   */
  @Input()
  alwaysShowMenu: boolean = true;

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
   * Get tooltip text based on current mode and state.
   */
  getTooltipText(): string {
    if (this.lockMenuEnabled) {
      return this.isLocked ? "Unlock sidebar" : "Lock sidebar open";
    } else {
      return this.alwaysShowMenu ? "Show icons only" : "Show full menu";
    }
  }

  /**
   * Get short status text for tooltip badge.
   */
  getStatusText(): string {
    if (this.lockMenuEnabled) {
      return this.isLocked ? "Locked" : "Unlocked";
    } else {
      return this.alwaysShowMenu ? "Full Menu" : "Icons Only";
    }
  }
}
