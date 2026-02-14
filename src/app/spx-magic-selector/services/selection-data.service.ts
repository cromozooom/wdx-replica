import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, delay, map, catchError, shareReplay } from "rxjs";
import { SelectionItem } from "../models/selection-item.interface";
import { DomainSchema } from "../models/domain-schema.interface";
import { Query } from "../models/query.interface";
import { FlatSelectionRow } from "../models/flat-selection-row.interface";
import {
  ALL_DOMAINS,
  ALL_SELECTION_ITEMS_BY_DOMAIN,
} from "./mock-data.constants";

/**
 * Service providing access to selection items and domain schemas
 *
 * Data Source Options:
 * 1. USE_GENERATED_JSON_DATA = true: Loads from /assets/magic-selector-data/ (200 items, realistic data)
 * 2. USE_GENERATED_JSON_DATA = false: Uses in-memory mock data constants (legacy)
 *
 * Toggle the USE_GENERATED_JSON_DATA flag below to switch between data sources.
 */
@Injectable({
  providedIn: "root",
})
export class SelectionDataService {
  private http = inject(HttpClient);

  /**
   * FEATURE TOGGLE: Set to true to use generated JSON data from assets/magic-selector-data/
   * Set to false to use legacy mock data constants (backward compatibility)
   */
  private readonly USE_GENERATED_JSON_DATA = true;

  /**
   * Cached observable of all selection items loaded from JSON
   * Only used when USE_GENERATED_JSON_DATA = true
   */
  private allItems$: Observable<SelectionItem[]> | null = null;

  /**
   * Cached observable of all domains loaded from JSON
   * Only used when USE_GENERATED_JSON_DATA = true
   */
  private allDomains$: Observable<DomainSchema[]> | null = null;

  /**
   * Load all selection items from JSON file (cached)
   * @returns Observable of all selection items
   */
  private loadAllItemsFromJson(): Observable<SelectionItem[]> {
    if (!this.allItems$) {
      this.allItems$ = this.http
        .get<
          SelectionItem[]
        >("/assets/magic-selector-data/selection_items.json")
        .pipe(
          catchError((error) => {
            console.error("Failed to load selection items from JSON:", error);
            console.warn("Falling back to mock data constants");
            return of(Object.values(ALL_SELECTION_ITEMS_BY_DOMAIN).flat());
          }),
          shareReplay(1), // Cache the result
        );
    }
    return this.allItems$;
  }

  /**
   * Load all domains from JSON file (cached)
   * @returns Observable of all domain schemas
   */
  private loadAllDomainsFromJson(): Observable<DomainSchema[]> {
    if (!this.allDomains$) {
      this.allDomains$ = this.http
        .get<DomainSchema[]>("/assets/magic-selector-data/domains.json")
        .pipe(
          catchError((error) => {
            console.error("Failed to load domains from JSON:", error);
            console.warn("Falling back to mock data constants");
            return of(ALL_DOMAINS);
          }),
          shareReplay(1), // Cache the result
        );
    }
    return this.allDomains$;
  }
  /**
   * Get all available selection items for a specific domain
   * @param domainId Domain identifier (e.g., 'crm-scheduling')
   * @returns Observable of SelectionItem array
   */
  getAvailableItems(domainId: string): Observable<SelectionItem[]> {
    if (this.USE_GENERATED_JSON_DATA) {
      return this.loadAllItemsFromJson().pipe(
        map((items) =>
          items.filter((item) => {
            // For JSON data, we need to extract domain from entityName
            // Assuming entityName format like "Contact_001", "Appointment_042"
            // We'll match based on entity categories or just return all for now
            // TODO: Adjust filtering logic based on actual domain structure in JSON
            return true; // Return all items for now, can be refined
          }),
        ),
        delay(Math.random() * 100 + 50), // Simulate network latency
      );
    } else {
      // Legacy: use mock data constants
      const items = ALL_SELECTION_ITEMS_BY_DOMAIN[domainId] || [];
      return of(items).pipe(delay(Math.random() * 100 + 50));
    }
  }

  /**
   * Get all available domain schemas
   * @returns Observable of DomainSchema array
   */
  getDomainSchemas(): Observable<DomainSchema[]> {
    if (this.USE_GENERATED_JSON_DATA) {
      return this.loadAllDomainsFromJson().pipe(delay(50));
    } else {
      // Legacy: use mock data constants
      return of(ALL_DOMAINS).pipe(delay(50));
    }
  }

  /**
   * Get a specific selection item by ID
   * @param itemId Item identifier
   * @returns Observable of SelectionItem or null if not found
   */
  getItemById(itemId: string): Observable<SelectionItem | null> {
    if (this.USE_GENERATED_JSON_DATA) {
      return this.loadAllItemsFromJson().pipe(
        map((items) => items.find((i) => i.id === itemId) || null),
        delay(30),
      );
    } else {
      // Legacy: search through mock data constants
      for (const items of Object.values(ALL_SELECTION_ITEMS_BY_DOMAIN)) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          return of(item).pipe(delay(30));
        }
      }
      return of(null).pipe(delay(30));
    }
  }

  /**
   * Get a specific query by item ID and query ID
   * @param itemId Parent item identifier
   * @param queryId Query identifier
   * @returns Observable of Query or null if not found
   */
  getQueryById(itemId: string, queryId: string): Observable<Query | null> {
    if (this.USE_GENERATED_JSON_DATA) {
      return this.loadAllItemsFromJson().pipe(
        map((items) => {
          const item = items.find((i) => i.id === itemId);
          if (item) {
            return item.queries.find((q) => q.id === queryId) || null;
          }
          return null;
        }),
        delay(30),
      );
    } else {
      // Legacy: search through mock data constants
      for (const items of Object.values(ALL_SELECTION_ITEMS_BY_DOMAIN)) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const query = item.queries.find((q) => q.id === queryId);
          return of(query || null).pipe(delay(30));
        }
      }
      return of(null).pipe(delay(30));
    }
  }

  /**
   * Search for selection items by name or description
   * @param searchTerm Search string (case-insensitive)
   * @param domainId Optional domain filter
   * @returns Observable of matching SelectionItem array
   */
  searchItems(
    searchTerm: string,
    domainId?: string,
  ): Observable<SelectionItem[]> {
    const term = searchTerm.toLowerCase();

    if (this.USE_GENERATED_JSON_DATA) {
      return this.loadAllItemsFromJson().pipe(
        map((allItems) => {
          // Apply domain filter if provided (currently returns all)
          let filtered = domainId ? allItems : allItems;

          // Apply search filter
          return filtered.filter(
            (item) =>
              item.name.toLowerCase().includes(term) ||
              item.description?.toLowerCase().includes(term) ||
              item.entityName.toLowerCase().includes(term),
          );
        }),
        delay(80),
      );
    } else {
      // Legacy: use mock data constants
      let allItems: SelectionItem[] = [];

      if (domainId) {
        allItems = ALL_SELECTION_ITEMS_BY_DOMAIN[domainId] || [];
      } else {
        allItems = Object.values(ALL_SELECTION_ITEMS_BY_DOMAIN).flat();
      }

      const results = allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.entityName.toLowerCase().includes(term),
      );

      return of(results).pipe(delay(80));
    }
  }

  /**
   * Filter selection items by entity name
   * @param entityName Entity name to filter by
   * @param domainId Optional domain filter
   * @returns Observable of matching SelectionItem array
   */
  filterByEntity(
    entityName: string,
    domainId?: string,
  ): Observable<SelectionItem[]> {
    if (this.USE_GENERATED_JSON_DATA) {
      return this.loadAllItemsFromJson().pipe(
        map((allItems) => {
          // Apply domain filter if provided (currently returns all)
          let filtered = domainId ? allItems : allItems;

          // Apply entity filter
          return filtered.filter((item) => item.entityName === entityName);
        }),
        delay(50),
      );
    } else {
      // Legacy: use mock data constants
      let allItems: SelectionItem[] = [];

      if (domainId) {
        allItems = ALL_SELECTION_ITEMS_BY_DOMAIN[domainId] || [];
      } else {
        allItems = Object.values(ALL_SELECTION_ITEMS_BY_DOMAIN).flat();
      }

      const results = allItems.filter((item) => item.entityName === entityName);

      return of(results).pipe(delay(50));
    }
  }

  /**
   * Get domain schema by domain ID
   * @param domainId Domain identifier
   * @returns Observable of DomainSchema or null if not found
   */
  getDomainById(domainId: string): Observable<DomainSchema | null> {
    if (this.USE_GENERATED_JSON_DATA) {
      return this.loadAllDomainsFromJson().pipe(
        map((domains) => domains.find((d) => d.domainId === domainId) || null),
        delay(30),
      );
    } else {
      // Legacy: use mock data constants
      const domain = ALL_DOMAINS.find((d) => d.domainId === domainId);
      return of(domain || null).pipe(delay(30));
    }
  }

  /**
   * Estimate record count for a query (returns query.estimatedCount)
   * @param query Query to estimate
   * @returns Observable of estimated count
   */
  estimateRecordCount(query: Query): Observable<number> {
    const count = query.estimatedCount || 0;
    return of(count).pipe(delay(100));
  }

  /**
   * Flatten selection items into grid rows (one row per query)
   * Converts SelectionItem[] to FlatSelectionRow[] for ag-grid display
   * @param items Selection items to flatten
   * @returns Array of flattened rows
   */
  flattenToGridRows(items: SelectionItem[]): FlatSelectionRow[] {
    const rows: FlatSelectionRow[] = [];

    items.forEach((item) => {
      item.queries.forEach((query) => {
        rows.push({
          uniqueId: `${item.id}-${query.id}`,
          sourceName: item.name,
          entityName: item.entityName,
          queryName: query.name,
          queryDescription: query.description,
          estimatedRecords: query.estimatedCount || 0,
          queryRef: query,
          originalItem: item,
          isSelected: false,
        });
      });
    });

    return rows;
  }
}
