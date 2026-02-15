import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import * as d3 from "d3";
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
import { QuickFilterModule } from "ag-grid-community";
import { RowGroupingPanelModule } from "ag-grid-enterprise";
import { ColumnsToolPanelModule } from "ag-grid-enterprise";
import { FiltersToolPanelModule } from "ag-grid-enterprise";
import { SetFilterModule } from "ag-grid-enterprise";

// Register AG Grid modules
ModuleRegistry.registerModules([
  RowApiModule,
  ScrollApiModule,
  QuickFilterModule,
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
export class DiscoveryModalComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @ViewChild("graphContainer", { static: false })
  graphContainer?: ElementRef<HTMLDivElement>;

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
    pagination: true,
    paginationPageSize: 200,
    paginationPageSizeSelector: [50, 100, 200, 500],
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
    suppressDragLeaveHidesColumns: true,
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

  /** View mode: 'grid' or 'graph' */
  viewMode: "grid" | "graph" = "grid";

  /** D3 visualization settings */
  readonly circleRadius = 10;
  readonly linkStrokeWidth = 0.5;
  readonly nodeStrokeWidth = 2;
  readonly collisionRadiusMultiplier = 3.5; // Increased from 2.5 for more spacing
  readonly linkDistance = 120; // Distance between connected nodes
  readonly chargeStrength = -200; // Repulsion force (more negative = stronger repulsion)
  readonly xForceStrength = 0.8; // How strongly nodes stick to their column
  readonly yForceStrength = 0.03; // How strongly nodes center vertically (lower = more spread)
  readonly rowSpacing = 30; // Vertical spacing between rows in pixels
  private simulation: any;
  private needsRender = false;

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
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsRender && this.graphContainer && this.viewMode === "graph") {
      this.needsRender = false;
      setTimeout(() => this.renderGraph(), 0);
    }
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
      this.gridApi.setGridOption("quickFilterText", this.quickFilterText);
    }
    // Re-render graph if in graph mode
    if (this.viewMode === "graph") {
      this.renderGraph();
    }
  }

  /**
   * Clear quick filter
   */
  clearQuickFilter(): void {
    this.quickFilterText = "";
    if (this.gridApi) {
      this.gridApi.setGridOption("quickFilterText", "");
    }
    // Re-render graph if in graph mode
    if (this.viewMode === "graph") {
      this.renderGraph();
    }
    this.cdr.markForCheck();
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
   * Toggle between grid and graph view
   */
  toggleView(): void {
    this.viewMode = this.viewMode === "grid" ? "graph" : "grid";
    if (this.viewMode === "graph") {
      this.needsRender = true;
    }
    this.cdr.markForCheck();
  }

  /**
   * Get filtered row data based on quick filter text
   */
  getFilteredRowData(): FlatSelectionRow[] {
    if (!this.quickFilterText) {
      return this.rowData;
    }

    const filterText = this.quickFilterText.toLowerCase();
    return this.rowData.filter((row) => {
      return (
        row.sourceName.toLowerCase().includes(filterText) ||
        row.entityName.toLowerCase().includes(filterText) ||
        row.queryName.toLowerCase().includes(filterText) ||
        (row.queryRef.description || "").toLowerCase().includes(filterText) ||
        (row.estimatedRecords?.toString() || "").includes(filterText)
      );
    });
  }

  /**
   * Render D3 force-directed graph
   */
  renderGraph(): void {
    if (!this.graphContainer) return;

    const container = this.graphContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear existing SVG
    d3.select(container).select("svg").remove();

    // Get filtered data
    const filteredData = this.getFilteredRowData();

    // Build graph data from filtered rowData
    interface Node {
      id: string;
      name: string;
      type: "source" | "entity" | "query";
      x?: number;
      y?: number;
      fx?: number;
      fy?: number;
    }

    interface Link {
      source: string | Node;
      target: string | Node;
      strength: number;
    }

    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeMap = new Map<string, Node>();

    // Create nodes and links from filtered rowData
    filteredData.forEach((row) => {
      // Source node (form/document)
      const sourceId = `source-${row.sourceName}`;
      if (!nodeMap.has(sourceId)) {
        const sourceNode: Node = {
          id: sourceId,
          name: row.sourceName,
          type: "source",
        };
        nodes.push(sourceNode);
        nodeMap.set(sourceId, sourceNode);
      }

      // Entity node
      const entityId = `entity-${row.entityName}`;
      if (!nodeMap.has(entityId)) {
        const entityNode: Node = {
          id: entityId,
          name: row.entityName,
          type: "entity",
        };
        nodes.push(entityNode);
        nodeMap.set(entityId, entityNode);
      }

      // Query node
      const queryId = `query-${row.uniqueId}`;
      if (!nodeMap.has(queryId)) {
        const queryNode: Node = {
          id: queryId,
          name: row.queryName,
          type: "query",
        };
        nodes.push(queryNode);
        nodeMap.set(queryId, queryNode);
      }

      // Links: source -> entity -> query
      links.push({
        source: sourceId,
        target: entityId,
        strength: 0.5,
      });

      links.push({
        source: entityId,
        target: queryId,
        strength: 0.5,
      });
    });

    // Color scale for node types
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["source", "entity", "query"])
      .range(["#10b981", "#3b82f6", "#f59e0b"]);

    // Create SVG
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height] as any);

    const g = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom as any);

    // Apply column layout positioning with evenly spaced rows
    const types = ["source", "entity", "query"];
    const columnWidth = width / types.length;
    const topPadding = 40; // Top margin
    const bottomPadding = 40; // Bottom margin
    const availableHeight = height - topPadding - bottomPadding;

    // Group nodes by type to calculate even spacing
    const nodesByType = new Map<string, any[]>();
    types.forEach((type) => {
      nodesByType.set(
        type,
        nodes.filter((n) => n.type === type),
      );
    });

    // Find the smallest column to use as vertical reference
    const columnCounts = types.map(
      (type) => nodesByType.get(type)?.length || 0,
    );
    const minColumnCount = Math.min(...columnCounts);
    const minColumnHeight = (minColumnCount - 1) * this.rowSpacing;

    // Position each node with fixed x and y coordinates
    nodesByType.forEach((columnNodes, type) => {
      const typeIndex = types.indexOf(type);
      const xPos = (typeIndex + 0.5) * columnWidth;

      // Calculate vertical offset to center this column relative to the smallest column
      const currentColumnHeight = (columnNodes.length - 1) * this.rowSpacing;
      const verticalOffset = (minColumnHeight - currentColumnHeight) / 2;

      columnNodes.forEach((node: any, index: number) => {
        node.fx = xPos; // Fixed x position (column)
        node.fy = topPadding + verticalOffset + index * this.rowSpacing; // Fixed y position (row) with centering offset
      });
    });

    // Create force simulation
    this.simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance(this.linkDistance)
          .strength((d: any) => d.strength || 0.5),
      )
      .force("charge", d3.forceManyBody().strength(this.chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius(this.circleRadius * this.collisionRadiusMultiplier),
      )
      .force(
        "x",
        d3
          .forceX((d: any) => {
            const typeIndex = types.indexOf(d.type);
            return (typeIndex + 0.5) * columnWidth;
          })
          .strength(this.xForceStrength),
      );

    // Create links with curved paths
    const link = g
      .append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", this.linkStrokeWidth)
      .attr("fill", "none");

    // Create text nodes with alignment based on type
    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("font-size", 13)
      .attr("font-weight", "600")
      .attr("fill", (d: any) => colorScale(d.type))
      .attr("text-anchor", (d: any) => {
        if (d.type === "source") return "end"; // Right-aligned
        if (d.type === "query") return "start"; // Left-aligned
        return "middle"; // Center-aligned for entity
      })
      .attr("dominant-baseline", "middle")
      .attr("cursor", "pointer")
      .text((d: any) => d.name)
      .each(function (d: any) {
        // Store text width on node for edge-to-edge connector positioning
        const bbox = (this as SVGTextElement).getBBox();
        d.textWidth = bbox.width;
      })
      .call(
        d3
          .drag<any, any>()
          .on("start", (event, d: any) => {
            if (!event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) this.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any,
      );

    // Update positions on each tick
    this.simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        // Calculate edge-to-edge connection points
        let sourceX = d.source.x;
        let targetX = d.target.x;

        // Adjust based on text alignment and width
        // Source nodes (right-aligned): right edge is at x position
        if (d.source.type === "source") {
          sourceX = d.source.x; // Right edge
        }
        // Entity nodes (center-aligned): calculate left or right edge
        else if (d.source.type === "entity") {
          sourceX = d.source.x + (d.source.textWidth || 0) / 2; // Right edge
        }

        // Entity nodes (center-aligned): calculate left or right edge
        if (d.target.type === "entity") {
          targetX = d.target.x - (d.target.textWidth || 0) / 2; // Left edge
        }
        // Query nodes (left-aligned): left edge is at x position
        else if (d.target.type === "query") {
          targetX = d.target.x; // Left edge
        }

        const dx = targetX - sourceX;
        const curveOffset = Math.abs(dx) * 0.5;

        if (dx > 0) {
          return `M${sourceX},${d.source.y} C${sourceX + curveOffset},${d.source.y} ${targetX - curveOffset},${d.target.y} ${targetX},${d.target.y}`;
        } else {
          return `M${sourceX},${d.source.y} C${sourceX - curveOffset},${d.source.y} ${targetX + curveOffset},${d.target.y} ${targetX},${d.target.y}`;
        }
      });

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });
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
