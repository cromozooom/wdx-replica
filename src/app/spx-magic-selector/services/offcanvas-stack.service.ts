import { Injectable } from "@angular/core";
import { NgbOffcanvasRef } from "@ng-bootstrap/ng-bootstrap";
import { BehaviorSubject } from "rxjs";

export interface OffcanvasStackItem {
  id: string;
  title: string;
  width: string;
  zIndex: number;
  backdropZIndex: number;
  ref: NgbOffcanvasRef;
  level: number;
}

/**
 * Service to manage stacked offcanvas panels with breadcrumb navigation
 * Each subsequent offcanvas is 2vw smaller than the previous one
 */
@Injectable({
  providedIn: "root",
})
export class OffcanvasStackService {
  private readonly BASE_WIDTH = 95; // Starting width in vw
  private readonly WIDTH_DECREMENT = 2; // Decrease by 2vw for each level
  private readonly MIN_WIDTH = 50; // Minimum width in vw
  private readonly BASE_Z_INDEX = 1100; // Base z-index for offcanvas (above ng-select)
  private readonly Z_INDEX_INCREMENT = 10; // Increment z-index by 10 for each level

  private stack: OffcanvasStackItem[] = [];
  private stackSubject = new BehaviorSubject<OffcanvasStackItem[]>([]);

  /**
   * Observable of the current offcanvas stack
   */
  public stack$ = this.stackSubject.asObservable();

  /**
   * Register a new offcanvas in the stack
   */
  registerOffcanvas(title: string, ref: NgbOffcanvasRef): OffcanvasStackItem {
    const level = this.stack.length;
    const width = Math.max(
      this.BASE_WIDTH - level * this.WIDTH_DECREMENT,
      this.MIN_WIDTH,
    );
    const zIndex = this.BASE_Z_INDEX + level * this.Z_INDEX_INCREMENT;
    const backdropZIndex = zIndex - 1;

    const item: OffcanvasStackItem = {
      id: this.generateId(),
      title,
      width: `${width}vw`,
      zIndex,
      backdropZIndex,
      ref,
      level,
    };

    this.stack.push(item);
    this.stackSubject.next([...this.stack]);

    // Update CSS custom property for this offcanvas
    // Width is now applied directly by components\n    // this.updateOffcanvasWidth(ref, `${width}vw`);

    // Listen for offcanvas dismissal to clean up stack
    ref.result.finally(() => {
      this.removeFromStack(item.id);
    });

    return item;
  }

  /**
   * Remove an offcanvas from the stack
   */
  private removeFromStack(id: string): void {
    const index = this.stack.findIndex((item) => item.id === id);
    if (index !== -1) {
      // Remove this item and all items after it (close nested offcanvases)
      const itemsToRemove = this.stack.splice(index);

      // Close any nested offcanvases
      itemsToRemove.slice(1).forEach((item) => {
        if (item.ref) {
          item.ref.dismiss();
        }
      });

      this.stackSubject.next([...this.stack]);
    }
  }

  /**
   * Get breadcrumb items for the current stack
   */
  getBreadcrumbs(): Array<{ title: string; level: number; isActive: boolean }> {
    return this.stack.map((item, index) => ({
      title: item.title,
      level: item.level,
      isActive: index === this.stack.length - 1,
    }));
  }

  /**
   * Navigate to a specific level in the breadcrumb
   */
  navigateToLevel(targetLevel: number): void {
    const targetIndex = this.stack.findIndex(
      (item) => item.level === targetLevel,
    );
    if (targetIndex !== -1 && targetIndex < this.stack.length - 1) {
      // Close all offcanvases after the target level
      const itemsToClose = this.stack.slice(targetIndex + 1);
      itemsToClose.forEach((item) => {
        if (item.ref) {
          item.ref.dismiss();
        }
      });
    }
  }

  /**
   * Get the current stack depth
   */
  getStackDepth(): number {
    return this.stack.length;
  }

  /**
   * Check if there are any open offcanvases
   */
  hasOpenOffcanvases(): boolean {
    return this.stack.length > 0;
  }

  /**
   * Get the width for the next offcanvas
   */
  getNextOffcanvasWidth(): string {
    const level = this.stack.length;
    const width = Math.max(
      this.BASE_WIDTH - level * this.WIDTH_DECREMENT,
      this.MIN_WIDTH,
    );
    return `${width}vw`;
  }

  /**
   * Clear all offcanvases (emergency cleanup)
   */
  clearAll(): void {
    this.stack.forEach((item) => {
      if (item.ref) {
        item.ref.dismiss();
      }
    });
    this.stack = [];
    this.stackSubject.next([]);
  }

  /**\n   * Get the z-index values for the next offcanvas\n   */
  getNextZIndexes(): { zIndex: number; backdropZIndex: number } {
    const level = this.stack.length;
    const zIndex = this.BASE_Z_INDEX + level * this.Z_INDEX_INCREMENT;
    const backdropZIndex = zIndex - 1;
    return { zIndex, backdropZIndex };
  }
  private generateId(): string {
    return `offcanvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update the offcanvas width via CSS custom property
   */
  private updateOffcanvasWidth(ref: NgbOffcanvasRef, width: string): void {
    // Access the offcanvas element and update its width
    setTimeout(() => {
      const offcanvasElement = document.querySelector(".offcanvas.show");
      if (offcanvasElement) {
        (offcanvasElement as HTMLElement).style.setProperty(
          "--bs-offcanvas-width",
          width,
        );
        (offcanvasElement as HTMLElement).style.width = width;
      }
    }, 10);
  }
}
