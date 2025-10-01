import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";

import { ColDef, ModuleRegistry } from "ag-grid-community";
import { RowSelectionModule } from "ag-grid-community";

// Register the RowSelectionModule for AG Grid v33+
ModuleRegistry.registerModules([RowSelectionModule]);

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

  get historyRows() {
    if (!this.selectedFormId || !this.formHistory[this.selectedFormId])
      return [];
    return this.formHistory[this.selectedFormId].map((entry) => ({
      date: new Date(entry.timestamp).toLocaleString(),
      saveType: entry.saveType,
      user: this.users.find((u) => u.id === entry.userId)?.name || entry.userId,
      entry,
    }));
  }

  onSelectionChanged(event: any) {
    this.selectedRows = event.api.getSelectedRows();
  }
}
