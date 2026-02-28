import { MenuItem } from "../models";

/**
 * Type-safe localStorage access for menu data.
 * Part of the Jira-style hierarchical navigation sidebar feature.
 *
 * Handles localStorage operations with error handling for QuotaExceededError (FR-032).
 *
 * @see specs/001-jira-sidebar-nav/data-model.md for schema
 */
export class MenuLocalStorage {
  private static readonly KEYS = {
    MENU_STRUCTURE: "nav-menu-structure",
    EXPANDED_NODES: "nav-expanded-nodes",
    SIDEBAR_LOCKED: "nav-sidebar-locked",
    SIDEBAR_WIDTH: "nav-sidebar-width",
    METADATA: "nav-metadata",
  } as const;

  /**
   * Save menu structure to localStorage.
   * @returns true if save succeeded, false if QuotaExceededError occurred
   */
  static saveMenuStructure(items: MenuItem[]): boolean {
    try {
      localStorage.setItem(this.KEYS.MENU_STRUCTURE, JSON.stringify(items));
      return true;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.error(
          "[MenuLocalStorage] QuotaExceededError: localStorage quota exceeded",
          error,
        );
        // Emit event for UI notification (FR-032)
        this.emitStorageError(
          "QuotaExceededError",
          "Menu structure save failed: storage quota exceeded",
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Load menu structure from localStorage.
   * @returns MenuItem array or null if not found
   */
  static loadMenuStructure(): MenuItem[] | null {
    try {
      const data = localStorage.getItem(this.KEYS.MENU_STRUCTURE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(
        "[MenuLocalStorage] Failed to parse menu structure from localStorage",
        error,
      );
      return null;
    }
  }

  /**
   * Save expanded node IDs to localStorage.
   * @returns true if save succeeded, false if error occurred
   */
  static saveExpandedNodes(nodeIds: string[]): boolean {
    try {
      localStorage.setItem(this.KEYS.EXPANDED_NODES, JSON.stringify(nodeIds));
      return true;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.error(
          "[MenuLocalStorage] QuotaExceededError: Failed to save expanded nodes",
          error,
        );
        this.emitStorageError(
          "QuotaExceededError",
          "Expanded nodes save failed: storage quota exceeded",
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Load expanded node IDs from localStorage.
   * @returns Array of node IDs (empty if none saved)
   */
  static loadExpandedNodes(): string[] {
    try {
      const data = localStorage.getItem(this.KEYS.EXPANDED_NODES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(
        "[MenuLocalStorage] Failed to parse expanded nodes from localStorage",
        error,
      );
      return [];
    }
  }

  /**
   * Save sidebar locked state to localStorage.
   * @returns true if save succeeded, false if error occurred
   */
  static saveSidebarLocked(locked: boolean): boolean {
    try {
      localStorage.setItem(this.KEYS.SIDEBAR_LOCKED, JSON.stringify(locked));
      return true;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.error(
          "[MenuLocalStorage] QuotaExceededError: Failed to save sidebar locked state",
          error,
        );
        this.emitStorageError(
          "QuotaExceededError",
          "Sidebar lock state save failed",
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Load sidebar locked state from localStorage.
   * @returns Boolean value (defaults to false if not saved)
   */
  static loadSidebarLocked(): boolean {
    try {
      const data = localStorage.getItem(this.KEYS.SIDEBAR_LOCKED);
      return data ? JSON.parse(data) : false;
    } catch (error) {
      console.error(
        "[MenuLocalStorage] Failed to parse sidebar locked state from localStorage",
        error,
      );
      return false;
    }
  }

  /**
   * Save sidebar width to localStorage.
   * @returns true if save succeeded, false if error occurred
   */
  static saveSidebarWidth(width: number): boolean {
    try {
      localStorage.setItem(this.KEYS.SIDEBAR_WIDTH, JSON.stringify(width));
      return true;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.error(
          "[MenuLocalStorage] QuotaExceededError: Failed to save sidebar width",
          error,
        );
        this.emitStorageError(
          "QuotaExceededError",
          "Sidebar width save failed",
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Load sidebar width from localStorage.
   * @returns Sidebar width in pixels (defaults to 20 if not saved)
   */
  static loadSidebarWidth(): number {
    try {
      const data = localStorage.getItem(this.KEYS.SIDEBAR_WIDTH);
      return data ? JSON.parse(data) : 20;
    } catch (error) {
      console.error(
        "[MenuLocalStorage] Failed to parse sidebar width from localStorage",
        error,
      );
      return 20;
    }
  }

  /**
   * Save metadata to localStorage.
   * @returns true if save succeeded, false if error occurred
   */
  static saveMetadata(metadata: {
    version: string;
    lastSaved: string;
  }): boolean {
    try {
      localStorage.setItem(this.KEYS.METADATA, JSON.stringify(metadata));
      return true;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.error(
          "[MenuLocalStorage] QuotaExceededError: Failed to save metadata",
          error,
        );
        this.emitStorageError("QuotaExceededError", "Metadata save failed");
        return false;
      }
      throw error;
    }
  }

  /**
   * Load metadata from localStorage.
   * @returns Metadata object or null if not found
   */
  static loadMetadata(): { version: string; lastSaved: string } | null {
    try {
      const data = localStorage.getItem(this.KEYS.METADATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(
        "[MenuLocalStorage] Failed to parse metadata from localStorage",
        error,
      );
      return null;
    }
  }

  /**
   * Clear all menu-related data from localStorage.
   */
  static clear(): void {
    Object.values(this.KEYS).forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Emit custom event for storage errors (FR-032).
   * UI components can listen to this event to show notifications.
   */
  private static emitStorageError(errorType: string, message: string): void {
    const event = new CustomEvent("menu-storage-error", {
      detail: { errorType, message, timestamp: new Date().toISOString() },
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if localStorage is available and has space.
   * @returns Estimated available storage in bytes (rough estimate)
   */
  static checkStorageAvailability(): {
    available: boolean;
    estimatedSpace?: number;
  } {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);

      // Rough estimate: calculate current usage
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          totalSize += key.length + (value?.length || 0);
        }
      }

      // Most browsers allow 5-10MB, we'll assume 5MB minimum
      const estimatedQuota = 5 * 1024 * 1024; // 5MB in bytes
      const estimatedSpace = estimatedQuota - totalSize;

      return { available: true, estimatedSpace };
    } catch (error) {
      return { available: false };
    }
  }
}
