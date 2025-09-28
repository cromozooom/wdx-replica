import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ZIndexService {
  private currentZIndex = 2000; // Start above most default overlays

  /**
   * Get the current top z-index value (does not increment).
   */
  getCurrent(): number {
    return this.currentZIndex;
  }

  /**
   * Reserve and return the next available z-index value.
   */
  next(): number {
    return ++this.currentZIndex;
  }

  /**
   * Set the current z-index to a specific value (if needed).
   */
  set(z: number): void {
    if (z > this.currentZIndex) {
      this.currentZIndex = z;
    }
  }

  /**
   * Reset the z-index counter (use with caution).
   */
  reset(start: number = 2000): void {
    this.currentZIndex = start;
  }
}
