import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridModule } from "ag-grid-angular";
import { ColDef } from "ag-grid-community";
import { BreachListItem } from "./widget-automation-content.models";

@Component({
  selector: "app-breach-list-grid",
  standalone: true,
  imports: [CommonModule, AgGridModule],
  templateUrl: "./breach-list-grid.component.html",
})
export class BreachListGridComponent {
  @Input() breachList: BreachListItem[] = [];

  columnDefs: ColDef[] = [
    { field: "recordName", headerName: "Record Name" },
    { field: "type", headerName: "Type" },
    { field: "outcome", headerName: "Outcome" },
    { field: "errorMessage", headerName: "Error Message" },
    { field: "details", headerName: "Details" },
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  };
}
