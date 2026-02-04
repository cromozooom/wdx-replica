import { Component, EventEmitter, Output, inject, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  GridOptions,
  GridReadyEvent,
  RowDoubleClickedEvent,
  ModuleRegistry,
} from "ag-grid-community";
import {
  CellStyleModule,
  ColumnApiModule,
  RowStyleModule,
  RowApiModule,
} from "ag-grid-community";
import { RowGroupingPanelModule } from "ag-grid-enterprise";
import { Configuration } from "../../models/configuration.model";
import { ConfigurationType } from "../../models/configuration-type.enum";
import { UpdateEntry } from "../../models/update-entry.model";
import { compareSemanticVersions } from "../../utils/semantic-version-comparator";
import { ConfigurationStore } from "../../store/configuration.store";

// Register AG Grid Enterprise modules
ModuleRegistry.registerModules([
  CellStyleModule,
  RowStyleModule,
  RowGroupingPanelModule,
  ColumnApiModule,
  RowApiModule,
]);

interface ConfigurationUpdateRow {
  // Configuration fields
  configId: number;
  configName: string;
  configType: ConfigurationType;
  configVersion: string;
  configValue: string;
  configCreatedDate: Date;
  configCreatedBy: string;
  configLastModifiedDate: Date;
  configLastModifiedBy: string;
  configUpdates: UpdateEntry[];
  configSourceMetadata?: string; // Update entry fields (null if this is the config row)
  updateJiraTicket?: string;
  updateComment?: string;
  updateDate?: Date;
  updateMadeBy?: string;
  // Helper
  isConfigRow: boolean;
}

@Component({
  selector: "app-configuration-grid",
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: "./configuration-grid.component.html",
  styleUrls: ["./configuration-grid.component.scss"],
})
export class ConfigurationGridComponent {
  store = inject(ConfigurationStore);

  @Output() rowDoubleClicked = new EventEmitter<Configuration>();
  @Output() selectionChanged = new EventEmitter<Configuration[]>();
  @Output() typeFilterChanged = new EventEmitter<ConfigurationType | null>();
  @Output() searchTermChanged = new EventEmitter<string>();
  @Output() viewValue = new EventEmitter<{
    value: string;
    type: ConfigurationType;
    previousValue?: string;
    nextValue?: string;
  }>();

  rowData: ConfigurationUpdateRow[] = [];
  groupBy: "none" | "name" | "version" = "none";
  private gridApi: any;

  constructor() {
    // Update grid data whenever filtered configurations change
    effect(() => {
      const configs = this.store.filteredConfigurations();
      this.rowData = this.flattenConfigurations(configs);

      if (this.gridApi) {
        this.gridApi.setGridOption("rowData", this.rowData);
      }
    });
  }

  private flattenConfigurations(
    configs: Configuration[],
  ): ConfigurationUpdateRow[] {
    const rows: ConfigurationUpdateRow[] = [];

    for (const config of configs) {
      // Add main configuration row
      rows.push({
        configId: config.id,
        configName: config.name,
        configType: config.type,
        configVersion: config.version,
        configValue: config.value,
        configCreatedDate: config.createdDate,
        configCreatedBy: config.createdBy,
        configLastModifiedDate: config.lastModifiedDate,
        configLastModifiedBy: config.lastModifiedBy,
        configUpdates: config.updates,
        configSourceMetadata: config.configSourceMetadata,
        isConfigRow: true,
      });

      // Add update entry rows
      if (config.updates && config.updates.length > 0) {
        for (const update of config.updates) {
          rows.push({
            configId: config.id,
            configName: config.name,
            configType: config.type,
            configVersion: config.version,
            configValue: config.value,
            configCreatedDate: config.createdDate,
            configCreatedBy: config.createdBy,
            configLastModifiedDate: config.lastModifiedDate,
            configLastModifiedBy: config.lastModifiedBy,
            configUpdates: config.updates,
            configSourceMetadata: config.configSourceMetadata,
            updateJiraTicket: update.jiraTicket,
            updateComment: update.comment,
            updateDate: update.date,
            updateMadeBy: update.madeBy,
            isConfigRow: false,
          });
        }
      }
    }

    return rows;
  }

  columnDefs: ColDef<ConfigurationUpdateRow>[] = [
    {
      headerName: "",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: "left",
      lockPosition: true,
      sortable: false,
      filter: false,
      resizable: false,
    },
    {
      headerName: "Actions",
      pinned: "left",
      width: 80,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        if (!params.data) return "";

        if (params.data.isConfigRow) {
          // For config rows, show view current value button
          return `<button class="btn btn-sm btn-link text-decoration-none view-value-btn" data-action="view-current" title="View current value">
            <i class="fas fa-code"></i>
          </button>`;
        } else {
          // For update rows, show view historical value button
          return `<button class="btn btn-sm btn-link text-decoration-none view-value-btn" data-action="view-historical" title="View value at this point">
            <i class="fas fa-code"></i>
          </button>`;
        }
      },
    },
    {
      headerName: "Configuration Name",
      field: "configName",
      filter: "agTextColumnFilter",
      sortable: true,
      enableRowGroup: true,
      minWidth: 250,
      cellClass: (params) => {
        return params.data?.isConfigRow
          ? "fw-bold text-primary text-decoration-underline"
          : "";
      },
    },
    {
      headerName: "Type",
      field: "configType",
      filter: "agTextColumnFilter",
      sortable: true,
      enableRowGroup: true,
      width: 200,
      hide: true,
    },
    {
      headerName: "Version",
      field: "configVersion",
      filter: "agTextColumnFilter",
      sortable: true,
      width: 100,
      comparator: (valueA: string, valueB: string) => {
        return compareSemanticVersions(valueA, valueB);
      },
    },
    {
      headerName: "Jira Ticket",
      field: "updateJiraTicket",
      filter: "agTextColumnFilter",
      sortable: true,
      width: 130,
      cellRenderer: (params: any) => {
        if (!params.value) return "";
        return `<a href="https://wealthdynamics.atlassian.net/browse/${params.value}" target="_blank" class="text-primary">${params.value}</a>`;
      },
    },
    {
      headerName: "Comment",
      field: "updateComment",
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 2,
      minWidth: 200,
      autoHeight: true,
      wrapText: true,
      cellClass: "text-wrap",
    },
    {
      headerName: "Update Date",
      field: "updateDate",
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return "";
        const date = new Date(params.value);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      },
      width: 170,
    },
    {
      headerName: "Updated By",
      field: "updateMadeBy",
      filter: "agTextColumnFilter",
      sortable: true,
      width: 140,
    },
  ];

  gridOptions: GridOptions<ConfigurationUpdateRow> = {
    columnDefs: this.columnDefs,
    rowSelection: "multiple",
    suppressRowClickSelection: true,
    isRowSelectable: (params) => {
      // Only allow selection of configuration rows, not update rows
      return params.data?.isConfigRow === true;
    },
    getRowStyle: (params) => {
      if (params.data?.isConfigRow === true) {
        return { background: "var(--bs-info-bg-subtle)" };
      }
      return undefined;
    },
    animateRows: true,
    enableCellTextSelection: true,
    rowBuffer: 10,
    rowGroupPanelShow: "always",
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [25, 50, 100, 200],
    sideBar: {
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
        },
      ],
      defaultToolPanel: "",
    },
    groupDefaultExpanded: 0,
    autoGroupColumnDef: {
      headerName: "Group",
      minWidth: 300,
      cellRendererParams: {
        suppressCount: false,
      },
    },
    getRowId: (params) => {
      if (params.data.isConfigRow) {
        return `config-${params.data.configId}`;
      }
      return `update-${params.data.configId}-${params.data.updateDate?.getTime()}`;
    },
    onRowDoubleClicked: (
      event: RowDoubleClickedEvent<ConfigurationUpdateRow>,
    ) => {
      if (event.data && event.data.isConfigRow) {
        const config: Configuration = {
          id: event.data.configId,
          basketId: this.store.currentBasketId()!,
          name: event.data.configName,
          type: event.data.configType,
          version: event.data.configVersion,
          value: event.data.configValue,
          createdDate: event.data.configCreatedDate,
          createdBy: event.data.configCreatedBy,
          lastModifiedDate: event.data.configLastModifiedDate,
          lastModifiedBy: event.data.configLastModifiedBy,
          updates: event.data.configUpdates,
        };
        this.rowDoubleClicked.emit(config);
      }
    },
    onSelectionChanged: () => {
      const selectedRows = this.gridApi?.getSelectedRows() || [];

      // Filter for config rows only and deduplicate by configId
      const uniqueConfigIds = new Set<number>();
      const configs = selectedRows
        .filter((row: ConfigurationUpdateRow) => {
          if (!row.isConfigRow || uniqueConfigIds.has(row.configId)) {
            return false;
          }
          uniqueConfigIds.add(row.configId);
          return true;
        })
        .map((row: ConfigurationUpdateRow) => ({
          id: row.configId,
          name: row.configName,
          type: row.configType,
          version: row.configVersion,
          value: row.configValue,
          createdDate: row.configCreatedDate,
          createdBy: row.configCreatedBy,
          lastModifiedDate: row.configLastModifiedDate,
          lastModifiedBy: row.configLastModifiedBy,
          updates: row.configUpdates,
        }));
      this.selectionChanged.emit(configs);
    },
    onColumnRowGroupChanged: () => {
      // Sync dropdown state when user changes grouping via AG Grid UI
      if (this.gridApi) {
        const columnState = this.gridApi.getColumnState();
        const nameGrouped = columnState.find(
          (col: any) => col.colId === "configName" && col.rowGroup,
        );
        const versionGrouped = columnState.find(
          (col: any) => col.colId === "configVersion" && col.rowGroup,
        );

        if (nameGrouped) {
          this.groupBy = "name";
        } else if (versionGrouped) {
          this.groupBy = "version";
        } else {
          this.groupBy = "none";
        }
      }
    },
  };

  onGridReady(event: GridReadyEvent<ConfigurationUpdateRow>): void {
    this.gridApi = event.api;

    // Add click listener for action buttons
    setTimeout(() => {
      const gridElement = document.querySelector(".ag-root");
      if (gridElement) {
        console.log("[Grid] Click listener attached to grid");
        gridElement.addEventListener("click", (e: Event) => {
          const target = e.target as HTMLElement;
          const button = target.closest(".view-value-btn") as HTMLElement;

          if (button) {
            console.log("[Grid] View value button clicked");
            e.stopPropagation();
            e.preventDefault();
            const action = button.getAttribute("data-action");
            console.log("[Grid] Action:", action);

            // Find the row element from the button
            const rowElement = target.closest("[row-index]") as HTMLElement;
            if (!rowElement) {
              console.log("[Grid] No row element found");
              return;
            }

            const rowIndex = rowElement.getAttribute("row-index");
            if (!rowIndex) {
              console.log("[Grid] No row index found");
              return;
            }

            console.log("[Grid] Row index:", rowIndex);
            const rowNode = this.gridApi.getDisplayedRowAtIndex(
              parseInt(rowIndex),
            );

            if (rowNode?.data) {
              const data = rowNode.data as ConfigurationUpdateRow;
              console.log("[Grid] Row data:", data);

              if (action === "view-current" && data.isConfigRow) {
                console.log("[Grid] Emitting view current value");
                // View current value - find previous version from updates
                const updates = data.configUpdates || [];
                const sortedUpdates = [...updates].sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                );

                this.viewValue.emit({
                  value: data.configValue,
                  type: data.configType,
                  previousValue: sortedUpdates[0]?.previousValue || "",
                  nextValue: "", // Current value has no next
                });
              } else if (action === "view-historical" && !data.isConfigRow) {
                console.log("[Grid] Emitting view historical value");
                // Find the previous and next values for this update
                const updates = data.configUpdates || [];
                const sortedUpdates = [...updates].sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                );

                const updateIndex = sortedUpdates.findIndex(
                  (u) => u.date.getTime() === data.updateDate?.getTime(),
                );

                // Get the value at this point (after this update)
                let valueToShow = "";
                let previousValue = "";
                let nextValue = "";

                if (updateIndex === 0) {
                  // Latest update - show current value
                  const configRow = this.rowData.find(
                    (r) => r.configId === data.configId && r.isConfigRow,
                  );
                  valueToShow = configRow?.configValue || "";
                  previousValue = sortedUpdates[0]?.previousValue || "";
                  nextValue = ""; // Latest has no next
                } else {
                  // Historical update - value after this update is previousValue of the next update
                  valueToShow =
                    sortedUpdates[updateIndex - 1]?.previousValue || "";
                  previousValue =
                    sortedUpdates[updateIndex]?.previousValue || "";

                  // Next value is the current value if this is second-to-last, otherwise previous of next update
                  if (updateIndex === 1) {
                    const configRow = this.rowData.find(
                      (r) => r.configId === data.configId && r.isConfigRow,
                    );
                    nextValue = configRow?.configValue || "";
                  } else {
                    nextValue =
                      sortedUpdates[updateIndex - 2]?.previousValue || "";
                  }
                }

                this.viewValue.emit({
                  value: valueToShow,
                  type: data.configType,
                  previousValue: previousValue,
                  nextValue: nextValue,
                });
              }
            }
          }
        });
      }
    }, 100);
  }

  onTypeFilterChange(event: Event): void {
    const type = (event.target as HTMLSelectElement).value;
    const filterValue = type === "" ? null : (type as ConfigurationType);
    this.typeFilterChanged.emit(filterValue);
  }

  onSearchChange(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTermChanged.emit(term);
  }

  onGroupByChange(event: Event): void {
    const mode = (event.target as HTMLSelectElement).value as
      | "none"
      | "name"
      | "version";
    this.groupBy = mode;

    if (this.gridApi) {
      // Clear all grouping first
      this.gridApi.applyColumnState({
        state: [
          { colId: "configName", rowGroup: false, hide: false },
          { colId: "configVersion", rowGroup: false, hide: false },
        ],
      });

      // Apply selected grouping
      if (mode === "name") {
        this.gridApi.applyColumnState({
          state: [{ colId: "configName", rowGroup: true, hide: true }],
          defaultState: { rowGroup: false },
        });
      } else if (mode === "version") {
        this.gridApi.applyColumnState({
          state: [{ colId: "configVersion", rowGroup: true, hide: true }],
          defaultState: { rowGroup: false },
        });
      }
    }
  }

  get configurationTypes(): ConfigurationType[] {
    return Object.values(ConfigurationType);
  }
}
