import { Injectable } from "@angular/core";
import {
  Basket,
  BASKET_COLORS,
  CORE_BASKET_COLOR,
} from "../models/basket.model";

const DB_NAME = "ConfigurationManagerDB";
const DB_VERSION = 3; // Match ConfigurationStorageService version
const BASKETS_STORE_NAME = "baskets";
const CONFIGURATIONS_STORE_NAME = "configurations";

@Injectable({
  providedIn: "root",
})
export class BasketStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    console.log("[BasketStorageService] Constructor called");
    this.initPromise = this.initDB();
  }

  async resetDatabase(): Promise<void> {
    // Close existing connection
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Delete the database
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

      deleteRequest.onsuccess = async () => {
        // Reinitialize the database
        await this.initDB();
        resolve();
      };

      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onblocked = () => {
        console.warn("Database deletion blocked");
        reject(
          new Error(
            "Database deletion was blocked. Please close all other tabs using this application.",
          ),
        );
      };
    });
  }

  private async initDB(): Promise<void> {
    console.log("[BasketStorageService] initDB() starting...");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      console.log(
        "[BasketStorageService] IndexedDB open request created for",
        DB_NAME,
        "version",
        DB_VERSION,
      );

      // Add timeout to detect if database opening is stuck
      const timeout = setTimeout(() => {
        console.error(
          "[BasketStorageService] ⚠ Database opening timeout - possibly blocked by another tab",
        );
        reject(
          new Error(
            "Database opening timeout - possibly blocked by other tabs. Please close all other tabs with this application open.",
          ),
        );
      }, 5000); // 5 second timeout

      request.onerror = () => {
        clearTimeout(timeout);
        console.error(
          "[BasketStorageService] ✗ IndexedDB open error:",
          request.error,
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        this.db = request.result;
        console.log("[BasketStorageService] ✓ IndexedDB opened successfully");
        console.log(
          "[BasketStorageService] Available object stores:",
          Array.from(this.db.objectStoreNames),
        );
        resolve();
      };

      request.onblocked = () => {
        clearTimeout(timeout);
        console.error(
          "[BasketStorageService] ⚠ Database opening blocked by other tabs",
        );
        reject(
          new Error(
            "Database is blocked by other browser tabs. Please close all other tabs with this application open, then refresh this page.",
          ),
        );
      };

      request.onupgradeneeded = (event) => {
        console.log(
          "[BasketStorageService] onupgradeneeded triggered - upgrading database schema",
        );
        const db = (event.target as IDBOpenDBRequest).result;

        // Create configurations store if it doesn't exist
        if (!db.objectStoreNames.contains(CONFIGURATIONS_STORE_NAME)) {
          console.log(
            "[BasketStorageService] Creating configurations store...",
          );
          const configStore = db.createObjectStore(CONFIGURATIONS_STORE_NAME, {
            keyPath: "id",
          });
          configStore.createIndex("name", "name", { unique: false });
          configStore.createIndex("type", "type", { unique: false });
          configStore.createIndex("version", "version", { unique: false });
          console.log("[BasketStorageService] ✓ Configurations store created");
        } else {
          console.log(
            "[BasketStorageService] Configurations store already exists",
          );
        }

        // Create baskets store
        if (!db.objectStoreNames.contains(BASKETS_STORE_NAME)) {
          console.log("[BasketStorageService] Creating baskets store...");
          const basketStore = db.createObjectStore(BASKETS_STORE_NAME, {
            keyPath: "id",
          });
          basketStore.createIndex("name", "name", { unique: true });
          console.log("[BasketStorageService] ✓ Baskets store created");
        } else {
          console.log("[BasketStorageService] Baskets store already exists");
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    console.log("[BasketStorageService] ensureDB() called");
    if (this.initPromise) {
      console.log(
        "[BasketStorageService] Waiting for initial DB initialization...",
      );
      await this.initPromise;
      this.initPromise = null;
    }
    if (!this.db) {
      console.log("[BasketStorageService] DB is null, calling initDB()...");
      await this.initDB();
    }
    console.log("[BasketStorageService] DB ready");
    return this.db!;
  }

  async getAll(): Promise<Basket[]> {
    console.log("[BasketStorageService] getAll() called");
    const db = await this.ensureDB();
    console.log(
      "[BasketStorageService] DB ensured, checking for baskets store...",
    );
    return new Promise((resolve, reject) => {
      try {
        // Check if baskets store exists
        if (!db.objectStoreNames.contains(BASKETS_STORE_NAME)) {
          console.warn(
            "[BasketStorageService] ⚠ Baskets store not found, returning empty array",
          );
          resolve([]);
          return;
        }

        console.log(
          "[BasketStorageService] Creating transaction to read baskets...",
        );
        const transaction = db.transaction([BASKETS_STORE_NAME], "readonly");
        const objectStore = transaction.objectStore(BASKETS_STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => {
          console.log(
            "[BasketStorageService] ✓ Retrieved baskets:",
            request.result.length,
            "items",
          );
          resolve(this.deserializeBaskets(request.result));
        };
        request.onerror = () => {
          console.error(
            "[BasketStorageService] ✗ getAll error:",
            request.error,
          );
          reject(request.error);
        };
      } catch (error) {
        console.error("[BasketStorageService] ✗ Error in getAll:", error);
        resolve([]);
      }
    });
  }

  async getById(id: number): Promise<Basket | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BASKETS_STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(BASKETS_STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () =>
        resolve(
          request.result ? this.deserializeBasket(request.result) : undefined,
        );
      request.onerror = () => reject(request.error);
    });
  }

  async save(basket: Basket): Promise<void> {
    console.log(
      "[BasketStorageService] save() called for basket:",
      basket.name,
      "ID:",
      basket.id,
    );
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      try {
        // Check if baskets store exists
        if (!db.objectStoreNames.contains(BASKETS_STORE_NAME)) {
          console.error("[BasketStorageService] ✗ Baskets store not found!");
          reject(
            new Error(
              "Baskets store not found. Please use 'Force Delete DB' or 'Reset Database' button to reinitialize.",
            ),
          );
          return;
        }

        console.log(
          "[BasketStorageService] Creating transaction to save basket...",
        );
        const transaction = db.transaction([BASKETS_STORE_NAME], "readwrite");
        const objectStore = transaction.objectStore(BASKETS_STORE_NAME);
        const serialized = this.serializeBasket(basket);
        const request = objectStore.put(serialized);

        request.onsuccess = () => {
          console.log("[BasketStorageService] ✓ Basket saved successfully");
          resolve();
        };
        request.onerror = () => {
          console.error("[BasketStorageService] ✗ Save error:", request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error("[BasketStorageService] ✗ Exception in save:", error);
        reject(error);
      }
    });
  }

  async delete(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BASKETS_STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(BASKETS_STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getNextId(): Promise<number> {
    const all = await this.getAll();
    if (all.length === 0) {
      return 1;
    }
    return Math.max(...all.map((b) => b.id)) + 1;
  }

  private serializeBasket(basket: Basket): any {
    return {
      ...basket,
      createdDate: basket.createdDate.toISOString(),
      lastModifiedDate: basket.lastModifiedDate.toISOString(),
    };
  }

  private deserializeBasket(data: any): Basket {
    // Migration: Add color property to existing baskets without it
    let color = data.color;
    if (!color) {
      color =
        data.name === "Product (core)" ? CORE_BASKET_COLOR : BASKET_COLORS[0];
    }

    return {
      ...data,
      color,
      createdDate: new Date(data.createdDate),
      lastModifiedDate: new Date(data.lastModifiedDate),
    };
  }

  private deserializeBaskets(data: any[]): Basket[] {
    return data.map((d) => this.deserializeBasket(d));
  }
}
