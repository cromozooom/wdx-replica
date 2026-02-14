import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { SelectionItem } from "../../models/selection-item.interface";
import { Query } from "../../models/query.interface";
import { QueryExecutorService } from "../../services/query-executor.service";
import { catchError, of } from "rxjs";

/**
 * Preview Container - Dumb component displaying selection context
 * Shows entity mapping, query description, and live record count
 */
@Component({
  selector: "app-preview-container",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./preview-container.component.html",
  styleUrls: ["./preview-container.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewContainerComponent implements OnChanges {
  // ========================================
  // Input Properties
  // ========================================

  /** Currently selected item */
  @Input() selectedItem: SelectionItem | null = null;

  /** Currently selected query */
  @Input() selectedQuery: Query | null = null;

  /** Loading state */
  @Input() loading = false;

  /** Error message */
  @Input() error?: string;

  /** Whether to show record count badge */
  @Input() showRecordCount = true;

  // ========================================
  // Output Events
  // ========================================

  /** Emits when refresh is requested */
  @Output() refreshRequest = new EventEmitter<RefreshRequestEvent>();

  /** Emits when details are requested */
  @Output() detailsRequest = new EventEmitter<DetailsRequestEvent>();

  // ========================================
  // Component State
  // ========================================

  /** Calculated record count */
  recordCount: number | null = null;

  /** Loading indicator for record count */
  loadingCount = false;

  /** Network error flag */
  networkError = false;

  /** Cached count (used when network fails) */
  cachedCount: number | null = null;

  // ========================================
  // Constructor
  // ========================================

  constructor(
    private queryExecutorService: QueryExecutorService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ========================================
  // Lifecycle Hooks
  // ========================================

  ngOnChanges(changes: SimpleChanges): void {
    // Reload count when selection changes
    if (changes["selectedQuery"] && this.selectedQuery) {
      this.loadRecordCount();
    }

    // Clear preview when selection is cleared
    if (changes["selectedQuery"] && !this.selectedQuery) {
      this.recordCount = null;
      this.cachedCount = null;
      this.networkError = false;
    }
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * Refresh preview data
   */
  refreshPreview(): void {
    if (this.selectedItem && this.selectedQuery) {
      this.refreshRequest.emit({
        itemId: this.selectedItem.id,
        queryId: this.selectedQuery.id,
        timestamp: new Date(),
      });

      // Reload count
      this.loadRecordCount();
    }
  }

  /**
   * Retry loading record count after network failure
   */
  retryLoadCount(): void {
    this.networkError = false;
    this.loadRecordCount();
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Load record count from service
   */
  private loadRecordCount(): void {
    if (!this.selectedQuery) {
      return;
    }

    this.loadingCount = true;
    this.networkError = false;
    this.cdr.markForCheck();

    this.queryExecutorService
      .getRecordCount(this.selectedQuery)
      .pipe(
        catchError((error) => {
          // Network error - use cached or estimated count
          this.networkError = true;
          this.loadingCount = false;

          // Return cached count or estimated count
          const fallbackCount =
            this.cachedCount || this.selectedQuery?.estimatedCount || 0;
          this.recordCount = fallbackCount;
          this.cdr.markForCheck();

          return of(fallbackCount);
        }),
      )
      .subscribe((count) => {
        this.recordCount = count;
        this.cachedCount = count; // Cache for future failures
        this.loadingCount = false;
        this.networkError = false;
        this.cdr.markForCheck();
      });
  }
}

/**
 * Event emitted when refresh is requested
 */
export interface RefreshRequestEvent {
  itemId: string;
  queryId: string;
  timestamp: Date;
}

/**
 * Event emitted when details are requested
 */
export interface DetailsRequestEvent {
  itemId: string;
  queryId: string;
  requestedDetails: string[];
}
