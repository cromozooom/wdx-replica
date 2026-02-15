import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbOffcanvas, NgbDropdownModule } from "@ng-bootstrap/ng-bootstrap";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  GridOptions,
  GridReadyEvent,
  GetRowIdParams,
} from "ag-grid-community";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SpxMagicSelectorComponent } from "./components/spx-magic-selector.component";
import { SpxToolsComponent } from "./components/spx-tools/spx-tools.component";
import { AddSelectionModalComponent } from "./components/add-selection-modal/add-selection-modal.component";
import { SelectionChangeEvent } from "./models/selection-change-event.interface";
import { SavedSelection } from "./models/saved-selection.interface";
import { OffcanvasStackService } from "./services/offcanvas-stack.service";
import { SelectionHistoryService } from "./services/selection-history.service";

/**
 * Demo page for testing SPX Magic Selector component
 * Shows selection history in ag-grid with IndexedDB persistence
 */
@Component({
  selector: "app-spx-magic-selector-demo",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SpxMagicSelectorComponent,
    SpxToolsComponent,
    AgGridAngular,
    NgbDropdownModule,
  ],
  templateUrl: "./spx-magic-selector-demo.component.html",
  styleUrls: ["./spx-magic-selector-demo.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpxMagicSelectorDemoComponent implements OnInit, OnDestroy {
  // Grid configuration
  rowData: SavedSelection[] = [];
  columnDefs: ColDef[] = [
    {
      field: "name",
      headerName: "Bulk Name",
      width: 250,
      sortable: true,
      filter: true,
      pinned: "left",
    },
    {
      field: "domainName",
      headerName: "Domain",
      width: 180,
      sortable: true,
      filter: true,
    },
    {
      field: "itemName",
      headerName: "Form/Document",
      width: 200,
      sortable: true,
      filter: true,
    },
    {
      field: "itemType",
      headerName: "Type",
      width: 120,
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
      width: 180,
      sortable: true,
      filter: true,
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
    {
      field: "createdAt",
      headerName: "Created",
      width: 180,
      sortable: true,
      filter: "agDateColumnFilter",
      valueFormatter: (params) => {
        if (!params.value) return "";
        return new Date(params.value).toLocaleString();
      },
    },
    {
      headerName: "Actions",
      width: 120,
      pinned: "right",
      cellRenderer: (params: any) => {
        return `
          <button class="btn btn-link text-decoration-none" data-id="${params.data.id}">
            <i class="fas fa-trash"></i>
          </button>
        `;
      },
    },
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  gridOptions: GridOptions = {
    animateRows: true,
    rowSelection: {
      mode: "singleRow",
      enableClickSelection: false,
    },
    suppressCellFocus: true,
    headerHeight: 48,
    rowHeight: 48,
    onCellClicked: (event) => {
      if (event.event?.target) {
        const target = event.event.target as HTMLElement;
        if (
          target.classList.contains("delete-btn") ||
          target.closest(".delete-btn")
        ) {
          const button = target.closest(".delete-btn") as HTMLElement;
          const id = button?.getAttribute("data-id");
          if (id) {
            this.deleteSelection(id);
          }
        }
      }
    },
  };

  private destroy$ = new Subject<void>();
  currentTheme: "light" | "dark" | "system" = "system";
  agGridThemeClass = "ag-theme-alpine"; // Always use alpine, mode controlled by data-ag-theme-mode

  constructor(
    private selectionHistoryService: SelectionHistoryService,
    private offcanvasService: NgbOffcanvas,
    private offcanvasStackService: OffcanvasStackService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Initialize theme before subscribing to data
    this.initializeTheme();

    // Subscribe to selection history updates
    this.selectionHistoryService
      .getSelections()
      .pipe(takeUntil(this.destroy$))
      .subscribe((selections: SavedSelection[]) => {
        this.rowData = selections;
        this.cdr.markForCheck();
      });

    // Listen for system theme changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
      darkModeQuery.addEventListener("change", () => {
        if (this.currentTheme === "system") {
          this.applyTheme("system");
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Open offcanvas to add new selection
   */
  openAddSelectionModal(): void {
    const nextWidth = this.offcanvasStackService.getNextOffcanvasWidth();
    const currentLevel = this.offcanvasStackService.getStackDepth();
    const { zIndex, backdropZIndex } =
      this.offcanvasStackService.getNextZIndexes();
    const offcanvasRef = this.offcanvasService.open(
      AddSelectionModalComponent,
      {
        position: "end",
        backdrop: "static",
        scroll: true,
        panelClass: "offcanvas-dynamic-width",
      },
    );

    // Set the dynamic width and z-index using CSS custom properties
    setTimeout(() => {
      // Find the most recently opened offcanvas (the one with the highest z-index)
      const offcanvasElements = Array.from(
        document.querySelectorAll(".offcanvas.show"),
      );
      const latestOffcanvas = offcanvasElements[
        offcanvasElements.length - 1
      ] as HTMLElement;

      // Find the corresponding backdrop
      const backdropElements = Array.from(
        document.querySelectorAll(".offcanvas-backdrop"),
      );
      const latestBackdrop = backdropElements[
        backdropElements.length - 1
      ] as HTMLElement;

      if (latestOffcanvas) {
        latestOffcanvas.style.setProperty("--bs-offcanvas-width", nextWidth);
        latestOffcanvas.style.width = nextWidth;
        latestOffcanvas.style.zIndex = zIndex.toString();

        // For stacked offcanvas (not the first one), reduce height and align to bottom
        if (currentLevel > 0) {
          const heightReduction = currentLevel * 3; // 3rem per level
          latestOffcanvas.style.height = `calc(100% - ${heightReduction}rem)`;
          latestOffcanvas.style.marginTop = "auto";
        }
      }

      if (latestBackdrop) {
        latestBackdrop.style.zIndex = backdropZIndex.toString();
      }
    }, 0);

    // Register with stack service
    this.offcanvasStackService.registerOffcanvas(
      "Add New Bulk Edit",
      offcanvasRef,
    );

    offcanvasRef.result
      .then((selection: SavedSelection) => {
        if (selection) {
          this.selectionHistoryService
            .addSelection(selection)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                // Selection added successfully
              },
              error: (error: any) => {
                console.error("Failed to save selection:", error);
                window.alert("Failed to save selection. Please try again.");
              },
            });
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  /**
   * Delete a selection
   */
  deleteSelection(id: string): void {
    if (window.confirm("Are you sure you want to delete this selection?")) {
      this.selectionHistoryService
        .deleteSelection(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Selection deleted successfully
          },
          error: (error: any) => {
            console.error("Failed to delete selection:", error);
            window.alert("Failed to delete selection. Please try again.");
          },
        });
    }
  }

  /**
   * Clear all selections
   */
  clearAllSelections(): void {
    if (
      confirm(
        "Are you sure you want to delete ALL selections? This cannot be undone.",
      )
    ) {
      this.selectionHistoryService
        .clearAll()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // All selections cleared
          },
          error: (error: any) => {
            console.error("Failed to clear selections:", error);
            alert("Failed to clear selections. Please try again.");
          },
        });
    }
  }

  /**
   * Grid ready event
   */
  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }

  /**
   * Get row ID for ag-grid
   */
  getRowId = (params: GetRowIdParams<SavedSelection>) => params.data.id;

  /**
   * Get count of CRM selections
   */
  get crmCount(): number {
    return this.rowData.filter((r) => r.domainId === "crm-scheduling").length;
  }

  /**
   * Get count of Document Management selections
   */
  get documentCount(): number {
    return this.rowData.filter((r) => r.domainId === "document-management")
      .length;
  }

  /**
   * Initialize theme on component load
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem("bootstrap-theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    this.currentTheme = savedTheme || "system";
    this.applyTheme(this.currentTheme);
  }

  /**
   * Handle theme change from dropdown
   */
  onThemeChange(event: Event): void {
    // currentTheme is already updated by [(ngModel)]
    localStorage.setItem("bootstrap-theme", this.currentTheme);
    this.applyTheme(this.currentTheme);
  }

  /**
   * Apply the selected theme to the document
   */
  private applyTheme(theme: "light" | "dark" | "system"): void {
    const htmlElement = document.documentElement;
    let isDark = false;

    if (theme === "system") {
      // Use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      isDark = prefersDark;
      htmlElement.setAttribute("data-bs-theme", prefersDark ? "dark" : "light");
    } else {
      isDark = theme === "dark";
      htmlElement.setAttribute("data-bs-theme", theme);
    }

    // Update AG-Grid theme mode using data-ag-theme-mode attribute
    const themeMode = isDark ? "dark" : "light";
    htmlElement.setAttribute("data-ag-theme-mode", themeMode);
  }
}
