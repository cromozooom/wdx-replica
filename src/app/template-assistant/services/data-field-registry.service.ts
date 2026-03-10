/**
 * Data field registry service.
 * Provides 27 wealth management field definitions.
 */

import { Injectable, signal } from "@angular/core";
import { DataField, CUSTOMER_FIELDS } from "../models";

@Injectable({ providedIn: "root" })
export class DataFieldRegistryService {
  fields$ = signal<DataField[]>(CUSTOMER_FIELDS);

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
