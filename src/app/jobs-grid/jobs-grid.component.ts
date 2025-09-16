import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridModule } from "ag-grid-angular";
import { ColDef, themeAlpine } from "ag-grid-community";
import { AutomationItem } from "../widget-automation-content/widget-automation-content.models";

@Component({
  selector: "app-jobs-grid",
  standalone: true,
  imports: [CommonModule, AgGridModule],
  template: `
    <ag-grid-angular
      [theme]="theme"
      style="width: 100%; height: 100%;"
      [rowData]="jobs"
      class="flex-grow-1"
      [columnDefs]="columnDefs"
      [groupDisplayType]="'groupRows'"
      [animateRows]="true"
      [defaultColDef]="defaultColDef"
    ></ag-grid-angular>
  `,
})
export class JobsGridComponent {
  @Input() jobs: AutomationItem[] = [];
  theme = themeAlpine;
  columnDefs: ColDef<AutomationItem>[] = [
    {
      field: "type",
      headerName: "Type",
      filter: true,
      hide: true,
    },
    { field: "name", headerName: "Job Name", filter: true, rowGroup: true },
    { field: "dateOfRun", headerName: "Date of Run", filter: true },
    { field: "status", headerName: "Status", filter: true },
    { field: "breachListLink", headerName: "Breach List", filter: true },
    { field: "testedRecordsCount", headerName: "Tested", filter: true },
    { field: "passedRecordsCount", headerName: "Passed", filter: true },
    { field: "failedRecordsCount", headerName: "Failed", filter: true },
    {
      field: "failedRecordsWithErrorCount",
      headerName: "Failed (Error)",
      filter: true,
    },
    // Validation details (breach list) will be handled as a custom cell renderer in the next step
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  };
}
