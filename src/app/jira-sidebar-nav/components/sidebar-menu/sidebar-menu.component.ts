import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuItem } from "../../models";
import { MenuItemComponent } from "../menu-item/menu-item.component";

/**
 * Sidebar menu component (Dumb Component).
 * Renders hierarchical menu structure.
 *
 * @see specs/001-jira-sidebar-nav/contracts/component-interfaces.md for API
 */
@Component({
  selector: "app-sidebar-menu",
  standalone: true,
  imports: [CommonModule, MenuItemComponent],
  templateUrl: "./sidebar-menu.component.html",
  styleUrl: "./sidebar-menu.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuComponent implements OnInit {
  /**
   * Menu items to display (root level).
   */
  @Input({ required: true })
  menuItems!: MenuItem[];

  /**
   * Set of expanded node IDs.
   */
  @Input({ required: true })
  expandedNodeIds!: Set<string>;

  /**
   * ID of currently active menu item.
   */
  @Input()
  activeItemId: string | null = null;

  /**
   * Whether edit mode is active.
   */
  @Input()
  isEditMode: boolean = false;

  /**
   * Emitted when user clicks a menu item.
   */
  @Output()
  itemClicked = new EventEmitter<string>();

  /**
   * Emitted when user expands/collapses a node.
   */
  @Output()
  nodeToggled = new EventEmitter<{ itemId: string; expanded: boolean }>();

  ngOnInit(): void {
    // Component initialized
  }

  /**
   * Check if node is expanded.
   */
  isExpanded(itemId: string): boolean {
    return this.expandedNodeIds.has(itemId);
  }

  /**
   * Toggle node expansion.
   */
  toggleNode(item: MenuItem): void {
    const isCurrentlyExpanded = this.isExpanded(item.id);
    this.nodeToggled.emit({ itemId: item.id, expanded: !isCurrentlyExpanded });
  }

  /**
   * Handle item click.
   */
  onItemClick(itemId: string): void {
    this.itemClicked.emit(itemId);
  }

  /**
   * Check if item has children.
   */
  hasChildren(item: MenuItem): boolean {
    return !!(item.children && item.children.length > 0);
  }

  /**
   * Track by function for ngFor performance.
   */
  trackByItemId(index: number, item: MenuItem): string {
    return item.id;
  }
}
