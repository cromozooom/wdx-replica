import { Injectable } from "@angular/core";
import { Observable, from, BehaviorSubject } from "rxjs";
import { SavedSelection } from "../models/saved-selection.interface";

/**
 * Service for managing selection history using IndexedDB
 */
@Injectable({
  providedIn: "root",
})
export class SelectionHistoryService {
  private readonly DB_NAME = "spx-magic-selector-db";
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = "selections";

  private db: IDBDatabase | null = null;
  private selections$ = new BehaviorSubject<SavedSelection[]>([]);

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private initDB(): void {
    const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB");
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      this.loadAllSelections();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        const objectStore = db.createObjectStore(this.STORE_NAME, {
          keyPath: "id",
        });

        // Create indexes
        objectStore.createIndex("name", "name", { unique: false });
        objectStore.createIndex("domainId", "domainId", { unique: false });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  }

  /**
   * Get all selections as observable
   */
  getSelections(): Observable<SavedSelection[]> {
    return this.selections$.asObservable();
  }

  /**
   * Load all selections from IndexedDB
   */
  private loadAllSelections(): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(this.STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      const selections = request.result as SavedSelection[];
      // Convert date strings back to Date objects
      selections.forEach((sel) => {
        sel.createdAt = new Date(sel.createdAt);
        sel.updatedAt = new Date(sel.updatedAt);
      });
      // Sort by created date descending
      selections.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      this.selections$.next(selections);
    };

    request.onerror = () => {
      console.error("Failed to load selections");
    };
  }

  /**
   * Add a new selection
   */
  addSelection(selection: SavedSelection): Observable<string> {
    return new Observable((observer) => {
      if (!this.db) {
        observer.error("Database not initialized");
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(this.STORE_NAME);
      const request = objectStore.add(selection);

      request.onsuccess = () => {
        this.loadAllSelections();
        observer.next(selection.id);
        observer.complete();
      };

      request.onerror = () => {
        observer.error("Failed to add selection");
      };
    });
  }

  /**
   * Update an existing selection
   */
  updateSelection(selection: SavedSelection): Observable<void> {
    return new Observable((observer) => {
      if (!this.db) {
        observer.error("Database not initialized");
        return;
      }

      selection.updatedAt = new Date();

      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(this.STORE_NAME);
      const request = objectStore.put(selection);

      request.onsuccess = () => {
        this.loadAllSelections();
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        observer.error("Failed to update selection");
      };
    });
  }

  /**
   * Delete a selection
   */
  deleteSelection(id: string): Observable<void> {
    return new Observable((observer) => {
      if (!this.db) {
        observer.error("Database not initialized");
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(this.STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        this.loadAllSelections();
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        observer.error("Failed to delete selection");
      };
    });
  }

  /**
   * Get a single selection by ID
   */
  getSelection(id: string): Observable<SavedSelection | undefined> {
    return from(
      new Promise<SavedSelection | undefined>((resolve, reject) => {
        if (!this.db) {
          reject("Database not initialized");
          return;
        }

        const transaction = this.db.transaction([this.STORE_NAME], "readonly");
        const objectStore = transaction.objectStore(this.STORE_NAME);
        const request = objectStore.get(id);

        request.onsuccess = () => {
          const selection = request.result as SavedSelection | undefined;
          if (selection) {
            selection.createdAt = new Date(selection.createdAt);
            selection.updatedAt = new Date(selection.updatedAt);
          }
          resolve(selection);
        };

        request.onerror = () => {
          reject("Failed to get selection");
        };
      }),
    );
  }

  /**
   * Clear all selections
   */
  clearAll(): Observable<void> {
    return new Observable((observer) => {
      if (!this.db) {
        observer.error("Database not initialized");
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(this.STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        this.loadAllSelections();
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        observer.error("Failed to clear selections");
      };
    });
  }
}
