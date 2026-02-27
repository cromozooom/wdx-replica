import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { MenuItem } from "../../../models/menu-item.interface";

/**
 * Deletion strategy for menu items with children.
 */
export type DeleteStrategy = "cascade" | "promote" | "simple";

/**
 * Result returned when deletion is confirmed.
 */
export interface DeleteConfirmationResult {
  strategy: DeleteStrategy;
  itemId: string;
}

/**
 * Modal component for confirming menu item deletion.
 * Handles different strategies for items with children:
 * - cascade: Delete item and all descendants
 * - promote: Delete item but keep children (promote to parent level)
 * - simple: Direct deletion (for leaf nodes)
 *
 * @component DeleteConfirmationComponent
 * @standalone
 */
@Component({
  selector: "app-delete-confirmation",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./delete-confirmation.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmationComponent {
  /**
   * Menu item to delete.
   */
  @Input() menuItem!: MenuItem;

  /**
   * Selected deletion strategy (for items with children).
   * Defaults to 'cascade' for safety.
   */
  selectedStrategy: DeleteStrategy = "cascade";

  /**
   * Modal instance for closing/dismissing.
   */
  private readonly activeModal = inject(NgbActiveModal);

  /**
   * Check if menu item has children.
   */
  get hasChildren(): boolean {
    return !!this.menuItem?.children && this.menuItem.children.length > 0;
  }

  /**
   * Get count of direct children.
   */
  get childrenCount(): number {
    return this.menuItem?.children?.length || 0;
  }

  /**
   * Get total count of all descendants (recursive).
   */
  get descendantsCount(): number {
    if (!this.hasChildren) return 0;
    return this.countDescendants(this.menuItem);
  }

  /**
   * Recursively count all descendants.
   */
  private countDescendants(item: MenuItem): number {
    let count = item.children?.length || 0;
    item.children?.forEach((child) => {
      count += this.countDescendants(child);
    });
    return count;
  }

  /**
   * Confirm deletion and close modal with result.
   */
  onConfirm(): void {
    const result: DeleteConfirmationResult = {
      strategy: this.hasChildren ? this.selectedStrategy : "simple",
      itemId: this.menuItem.id,
    };
    this.activeModal.close(result);
  }

  /**
   * Cancel deletion and dismiss modal.
   */
  onCancel(): void {
    this.activeModal.dismiss("cancel");
  }
}
