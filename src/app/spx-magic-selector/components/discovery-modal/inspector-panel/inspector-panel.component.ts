import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  TemplateRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbOffcanvas, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, GridOptions, ModuleRegistry } from "ag-grid-community";
import { RowGroupingPanelModule } from "ag-grid-enterprise";
import { ColumnsToolPanelModule } from "ag-grid-enterprise";
import { FiltersToolPanelModule } from "ag-grid-enterprise";
import { SetFilterModule } from "ag-grid-enterprise";
import { OffcanvasStackService } from "../../../services/offcanvas-stack.service";

// Register AG Grid modules for preview grid
ModuleRegistry.registerModules([
  RowGroupingPanelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
]);

import { OffcanvasBreadcrumbComponent } from "../../offcanvas-breadcrumb/offcanvas-breadcrumb.component";
import { FlatSelectionRow } from "../../../models/flat-selection-row.interface";
import { PreviewRecord } from "../../../models/three-call-api.interface";
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
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    OffcanvasBreadcrumbComponent,
  ],
  templateUrl: "./inspector-panel.component.html",
  styleUrls: ["./inspector-panel.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectorPanelComponent implements OnChanges {
  private offcanvasService = inject(NgbOffcanvas);
  private offcanvasStackService = inject(OffcanvasStackService);
  private modalService = inject(NgbModal);
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
  // AG Grid Configuration
  // ========================================

  /** Column definitions for preview grid */
  previewColumnDefs: ColDef[] = [];

  /** Grid options for preview data */
  previewGridOptions: GridOptions = {
    suppressCellFocus: true,
    suppressRowClickSelection: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    rowGroupPanelShow: "always",
    groupDisplayType: "multipleColumns",
    sideBar: {
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
          toolPanelParams: {
            suppressRowGroups: false,
            suppressValues: false,
            suppressPivots: true,
            suppressPivotMode: true,
          },
        },
        {
          id: "filters",
          labelDefault: "Filters",
          labelKey: "filters",
          iconKey: "filter",
          toolPanel: "agFiltersToolPanel",
        },
      ],
      defaultToolPanel: "",
    },
  };

  /** Default column definition */
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    autoHeight: true,
    wrapText: true,
    enableRowGroup: true,
  };

  /** Quick filter text for preview grid search */
  previewQuickFilterText = "";

  /** Preview grid API reference */
  private previewGridApi: any;

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

    // Update column definitions when preview data changes
    if (changes["previewData"] && this.previewData.length > 0) {
      this.generatePreviewColumns();
    }
  }

  /**
   * Generate AG Grid column definitions from preview data
   */
  private generatePreviewColumns(): void {
    if (this.previewData.length === 0) {
      this.previewColumnDefs = [];
      return;
    }

    const firstRecord = this.previewData[0];
    const keys = Object.keys(firstRecord);

    this.previewColumnDefs = keys.map((key) => ({
      field: key,
      headerName: key,
      filter: "agTextColumnFilter",
      valueFormatter: (params: any) => this.formatValue(params.value),
    }));
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
   * Handle preview grid ready event
   */
  onPreviewGridReady(params: any): void {
    this.previewGridApi = params.api;
  }

  /**
   * Handle quick filter change for preview grid
   */
  onPreviewQuickFilterChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.previewQuickFilterText = target.value;
    if (this.previewGridApi) {
      this.previewGridApi.setQuickFilter(this.previewQuickFilterText);
    }
  }

  /**
   * Clear preview quick filter
   */
  clearPreviewQuickFilter(): void {
    this.previewQuickFilterText = "";
    if (this.previewGridApi) {
      this.previewGridApi.setQuickFilter("");
    }
  }

  /**
   * Open query editor in full-screen modal
   */
  openQueryEditor(content: TemplateRef<any>): void {
    const { zIndex, backdropZIndex } =
      this.offcanvasStackService.getNextZIndexes();

    const modalRef = this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });

    // Set the z-index using the offcanvas stack service
    setTimeout(() => {
      const modalElements = document.querySelectorAll(".modal.show");
      const modalElement = modalElements[
        modalElements.length - 1
      ] as HTMLElement;

      // Find the corresponding backdrop
      const backdropElements = document.querySelectorAll(".modal-backdrop");
      const backdropElement = backdropElements[
        backdropElements.length - 1
      ] as HTMLElement;

      if (modalElement) {
        modalElement.style.zIndex = zIndex.toString();
      }

      if (backdropElement) {
        backdropElement.style.zIndex = backdropZIndex.toString();
      }
    }, 0);
  }

  /**
   * Open data preview in separate offcanvas
   */
  openDataPreview(content: TemplateRef<any>): void {
    const nextWidth = this.offcanvasStackService.getNextOffcanvasWidth();
    const { zIndex, backdropZIndex } =
      this.offcanvasStackService.getNextZIndexes();

    const offcanvasRef = this.offcanvasService.open(content, {
      position: "end",
      backdrop: true,
      scroll: true,
      panelClass: "offcanvas-dynamic-width",
    });

    // Set the dynamic width and z-index using CSS custom properties
    setTimeout(() => {
      const offcanvasElements = document.querySelectorAll(".offcanvas.show");
      const offcanvasElement = offcanvasElements[
        offcanvasElements.length - 1
      ] as HTMLElement;

      // Find the corresponding backdrop
      const backdropElements = document.querySelectorAll(".offcanvas-backdrop");
      const backdropElement = backdropElements[
        backdropElements.length - 1
      ] as HTMLElement;

      if (offcanvasElement) {
        offcanvasElement.style.setProperty("--bs-offcanvas-width", nextWidth);
        offcanvasElement.style.zIndex = zIndex.toString();
      }

      if (backdropElement) {
        backdropElement.style.zIndex = backdropZIndex.toString();
      }
    }, 0);

    // Register this offcanvas in the stack
    this.offcanvasStackService.registerOffcanvas("Data Preview", offcanvasRef);
  }

  /**
   * Get display keys for preview record
   */
  getPreviewRecordKeys(record: PreviewRecord): string[] {
    // three-call-api PreviewRecord has fields directly on the object
    return Object.keys(record || {});
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
