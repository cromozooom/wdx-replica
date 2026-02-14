import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FlatSelectionRow } from "../../../models/flat-selection-row.interface";
import { PreviewRecord } from "../../../models/preview-record.interface";
import { QueryParameters } from "../../../models/query-parameters.interface";

/**
 * Event emitted when preview data needs to be refreshed
 */
export interface PreviewRefreshEvent {
  queryId: string;
  refreshType: "manual" | "automatic";
  timestamp: Date;
}

/**
 * Event emitted when query parameters are changed
 */
export interface ParameterChangeEvent {
  parameter: string;
  oldValue: any;
  newValue: any;
  queryId: string;
}

/**
 * InspectorPanel - Dumb component displaying query parameters and data preview
 * Shows human-readable query details and first 5 sample records for validation
 */
@Component({
  selector: "app-inspector-panel",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./inspector-panel.component.html",
  styleUrls: ["./inspector-panel.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorPanelComponent implements OnChanges {
  // ========================================
  // Input Properties
  // ========================================

  /** Currently inspected row from the grid */
  @Input() inspectedRow: FlatSelectionRow | null = null;

  /** Preview data records (first 5) */
  @Input() previewData: PreviewRecord[] = [];

  /** Query parameters in structured format */
  @Input() queryParameters: QueryParameters | null = null;

  /** Loading state for async operations */
  @Input() loading = false;

  /** Error message if data fetch fails */
  @Input() error?: string;

  // ========================================
  // Output Events
  // ========================================

  /** Emitted when user requests preview refresh */
  @Output() previewRefresh = new EventEmitter<PreviewRefreshEvent>();

  /** Emitted when parameter values change */
  @Output() parameterChange = new EventEmitter<ParameterChangeEvent>();

  // ========================================
  // Lifecycle Hooks
  // ========================================

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["inspectedRow"] && this.inspectedRow) {
      // Automatically emit refresh event when inspected row changes
      this.previewRefresh.emit({
        queryId: this.inspectedRow.queryRef.id,
        refreshType: "automatic",
        timestamp: new Date(),
      });
    }
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * Manually refresh preview data
   */
  refreshPreview(): void {
    if (this.inspectedRow) {
      this.previewRefresh.emit({
        queryId: this.inspectedRow.queryRef.id,
        refreshType: "manual",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Clear current inspection
   */
  clearInspection(): void {
    this.inspectedRow = null;
    this.previewData = [];
    this.queryParameters = null;
  }

  /**
   * Get display keys for preview record
   */
  getPreviewRecordKeys(record: PreviewRecord): string[] {
    return Object.keys(record.displayData || {});
  }

  /**
   * Format value for display
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "-";
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Get formatted record count message
   */
  getRecordCountMessage(): string {
    if (!this.inspectedRow) {
      return "";
    }

    const count = this.inspectedRow.estimatedRecords;

    if (count === 0) {
      return "No records match this query";
    }

    if (count > 10000) {
      return `Showing ${this.previewData.length} of ${count.toLocaleString()}+ records`;
    }

    if (count > this.previewData.length) {
      return `Showing ${this.previewData.length} of ${count.toLocaleString()} records`;
    }

    return `${count.toLocaleString()} record${count === 1 ? "" : "s"}`;
  }
}
