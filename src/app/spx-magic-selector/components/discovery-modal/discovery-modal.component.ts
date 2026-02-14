import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  GridOptions,
  GridReadyEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  GetRowIdParams,
} from "ag-grid-community";
import { SelectionItem } from "../../models/selection-item.interface";
import { FlatSelectionRow } from "../../models/flat-selection-row.interface";
import { DomainSchema } from "../../models/domain-schema.interface";
import { PreviewRecord } from "../../models/preview-record.interface";
import { QueryParameters } from "../../models/query-parameters.interface";
import { SelectionDataService } from "../../services/selection-data.service";
import { QueryExecutorService } from "../../services/query-executor.service";
import {
  InspectorPanelComponent,
  PreviewRefreshEvent,
} from "./inspector-panel/inspector-panel.component";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

/**
 * Discovery Modal - Full-screen dialog for browsing all form-entity-query combinations
 * Uses ag-grid with radio-button selection for advanced lookup
 */
@Component({
  selector: "app-discovery-modal",
  standalone: true,
  imports: [CommonModule, AgGridAngular, InspectorPanelComponent],
  templateUrl: "./discovery-modal.component.html",
  styleUrls: ["./discovery-modal.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoveryModalComponent implements OnInit, OnDestroy {
  // ========================================
  // Input Properties
  // ========================================

  /** Data passed to the modal */
  @Input() data!: DiscoveryModalDialogData;

  // ========================================
  // Grid Configuration
  // ========================================

  /** Grid row data (flattened selection rows) */
  rowData: FlatSelectionRow[] = [];

  /** Column definitions */
  columnDefs: ColDef[] = [
    {
      field: "sourceName",
      headerName: "Form/Document",
      width: 200,
      sortable: true,
      filter: true,
    },
    {
      field: "entityName",
      headerName: "Entity",
      width: 150,
      sortable: true,
      filter: true,
    },
    {
      field: "queryName",
      headerName: "Query",
      width: 200,
      sortable: true,
      filter: true,
    },
    {
      field: "queryDescription",
      headerName: "Description",
      flex: 1,
      sortable: false,
      filter: false,
    },
    {
      field: "estimatedRecords",
      headerName: "Records",
      width: 120,
      sortable: true,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) {
          return "0";
        }
        return params.value.toLocaleString();
      },
    },
  ];

  /** Default column configuration */
  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  /** ag-Grid options */
  gridOptions: GridOptions = {
    animateRows: true,
    rowSelection: "single",
    suppressRowClickSelection: false,
    suppressCellFocus: true,
    headerHeight: 48,
    rowHeight: 48,
  };

  /** Currently selected row */
  selectedRow: FlatSelectionRow | null = null;

  // ========================================
  // Inspector Panel State
  // ========================================

  /** Preview data for inspector panel */
  previewData: PreviewRecord[] = [];

  /** Query parameters for inspector panel */
  queryParameters: QueryParameters | null = null;

  /** Loading state for preview data */
  previewLoading = false;

  /** Error message for preview data */
  previewError?: string;

  /** Destroy subject for cleanup */
  private destroy$ = new Subject<void>();

  // ========================================
  // Constructor
  // ========================================

  constructor(
    public activeModal: NgbActiveModal,
    private selectionDataService: SelectionDataService,
    private queryExecutorService: QueryExecutorService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ========================================
  // Lifecycle Hooks
  // ========================================

  ngOnInit(): void {
    // Flatten available items into grid rows
    this.rowData = this.selectionDataService.flattenToGridRows(
      this.data.availableItems,
    );

    // Pre-select current selection if provided
    if (this.data.currentSelection) {
      const currentRow = this.rowData.find(
        (row) => row.originalItem.id === this.data.currentSelection?.id,
      );
      if (currentRow) {
        this.selectedRow = currentRow;
        currentRow.isSelected = true;
        // Load preview data for current selection
        this.loadPreviewData(currentRow);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // Grid Event Handlers
  // ========================================

  /**
   * Handle grid ready event
   */
  onGridReady(params: GridReadyEvent): void {
    // Auto-size all columns except description
    const allColumnIds =
      params.api
        .getColumns()
        ?.filter((col) => col.getColId() !== "queryDescription")
        .map((col) => col.getColId()) || [];

    params.api.autoSizeColumns(allColumnIds);

    // Select the pre-selected row if any
    if (this.selectedRow) {
      const rowNode = params.api.getRowNode(this.selectedRow.uniqueId);
      if (rowNode) {
        rowNode.setSelected(true);
        params.api.ensureNodeVisible(rowNode);
      }
    }
  }

  /**
   * Handle row click event
   */
  onRowClicked(event: RowClickedEvent): void {
    if (event.data) {
      const row = event.data as FlatSelectionRow;
      this.selectedRow = row;
      this.loadPreviewData(row);
    }
  }

  /**
   * Handle row double-click event (confirm selection)
   */
  onRowDoubleClicked(event: RowDoubleClickedEvent): void {
    if (event.data) {
      this.selectedRow = event.data as FlatSelectionRow;
      this.confirmSelection();
    }
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * Load preview data for the selected row
   */
  loadPreviewData(row: FlatSelectionRow): void {
    this.previewLoading = true;
    this.previewError = undefined;
    this.queryParameters = row.queryRef.parameters;
    this.cdr.markForCheck();

    this.queryExecutorService
      .getPreviewData(row.queryRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.previewData = data;
          this.previewLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.previewError = error.message || "Failed to load preview data";
          this.previewLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Handle preview refresh request from inspector panel
   */
  onPreviewRefresh(event: PreviewRefreshEvent): void {
    if (this.selectedRow) {
      this.loadPreviewData(this.selectedRow);
    }
  }

  /**
   * Confirm the selected row and close modal
   */
  confirmSelection(): void {
    if (this.selectedRow) {
      this.activeModal.close({
        selectedRow: this.selectedRow,
        confirmed: true,
      });
    }
  }

  /**
   * Cancel selection and close modal
   */
  cancel(): void {
    this.activeModal.dismiss();
  }

  /**
   * Get row node ID for ag-grid
   */
  getRowId = (params: GetRowIdParams<FlatSelectionRow>) => params.data.uniqueId;
}

/**
 * Data passed to the dialog
 */
export interface DiscoveryModalDialogData {
  availableItems: SelectionItem[];
  currentSelection?: SelectionItem;
  domainSchema: DomainSchema;
  modalTitle?: string;
}

/**
 * Result returned from the dialog
 */
export interface DiscoveryModalResult {
  selectedRow?: FlatSelectionRow;
  confirmed: boolean;
}
