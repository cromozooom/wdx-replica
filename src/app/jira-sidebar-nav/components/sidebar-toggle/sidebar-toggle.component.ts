import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Sidebar toggle component (Dumb Component).
 * Renders lock/unlock button for sidebar.
 *
 * @see specs/001-jira-sidebar-nav/contracts/component-interfaces.md for API
 */
@Component({
  selector: "app-sidebar-toggle",
  standalone: true,
  imports: [CommonModule],
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
   * Emitted when user clicks the toggle button.
   */
  @Output()
  toggleClicked = new EventEmitter<void>();

  /**
   * Handle toggle button click.
   */
  onToggle(): void {
    this.toggleClicked.emit();
  }

  /**
   * Get tooltip text based on lock state.
   */
  getTooltipText(): string {
    return this.isLocked ? "Unlock sidebar" : "Lock sidebar open";
  }
}
