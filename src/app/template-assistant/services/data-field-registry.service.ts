/**
 * Data field registry service.
 * Dynamically generates field definitions from sample customer JSON data.
 * Supports any flat JSON structure - fields auto-adapt to JSON keys.
 */

import { Injectable, signal } from "@angular/core";
import { DataField } from "../models";

@Injectable({ providedIn: "root" })
export class DataFieldRegistryService {
  fields$ = signal<DataField[]>([]);
  private dataLoaded = false;

  constructor() {
    this.loadFieldsFromJson();
  }

  /**
   * Load sample customer data and dynamically extract field definitions.
   */
  private async loadFieldsFromJson(): Promise<void> {
    if (this.dataLoaded) {
      return;
    }

    try {
      const response = await fetch(
        "assets/templates/sample-customer-data.json",
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.customers && data.customers.length > 0) {
        // Extract keys from first customer object
        const firstCustomer = data.customers[0];
        const keys = Object.keys(firstCustomer);

        // Generate field definitions dynamically
        const fields = keys.map((key) => this.createFieldFromKey(key));
        this.fields$.set(fields);
        this.dataLoaded = true;
      } else {
        this.fields$.set([]);
      }
    } catch (error) {
      console.error("Failed to load sample customer data:", error);
      this.fields$.set([]);
    }
  }

  /**
   * Create a DataField definition from a JSON key.
   * Humanizes the key name and treats all values as text.
   */
  private createFieldFromKey(key: string): DataField {
    return {
      id: key,
      label: this.humanizeKey(key),
      type: "text", // Treat everything as text for now
      category: "other", // Default category for dynamic fields
      required: key === "id", // Only ID is required
    };
  }

  /**
   * Convert snake_case or camelCase to human-readable label.
   * Examples: "full_name" → "Full Name", "dateOfBirth" → "Date Of Birth"
   */
  private humanizeKey(key: string): string {
    return key
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
      .trim();
  }

  /**
   * Get all available data fields.
   */
  getAll(): DataField[] {
    return this.fields$();
  }

  /**
   * Get field by ID.
   */
  getById(id: string): DataField | undefined {
    return this.fields$().find((f) => f.id === id);
  }

  /**
   * Get fields by category.
   */
  getByCategory(category: string): DataField[] {
    return this.fields$().filter((f) => f.category === category);
  }

  /**
   * Validate if field ID exists.
   */
  isValidFieldId(id: string): boolean {
    return this.getById(id) !== undefined;
  }

  /**
   * Search fields by label or ID.
   */
  search(query: string): DataField[] {
    const lowerQuery = query.toLowerCase();
    return this.fields$().filter(
      (f) =>
        f.label.toLowerCase().includes(lowerQuery) ||
        f.id.toLowerCase().includes(lowerQuery),
    );
  }
}
