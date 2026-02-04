import { Injectable } from "@angular/core";
import { Configuration } from "../models/configuration.model";

const DB_NAME = "ConfigurationManagerDB";
const DB_VERSION = 3; // Incremented for basketId support
const STORE_NAME = "configurations";
const BASKETS_STORE_NAME = "baskets";

@Injectable({
  providedIn: "root",
})
export class ConfigurationStorageService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Delete old configurations store if it exists (schema changed to composite key)
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }

        // Create configurations store with new schema
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: ["basketId", "id"], // Composite key
        });
        objectStore.createIndex("basketId", "basketId", { unique: false });
        objectStore.createIndex("name", "name", { unique: false });
        objectStore.createIndex("type", "type", { unique: false });
        objectStore.createIndex("version", "version", { unique: false });

        // Create baskets store (shared with BasketStorageService)
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

  closeConnection(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async getAll(): Promise<Configuration[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () =>
        resolve(this.deserializeConfigurations(request.result));
      request.onerror = () => reject(request.error);
    });
  }

  async getByBasketId(basketId: number): Promise<Configuration[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index("basketId");
      const request = index.getAll(basketId);

      request.onsuccess = () =>
        resolve(this.deserializeConfigurations(request.result));
      request.onerror = () => reject(request.error);
    });
  }

  async getById(
    basketId: number,
    id: number,
  ): Promise<Configuration | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get([basketId, id]);

      request.onsuccess = () =>
        resolve(
          request.result
            ? this.deserializeConfiguration(request.result)
            : undefined,
        );
      request.onerror = () => reject(request.error);
    });
  }

  async save(configuration: Configuration): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const serialized = this.serializeConfiguration(configuration);

      // Debug: Log if this is a Process with metadata
      if (
        configuration.type === "Processes (JavaScript)" &&
        serialized.configSourceMetadata
      ) {
        console.log("[Storage] Saving Process with metadata:", {
          name: configuration.name,
          hasMetadata: !!serialized.configSourceMetadata,
          metadataLength: serialized.configSourceMetadata?.length,
        });
      }

      const request = objectStore.put(serialized);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(basketId: number, id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete([basketId, id]);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getNextId(): Promise<number> {
    const all = await this.getAll();
    if (all.length === 0) {
      return 1;
    }
    return Math.max(...all.map((c) => c.id)) + 1;
  }

  private serializeConfiguration(config: Configuration): any {
    return {
      ...config,
      createdDate: config.createdDate.toISOString(),
      lastModifiedDate: config.lastModifiedDate.toISOString(),
      updates: config.updates.map((u) => ({
        ...u,
        date: u.date.toISOString(),
      })),
    };
  }

  private deserializeConfiguration(data: any): Configuration {
    const result = {
      ...data,
      createdDate: new Date(data.createdDate),
      lastModifiedDate: new Date(data.lastModifiedDate),
      updates: data.updates.map((u: any) => ({
        ...u,
        date: new Date(u.date),
      })),
    };

    // Debug: Log if this is a Process being loaded
    if (result.type === "Processes (JavaScript)" && data.configSourceMetadata) {
      console.log("[Storage] Deserializing Process with metadata:", {
        name: result.name,
        hasMetadataInData: !!data.configSourceMetadata,
        hasMetadataInResult: !!result.configSourceMetadata,
        metadataLength: result.configSourceMetadata?.length,
      });
    }

    return result;
  }

  private deserializeConfigurations(data: any[]): Configuration[] {
    return data.map((d) => this.deserializeConfiguration(d));
  }
}
