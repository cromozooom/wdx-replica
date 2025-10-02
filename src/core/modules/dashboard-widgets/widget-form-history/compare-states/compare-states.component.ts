import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";

import {
  ClientSideRowModelModule,
  ColDef,
  GridApi,
  GridOptions,
  ModuleRegistry,
  RowSelectionMode,
  RowSelectionModule,
  ValidationModule,
  createGrid,
} from "ag-grid-community";
import {
  ColumnMenuModule,
  ColumnsToolPanelModule,
  ContextMenuModule,
  RowGroupingModule,
} from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  RowSelectionModule,
  RowSelectionModule,
  ClientSideRowModelModule,
  ColumnsToolPanelModule,
  ColumnMenuModule,
  ContextMenuModule,
  RowGroupingModule,
  // ...(process.env.NODE_ENV !== "production" ? [ValidationModule] : []),
]);

@Component({
  selector: "app-compare-states",
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: "./compare-states.component.html",
  styleUrls: ["./compare-states.component.scss"],
})
export class CompareStatesComponent {
  @Input() formHistory: { [formId: string]: any[] } = {};
  @Input() selectedFormId: string = "";
  @Input() users: any[] = [];
  @Input() forms: any[] = [];

  // For state comparison
  @Input() historyA: any = null;
  @Input() historyB: any = null;

  columnDefs: ColDef[] = [
    { headerName: "Date", field: "date", sortable: true, filter: true },
    {
      headerName: "Save Type",
      field: "saveType",
      sortable: true,
      filter: true,
    },
    { headerName: "User", field: "user", sortable: true, filter: true },
  ];

  // No gridOptions needed; set rowSelection directly in template

  selectedRows: any[] = [];
  historyRows: any[] = [];

  ngOnChanges(changes: any) {
    if (
      changes["formHistory"] ||
      changes["selectedFormId"] ||
      changes["users"]
    ) {
      if (!this.selectedFormId || !this.formHistory[this.selectedFormId]) {
        this.historyRows = [];
      } else {
        this.historyRows = this.formHistory[this.selectedFormId].map(
          (entry: any) => ({
            date: new Date(entry.timestamp).toLocaleString(),
            saveType: entry.saveType,
            user:
              this.users.find((u: any) => u.id === entry.userId)?.name ||
              entry.userId,
            entry,
          })
        );
      }
    }
  }

  onSelectionChanged(event: any) {
    this.selectedRows = event.api.getSelectedRows();
    console.log("Selected Rows:", this.selectedRows);
  }
}
