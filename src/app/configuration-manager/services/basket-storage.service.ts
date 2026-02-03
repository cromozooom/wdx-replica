import { Injectable } from "@angular/core";
import { Basket } from "../models/basket.model";

const DB_NAME = "ConfigurationManagerDB";
const DB_VERSION = 3; // Match ConfigurationStorageService version
const BASKETS_STORE_NAME = "baskets";
const CONFIGURATIONS_STORE_NAME = "configurations";

@Injectable({
  providedIn: "root",
})
export class BasketStorageService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
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
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("IndexedDB open error:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create configurations store if it doesn't exist
        if (!db.objectStoreNames.contains(CONFIGURATIONS_STORE_NAME)) {
          const configStore = db.createObjectStore(CONFIGURATIONS_STORE_NAME, {
            keyPath: "id",
          });
          configStore.createIndex("name", "name", { unique: false });
          configStore.createIndex("type", "type", { unique: false });
          configStore.createIndex("version", "version", { unique: false });
        }

        // Create baskets store
        if (!db.objectStoreNames.contains(BASKETS_STORE_NAME)) {
          const basketStore = db.createObjectStore(BASKETS_STORE_NAME, {
            keyPath: "id",
          });
          basketStore.createIndex("name", "name", { unique: true });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  async getAll(): Promise<Basket[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      try {
        // Check if baskets store exists
        if (!db.objectStoreNames.contains(BASKETS_STORE_NAME)) {
          console.warn("Baskets store not found, returning empty array");
          resolve([]);
          return;
        }

        const transaction = db.transaction([BASKETS_STORE_NAME], "readonly");
        const objectStore = transaction.objectStore(BASKETS_STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () =>
          resolve(this.deserializeBaskets(request.result));
        request.onerror = () => reject(request.error);
      } catch (error) {
        console.error("Error in getAll:", error);
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
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      try {
        // Check if baskets store exists
        if (!db.objectStoreNames.contains(BASKETS_STORE_NAME)) {
          reject(
            new Error(
              "Baskets store not found. Please use 'Force Delete DB' or 'Reset Database' button to reinitialize.",
            ),
          );
          return;
        }

        const transaction = db.transaction([BASKETS_STORE_NAME], "readwrite");
        const objectStore = transaction.objectStore(BASKETS_STORE_NAME);
        const serialized = this.serializeBasket(basket);
        const request = objectStore.put(serialized);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
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
    return {
      ...data,
      createdDate: new Date(data.createdDate),
      lastModifiedDate: new Date(data.lastModifiedDate),
    };
  }

  private deserializeBaskets(data: any[]): Basket[] {
    return data.map((d) => this.deserializeBasket(d));
  }
}
