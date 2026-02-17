import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  Observable,
  of,
  delay,
  map,
  catchError,
  shareReplay,
  BehaviorSubject,
  combineLatest,
  switchMap,
  throwError,
} from "rxjs";
import { SelectionItem } from "../models/selection-item.interface";
import { DomainSchema } from "../models/domain-schema.interface";
import { Query } from "../models/query.interface";
import { QueryParameters } from "../models/query-parameters.interface";
import { FlatSelectionRow } from "../models/flat-selection-row.interface";
import {
  FormSummary,
  FormMetadata,
  PreviewDataResponse,
  QuerySummary,
} from "../models/three-call-api.interface";

/**
 * Service providing access to selection items using Three-Call API Strategy
 *
 * Data Loading Strategy:
 * 1. Call A: Load form-summaries.json for dropdown population (lightweight)
 * 2. Call B: Load form-metadata.json when form is selected (with queries)
 * 3. Call C: Load preview-data-*.json when query is selected (actual data)
 *
 * This approach mimics production APIs for better scalability and performance.
 */
@Injectable({
  providedIn: "root",
})
export class SelectionDataService {
  private http = inject(HttpClient);

  /**
   * FEATURE TOGGLE: Set to true to use new Three-Call API pattern
   * Set to false to use legacy monolithic approach (backward compatibility)
   */
  private readonly USE_THREE_CALL_API = true;

  /**
   * Domain to category mapping for filtering forms by domain
   * Maps domain IDs to their associated form categories
   */
  private readonly DOMAIN_CATEGORY_MAP: Record<string, string[]> = {
    "crm-scheduling": [
      "portfolio",
      "client",
      "investment",
      "trading",
      "planning",
    ],
    "document-management": ["reporting", "compliance", "research"],
  };

  // Three-Call API Cache observables
  private formSummaries$: Observable<FormSummary[]> | null = null;
  private allFormMetadata$: Observable<Record<string, FormMetadata>> | null =
    null;
  private formMetadataCache = new Map<
    string,
    Observable<FormMetadata | null>
  >();

  // Legacy cache observables (for backward compatibility)
  private allItems$: Observable<SelectionItem[]> | null = null;
  private allDomains$: Observable<DomainSchema[]> | null = null;

  /**
   * Call A: Load form summaries for dropdown population (cached)
   * @returns Observable of lightweight form summaries
   */
  getFormSummaries(): Observable<FormSummary[]> {
    if (!this.formSummaries$) {
      console.log("🌐 [HTTP] Loading form-summaries.json (FIRST TIME)");
      this.formSummaries$ = this.http
        .get<FormSummary[]>("/assets/magic-selector-data/form-summaries.json")
        .pipe(
          catchError((error) => {
            console.error(
              "❌ CRITICAL: Failed to load form-summaries.json:",
              error,
            );
            console.error(
              "🔍 Check if the file exists and the server is running",
            );
            console.error(
              "📁 Expected location: /assets/magic-selector-data/form-summaries.json",
            );
            // Show user-friendly error instead of fallback
            throw new Error(
              `Failed to load form summaries. Please check if the mock data files are generated and accessible.`,
            );
          }),
          shareReplay(1), // Cache the result
          delay(Math.random() * 100 + 50), // Simulate network latency
        );
    } else {
      console.log("💾 [CACHE] Returning cached form-summaries (no HTTP call)");
    }
    return this.formSummaries$;
  }

  /**
   * Load all form metadata (cached) - single HTTP request for all forms
   * @returns Observable of all form metadata
   */
  private loadAllFormMetadata(): Observable<Record<string, FormMetadata>> {
    if (!this.allFormMetadata$) {
      this.allFormMetadata$ = this.http
        .get<
          Record<string, FormMetadata>
        >("/assets/magic-selector-data/form-metadata.json")
        .pipe(
          catchError((error) => {
            console.error(
              `❌ CRITICAL: Failed to load form-metadata.json:`,
              error,
            );
            console.error(
              "🔍 Check if the file exists and was generated properly",
            );
            console.error(
              "📁 Expected location: /assets/magic-selector-data/form-metadata.json",
            );
            throw new Error(
              `Failed to load form metadata. Please regenerate mock data files.`,
            );
          }),
          shareReplay(1), // Cache the entire metadata object
        );
    }
    return this.allFormMetadata$;
  }

  /**
   * Call B: Load form metadata when form is selected (per-form caching)
   * @param formId Form identifier
   * @returns Observable of detailed form metadata with queries
   */
  getFormMetadata(formId: string): Observable<FormMetadata | null> {
    if (!this.formMetadataCache.has(formId)) {
      const metadata$ = this.loadAllFormMetadata().pipe(
        map((allMetadata) => allMetadata[formId] || null),
        catchError((error) => {
          console.error(
            `❌ CRITICAL: Failed to load metadata for form ${formId}:`,
            error,
          );
          console.error(
            "📁 Expected location: /assets/magic-selector-data/form-metadata.json",
          );
          return throwError(
            () =>
              new Error(
                `Failed to load metadata for form ${formId}: ${error.message}`,
              ),
          );
        }),
        delay(Math.random() * 150 + 75), // Simulate network latency
      );

      this.formMetadataCache.set(formId, metadata$);
    }

    return this.formMetadataCache.get(formId)!;
  }

  /**
   * Call C: Load preview data when query is selected
   * @param entityId Entity identifier (e.g., "entity-contact")
   * @param queryId Query identifier (e.g., "query-all-records")
   * @returns Observable of preview data response
   */
  getPreviewData(
    entityId: string,
    queryId: string,
  ): Observable<PreviewDataResponse | null> {
    const filename = `preview-data-${entityId}-${queryId}.json`;
    const path = `/assets/magic-selector-data/${filename}`;

    return this.http.get<PreviewDataResponse>(path).pipe(
      catchError((error) => {
        console.error(`Failed to load preview data from ${filename}:`, error);
        console.warn("Returning null - no preview data available");
        return of(null);
      }),
      delay(Math.random() * 200 + 100), // Simulate network latency for data loading
    );
  }

  /**
   * Get all available selection items for a specific domain (legacy method)
   * @param domainId Domain identifier (e.g., 'crm-scheduling')
   * @returns Observable of SelectionItem array
   */
  getAvailableItems(domainId: string): Observable<SelectionItem[]> {
    // Always use three-call API (legacy constants removed)
    return this.convertThreeCallToLegacy(domainId).pipe(
      delay(Math.random() * 100 + 50),
    );
  }

  /**
   * Search for forms by name, description, or entity
   * @param searchTerm Search string (case-insensitive)
   * @param category Optional category filter
   * @returns Observable of matching FormSummary array
   */
  searchForms(
    searchTerm: string,
    category?: string,
  ): Observable<FormSummary[]> {
    const term = searchTerm.toLowerCase();

    return this.getFormSummaries().pipe(
      map((forms) => {
        // Apply category filter if provided
        let filtered = category
          ? forms.filter((form) => form.category === category)
          : forms;

        // Apply search filter - search in name, description, entityName, and category
        return filtered.filter(
          (form) =>
            form.name.toLowerCase().includes(term) ||
            form.description?.toLowerCase().includes(term) ||
            form.entityName.toLowerCase().includes(term) ||
            form.category.toLowerCase().includes(term),
        );
      }),
      delay(80),
    );
  }

  /**
   * Get form summary by ID
   * @param formId Form identifier
   * @returns Observable of FormSummary or null if not found
   */
  getFormSummaryById(formId: string): Observable<FormSummary | null> {
    return this.getFormSummaries().pipe(
      map((forms) => forms.find((form) => form.id === formId) || null),
      delay(30),
    );
  }

  /**
   * Get available categories from form summaries
   * @returns Observable of unique category strings
   */
  getAvailableCategories(): Observable<string[]> {
    return this.getFormSummaries().pipe(
      map((forms) => {
        const categories = new Set(forms.map((form) => form.category));
        return Array.from(categories).sort();
      }),
      delay(30),
    );
  }

  /**
   * Convert three-call API data to legacy SelectionItem format for backward compatibility
   * This method now makes REAL API calls to form-metadata.json for each form
   * @param domainId Optional domain ID to filter forms by category
   * @returns Observable of SelectionItem array
   */
  private convertThreeCallToLegacy(
    domainId?: string,
  ): Observable<SelectionItem[]> {
    return this.getFormSummaries().pipe(
      map((summaries) => {
        console.log(
          `🔍 [SelectionDataService] Converting for domain: ${domainId}`,
        );
        console.log(`📊 Total summaries loaded: ${summaries.length}`);

        // Filter summaries by domain if provided
        if (domainId && this.DOMAIN_CATEGORY_MAP[domainId]) {
          const allowedCategories = this.DOMAIN_CATEGORY_MAP[domainId];
          const filtered = summaries.filter((summary) =>
            allowedCategories.includes(summary.category),
          );
          console.log(
            `✅ Filtered to ${filtered.length} items for domain "${domainId}"`,
          );
          console.log(`📋 Categories: ${allowedCategories.join(", ")}`);
          console.log(
            `🏷️ Item types:`,
            filtered.map((f) => `${f.name} (${f.type})`),
          );
          return filtered;
        }
        return summaries;
      }),
      switchMap((summaries) => {
        if (summaries.length === 0) {
          // No forms for this domain
          return of([]);
        }

        // For each form summary, fetch its metadata (Call B)
        const metadataRequests = summaries.map((summary) =>
          this.getFormMetadata(summary.id).pipe(
            map((metadata) => {
              if (!metadata) {
                // Fallback if metadata not found
                return {
                  id: summary.id,
                  type: summary.type || "Form",
                  name: summary.name,
                  entityName: summary.entityName,
                  entityId: summary.id, // Fallback: use form ID as entityId
                  description: summary.description || "",
                  queries: [] as Query[],
                };
              }

              // Convert FormMetadata + QuerySummary to SelectionItem + Query
              return {
                id: metadata.id,
                type: metadata.type || "Form",
                name: metadata.name,
                entityName: metadata.entityName,
                entityId: metadata.entityId,
                description: metadata.description || "",
                queries: metadata.queries.map(
                  (querySummary): Query => ({
                    id: querySummary.id,
                    name: querySummary.name,
                    description: querySummary.description || "",
                    estimatedCount: querySummary.estimatedResults,
                    parameters: {
                      filters: [],
                    } as any,
                  }),
                ),
              } as SelectionItem;
            }),
          ),
        );

        // Wait for all metadata requests to complete
        return combineLatest(metadataRequests);
      }),
    );
  }

  getItemById(itemId: string): Observable<SelectionItem | null> {
    // Use three-call API instead of legacy JSON
    return this.convertThreeCallToLegacy().pipe(
      map((items) => items.find((i) => i.id === itemId) || null),
      delay(30),
    );
  }

  getQueryById(itemId: string, queryId: string): Observable<Query | null> {
    // Use three-call API instead of legacy JSON
    return this.convertThreeCallToLegacy().pipe(
      map((items) => {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          return item.queries.find((q) => q.id === queryId) || null;
        }
        return null;
      }),
      delay(30),
    );
  }

  searchItems(
    searchTerm: string,
    domainId?: string,
  ): Observable<SelectionItem[]> {
    // Use three-call API with domain filtering and full metadata loading
    if (this.USE_THREE_CALL_API) {
      return this.searchForms(searchTerm).pipe(
        map((forms) => {
          // Filter by domain if provided
          if (domainId && this.DOMAIN_CATEGORY_MAP[domainId]) {
            const allowedCategories = this.DOMAIN_CATEGORY_MAP[domainId];
            return forms.filter((form) =>
              allowedCategories.includes(form.category),
            );
          }
          return forms;
        }),
        switchMap((filteredForms) => {
          if (filteredForms.length === 0) {
            return of([]);
          }

          // Load metadata with queries for each form (same as convertThreeCallToLegacy)
          const metadataRequests = filteredForms.map((summary) =>
            this.getFormMetadata(summary.id).pipe(
              map((metadata) => {
                if (!metadata) {
                  // Fallback if metadata not found
                  return {
                    id: summary.id,
                    type: summary.type || "Form",
                    name: summary.name,
                    entityName: summary.entityName,
                    entityId: `entity-${summary.entityName.toLowerCase()}`,
                    description: summary.description || "",
                    queries: [] as Query[],
                  } as SelectionItem;
                }

                // Convert metadata queries to SelectionItem queries (same as convertThreeCallToLegacy)
                const queries: Query[] = metadata.queries.map((q) => ({
                  id: q.id,
                  name: q.name,
                  description: q.description || "",
                  estimatedCount: q.estimatedResults,
                  parameters: {
                    filters: [],
                  } as any,
                }));

                return {
                  id: metadata.id,
                  type: metadata.type || "Form",
                  name: metadata.name,
                  entityName: metadata.entityName,
                  entityId: metadata.entityId,
                  description: metadata.description,
                  queries,
                } as SelectionItem;
              }),
            ),
          );

          // Combine all metadata requests
          return combineLatest(metadataRequests);
        }),
      );
    } else {
      // Legacy fallback
      return this.searchForms(searchTerm).pipe(
        map((forms) => this.convertFormSummariesToSelectionItems(forms)),
      );
    }
  }

  filterByEntity(
    entityName: string,
    domainId?: string,
  ): Observable<SelectionItem[]> {
    return this.getFormSummaries().pipe(
      map((forms) => forms.filter((form) => form.entityName === entityName)),
      map((forms) => this.convertFormSummariesToSelectionItems(forms)),
      delay(50),
    );
  }

  getDomainById(domainId: string): Observable<DomainSchema | null> {
    // Load from domains.json
    return this.http
      .get<DomainSchema[]>("/assets/magic-selector-data/domains.json")
      .pipe(
        map((domains) => domains.find((d) => d.domainId === domainId) || null),
        catchError((error) => {
          console.error("❌ Failed to load domains.json:", error);
          return of(null);
        }),
        delay(30),
      );
  }

  getDomainSchemas(): Observable<DomainSchema[]> {
    // Load from domains.json
    return this.http
      .get<DomainSchema[]>("/assets/magic-selector-data/domains.json")
      .pipe(
        catchError((error) => {
          console.error("❌ CRITICAL: Failed to load domains.json:", error);
          console.error(
            "📁 Expected location: /assets/magic-selector-data/domains.json",
          );
          return of([]);
        }),
        delay(50),
      );
  }

  estimateRecordCount(query: Query): Observable<number> {
    const count = query.estimatedCount || 0;
    return of(count).pipe(delay(100));
  }

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

  private convertFormSummariesToSelectionItems(
    forms: FormSummary[],
  ): SelectionItem[] {
    return forms.map(
      (form): SelectionItem => ({
        id: form.id,
        type: form.type || "Form",
        name: form.name,
        entityName: form.entityName,
        entityId: `entity-${form.entityName.toLowerCase().replace(/\s+/g, "-")}`, // Generate entityId from entityName
        description: form.description || "",
        queries: [] as Query[], // Empty queries for summary conversion
      }),
    );
  }
}
