/**
 * Customer data service.
 * Loads sample wealth management customer data for MVP.
 * AG-Grid integration deferred to future phase.
 */

import { Injectable, signal } from "@angular/core";
import { CustomerRecord } from "../models";

@Injectable({ providedIn: "root" })
export class CustomerDataService {
  customers$ = signal<CustomerRecord[]>([]);
  private dataLoaded = false;

  /**
   * Load customer data from JSON file.
   */
  async loadCustomers(): Promise<CustomerRecord[]> {
    if (this.dataLoaded) {
      return this.customers$();
    }

    try {
      const response = await fetch(
        "assets/templates/sample-customer-data.json",
      );
      const data = await response.json();
      this.customers$.set(data.customers || []);
      this.dataLoaded = true;
      return this.customers$();
    } catch (error) {
      console.error("Failed to load customer data:", error);
      return [];
    }
  }

  /**
   * Get all customers.
   */
  getAll(): CustomerRecord[] {
    return this.customers$();
  }

  /**
   * Get customer by ID.
   */
  getById(id: string): CustomerRecord | undefined {
    return this.customers$().find((c) => c.id === id);
  }

  /**
   * Search customers by name.
   */
  search(query: string): CustomerRecord[] {
    const lowerQuery = query.toLowerCase();
    return this.customers$().filter((c) =>
      c.full_name?.toLowerCase().includes(lowerQuery),
    );
  }
}
