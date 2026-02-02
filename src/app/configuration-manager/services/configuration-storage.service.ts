import { Injectable } from "@angular/core";
import { Configuration } from "../models/configuration.model";

const DB_NAME = "ConfigurationManagerDB";
const DB_VERSION = 1;
const STORE_NAME = "configurations";

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

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
          });
          objectStore.createIndex("name", "name", { unique: false });
          objectStore.createIndex("type", "type", { unique: false });
          objectStore.createIndex("version", "version", { unique: false });
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

  async getById(id: number): Promise<Configuration | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

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
      const request = objectStore.put(serialized);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

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
    return {
      ...data,
      createdDate: new Date(data.createdDate),
      lastModifiedDate: new Date(data.lastModifiedDate),
      updates: data.updates.map((u: any) => ({
        ...u,
        date: new Date(u.date),
      })),
    };
  }

  private deserializeConfigurations(data: any[]): Configuration[] {
    return data.map((d) => this.deserializeConfiguration(d));
  }
}
