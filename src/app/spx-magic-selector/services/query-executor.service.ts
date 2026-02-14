import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, delay, throwError, catchError, map } from "rxjs";
import { Query } from "../models/query.interface";
import {
  PreviewDataResponse,
  PreviewRecord,
} from "../models/three-call-api.interface";
import { FlatSelectionRow } from "../models/flat-selection-row.interface";
import { SelectionDataService } from "./selection-data.service";

/**
 * Service for executing queries and calculating record counts
 * Simulates query execution with mock data
 */
@Injectable({
  providedIn: "root",
})
export class QueryExecutorService {
  private http = inject(HttpClient);
  private selectionDataService = inject(SelectionDataService);
  /**
   * Get record count for a query
   * Returns exact count for <1000 records, approximate (±10%) for larger datasets
   * @param query Query to execute
   * @returns Observable of record count
   */
  getRecordCount(query: Query): Observable<number> {
    const estimatedCount = query.estimatedCount || 0;

    // Simulate network latency (100-200ms)
    const latency = Math.random() * 100 + 100;

    // For counts < 1000, return exact count
    // For counts >= 1000, return approximate count (±10%)
    if (estimatedCount < 1000) {
      return of(estimatedCount).pipe(delay(latency));
    } else {
      // Add random variance of ±10%
      const variance = estimatedCount * 0.1;
      const randomOffset = (Math.random() * 2 - 1) * variance; // Random value between -variance and +variance
      const approximateCount = Math.round(estimatedCount + randomOffset);
      return of(approximateCount).pipe(delay(latency));
    }
  }

  /**
   * Get preview data for a query (first 5 records)
   * Loads from API using entityId and queryId
   * @param row FlatSelectionRow containing query and entity info
   * @returns Observable of preview records
   */
  getPreviewData(row: FlatSelectionRow): Observable<PreviewRecord[]> {
    const entityId = row.originalItem.entityId;
    const queryId = row.queryRef.id;

    console.log(
      `🔍 [QueryExecutor] Loading preview data for ${entityId} / ${queryId}`,
    );

    return this.selectionDataService.getPreviewData(entityId, queryId).pipe(
      map((response) => {
        if (!response || !response.records) {
          console.warn(
            `⚠️ [QueryExecutor] No preview data for ${entityId} / ${queryId}`,
          );
          return [];
        }
        console.log(
          `✅ [QueryExecutor] Loaded ${response.records.length} preview records`,
        );
        return response.records;
      }),
      catchError((error) => {
        console.error(`❌ [QueryExecutor] Failed to load preview data:`, error);
        return of([]);
      }),
    );
  }

  /**
   * Execute a query and return full results (simulated)
   * @param query Query to execute
   * @returns Observable of execution result
   */
  executeQuery(query: Query): Observable<QueryExecutionResult> {
    const estimatedCount = query.estimatedCount || 0;
    const latency = Math.random() * 200 + 200;

    const result: QueryExecutionResult = {
      success: true,
      records: query.previewData || [],
      totalCount: estimatedCount,
      executionTime: latency,
      query,
      metadata: {
        queryId: query.id,
        timestamp: new Date(),
        cached: false,
      },
    };

    return of(result).pipe(delay(latency));
  }

  /**
   * Simulate network failure for testing error handling
   * @param shouldFail Whether to simulate failure
   * @returns Observable that either succeeds or fails
   */
  getRecordCountWithFailure(
    query: Query,
    shouldFail: boolean = false,
  ): Observable<number> {
    if (shouldFail) {
      return throwError(() => new Error("Network request failed")).pipe(
        delay(100),
      );
    }
    return this.getRecordCount(query);
  }
}

/**
 * Result of query execution
 */
export interface QueryExecutionResult {
  success: boolean;
  records: any[];
  totalCount: number;
  executionTime: number;
  query: Query;
  metadata: ExecutionMetadata;
}

/**
 * Execution metadata
 */
export interface ExecutionMetadata {
  queryId: string;
  timestamp: Date;
  cached: boolean;
}
