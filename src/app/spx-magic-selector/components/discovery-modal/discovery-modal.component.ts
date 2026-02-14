import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  GridOptions,
  GridReadyEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  GetRowIdParams,
  ModuleRegistry,
} from "ag-grid-community";
import { RowApiModule } from "ag-grid-community";
import { ScrollApiModule } from "ag-grid-community";
import { RowGroupingPanelModule } from "ag-grid-enterprise";
import { ColumnsToolPanelModule } from "ag-grid-enterprise";
import { FiltersToolPanelModule } from "ag-grid-enterprise";
import { SetFilterModule } from "ag-grid-enterprise";

// Register AG Grid modules
ModuleRegistry.registerModules([
  RowApiModule,
  ScrollApiModule,
  RowGroupingPanelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
]);
import { SelectionItem } from "../../models/selection-item.interface";
import { FlatSelectionRow } from "../../models/flat-selection-row.interface";
import { DomainSchema } from "../../models/domain-schema.interface";
import { PreviewRecord } from "../../models/three-call-api.interface";
import { QueryParameters } from "../../models/query-parameters.interface";
import { SelectionDataService } from "../../services/selection-data.service";
import { QueryExecutorService } from "../../services/query-executor.service";
import {
  InspectorPanelComponent,
  PreviewRefreshEvent,
} from "./inspector-panel/inspector-panel.component";
import { OffcanvasBreadcrumbComponent } from "../offcanvas-breadcrumb/offcanvas-breadcrumb.component";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { getDomainTypeLabel } from "../../models/domain-types.constants";

/**
 * Discovery Offcanvas - Full-screen panel for browsing all form-entity-query combinations
 * Uses ag-grid with radio-button selection for advanced lookup
 */
@Component({
  selector: "app-discovery-modal",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    InspectorPanelComponent,
    OffcanvasBreadcrumbComponent,
  ],
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
      headerName: "Source",
      width: 200,
      sortable: true,
      filter: "agTextColumnFilter",
      enableRowGroup: true,
      rowGroup: false,
    },
    {
      field: "entityName",
      headerName: "Entity",
      width: 150,
      sortable: true,
      filter: "agTextColumnFilter",
      enableRowGroup: true,
      rowGroup: false,
    },
    {
      field: "queryName",
      headerName: "Query",
      width: 200,
      sortable: true,
      filter: "agTextColumnFilter",
      enableRowGroup: true,
    },
    {
      field: "queryDescription",
      headerName: "Description",
      flex: 1,
      sortable: false,
      filter: "agTextColumnFilter",
    },
    {
      field: "estimatedRecords",
      headerName: "Records",
      width: 120,
      sortable: true,
      filter: "agNumberColumnFilter",
      enableValue: true,
      aggFunc: "sum",
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
    floatingFilter: true,
  };

  /** ag-Grid options */
  gridOptions: GridOptions = {
    animateRows: true,
    rowSelection: {
      mode: "singleRow",
      enableClickSelection: true,
      isRowSelectable: (node) => {
        // Only allow selection of leaf nodes (actual data rows), not group rows
        return !node.group;
      },
    },
    suppressCellFocus: true,
    headerHeight: 48,
    rowHeight: 48,
    rowGroupPanelShow: "always",
    groupDisplayType: "multipleColumns",
    suppressRowClickSelection: false, // Allow row click selection
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

  /** Currently selected row */
  selectedRow: FlatSelectionRow | null = null;

  /** Grid API reference */
  private gridApi: any;

  /** Quick filter text for grid search */
  quickFilterText = "";

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
    public activeOffcanvas: NgbActiveOffcanvas,
    private selectionDataService: SelectionDataService,
    private queryExecutorService: QueryExecutorService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ========================================
  // Lifecycle Hooks
  // ========================================

  ngOnInit(): void {
    console.log(
      `🔍 [Discovery Modal] Initializing with domain: "${this.data.domainSchema?.domainId}"`,
    );
    console.log(
      `📤 [Discovery Modal] Received ${this.data.availableItems.length} rows from selector`,
    );
    console.log(
      `🏷️ [Discovery Modal] Item names:`,
      this.data.availableItems.map(
        (row) =>
          `${row.sourceName} (${row.originalItem.type}) - ${row.queryName}`,
      ),
    );

    // Set dynamic column header based on domain type
    const domainTypeLabel = getDomainTypeLabel(
      this.data.domainSchema?.domainId || "",
    );
    this.columnDefs[0].headerName = domainTypeLabel;

    // Data is already flattened, use it directly
    this.rowData = this.data.availableItems;

    console.log(
      `📊 [Discovery Modal] Using ${this.rowData.length} grid rows (already flattened)`,
    );
    console.log(`🔢 [Discovery Modal] Breakdown:`, {
      uniqueForms: new Set(this.rowData.map((r) => r.originalItem.id)).size,
      totalRows: this.rowData.length,
      avgQueriesPerForm: (
        this.rowData.length /
        new Set(this.rowData.map((r) => r.originalItem.id)).size
      ).toFixed(1),
    });

    // Pre-select current selection if provided
    if (this.data.currentSelection) {
      console.log(
        `🔍 [Discovery Modal] Looking for current selection:`,
        this.data.currentSelection.uniqueId,
      );
      const currentRow = this.rowData.find(
        (row) => row.uniqueId === this.data.currentSelection?.uniqueId,
      );
      if (currentRow) {
        console.log(
          `✅ [Discovery Modal] Found current selection, pre-selecting row`,
        );
        this.selectedRow = currentRow;
        currentRow.isSelected = true;
        // Load preview data for current selection
        this.loadPreviewData(currentRow);
      } else {
        console.warn(
          `⚠️ [Discovery Modal] Current selection not found in rowData`,
        );
        console.log(
          `Available uniqueIds:`,
          this.rowData.map((r) => r.uniqueId).slice(0, 5),
        );
      }
    } else {
      console.log(`ℹ️ [Discovery Modal] No current selection provided`);
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
   * Handle quick filter change
   */
  onQuickFilterChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.quickFilterText = target.value;
    if (this.gridApi) {
      this.gridApi.setQuickFilter(this.quickFilterText);
    }
  }

  /**
   * Clear quick filter
   */
  clearQuickFilter(): void {
    this.quickFilterText = "";
    if (this.gridApi) {
      this.gridApi.setQuickFilter("");
    }
  }

  /**
   * Handle grid ready event
   */
  onGridReady(params: GridReadyEvent): void {
    // Store grid API reference
    this.gridApi = params.api;

    // Auto-size all columns except description
    const allColumnIds =
      params.api
        .getColumns()
        ?.filter((col) => col.getColId() !== "queryDescription")
        .map((col) => col.getColId()) || [];

    params.api.autoSizeColumns(allColumnIds);

    // Select the pre-selected row if any
    if (this.selectedRow) {
      console.log(
        `🎯 [Discovery Modal] Attempting to select row:`,
        this.selectedRow.uniqueId,
      );

      // Use setTimeout to ensure grid is fully rendered
      setTimeout(() => {
        let foundNode = false;
        // Use index-based iteration instead of forEachNode (doesn't require RowApiModule)
        const rowCount = params.api.getDisplayedRowCount();
        console.log(`🔍 [Discovery Modal] Checking ${rowCount} displayed rows`);

        for (let i = 0; i < rowCount; i++) {
          const node = params.api.getDisplayedRowAtIndex(i);
          if (
            node &&
            node.data &&
            node.data.uniqueId === this.selectedRow!.uniqueId
          ) {
            console.log(
              `✅ [Discovery Modal] Row node found at index ${i}, selecting...`,
            );
            console.log(`   Node selected before: ${node.isSelected()}`);
            node.setSelected(true, false); // Set true, don't clear other selections
            console.log(`   Node selected after: ${node.isSelected()}`);
            params.api.ensureNodeVisible(node, "middle");
            foundNode = true;
            break;
          }
        }

        if (!foundNode) {
          console.warn(
            `⚠️ [Discovery Modal] Row node not found:`,
            this.selectedRow!.uniqueId,
          );
          console.log(
            `Available row IDs:`,
            this.rowData.map((r) => r.uniqueId).slice(0, 5),
          );
        } else {
          // Log selected rows count
          const selectedRows = params.api.getSelectedRows();
          console.log(
            `📊 [Discovery Modal] Selected rows count: ${selectedRows.length}`,
          );
        }
        this.cdr.markForCheck();
      }, 100);
    }
  }

  /**
   * Handle row click event
   */
  onRowClicked(event: RowClickedEvent): void {
    // Ignore clicks on group rows
    if (event.node.group) {
      return;
    }

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
    // Ignore double-clicks on group rows
    if (event.node.group) {
      return;
    }

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
      .getPreviewData(row)
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
      this.activeOffcanvas.close({
        selectedRow: this.selectedRow,
        confirmed: true,
      });
    }
  }

  /**
   * Cancel selection and close offcanvas
   */
  cancel(): void {
    this.activeOffcanvas.dismiss();
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
  availableItems: FlatSelectionRow[];
  currentSelection?: FlatSelectionRow;
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
