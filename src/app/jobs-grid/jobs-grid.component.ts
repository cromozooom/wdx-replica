import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridModule } from "ag-grid-angular";
import { ColDef, themeAlpine } from "ag-grid-community";
import { AutomationItem } from "../widget-automation-content/widget-automation-content.models";
import { StatusCellRendererComponent } from "../widget-automation-content/status-cell-renderer.component";
import { FailedErrorCellRendererComponent } from "../widget-automation-content/failed-error-cell-renderer.component";
import { PassedCellRendererComponent } from "../widget-automation-content/passed-cell-renderer.component";
import { FailedCellRendererComponent } from "../widget-automation-content/failed-cell-renderer.component";
import { JobNameCellRendererComponent } from "../widget-automation-content/job-name-cell-renderer.component";
import { JobActionsCellRendererComponent } from "../widget-automation-content/job-actions-cell-renderer.component";
import { JobGroupCellRendererComponent } from "../widget-automation-content/job-group-cell-renderer.component";

@Component({
  selector: "app-jobs-grid",
  standalone: true,
  imports: [
    CommonModule,
    AgGridModule,
    StatusCellRendererComponent,
    FailedErrorCellRendererComponent,
    PassedCellRendererComponent,
    FailedCellRendererComponent,
    JobNameCellRendererComponent,
    JobActionsCellRendererComponent,
    JobGroupCellRendererComponent,
  ],
  template: `
    <ag-grid-angular
      [theme]="theme"
      style="width: 100%; height: 100%;"
      [rowData]="jobs"
      class="flex-grow-1"
      [columnDefs]="columnDefs"
      [groupDisplayType]="'groupRows'"
      [groupDefaultExpanded]="-1"
      [groupRowRenderer]="'agGroupCellRenderer'"
      [groupRowRendererParams]="groupRowRendererParams"
      [animateRows]="true"
      [defaultColDef]="defaultColDef"
      [context]="context"
    ></ag-grid-angular>
  `,
  styleUrls: ["./jobs-grid.component.scss"],
})
export class JobsGridComponent {
  @Input() jobs: AutomationItem[] = [];
  @Input() context: any;
  theme = themeAlpine;
  groupRowRendererParams = { innerRenderer: JobGroupCellRendererComponent };
  columnDefs: ColDef<AutomationItem>[] = [
    {
      field: "name",
      headerName: "Job Name",
      filter: true,
      rowGroup: true,
      width: 420,
    },
    { field: "dateOfRun", headerName: "Date of Run", filter: false },
    {
      field: "type",
      headerName: "Type",
      filter: true,
      hide: false,
      width: 100,
    },
    {
      field: "status",
      headerName: "Status",
      filter: false,
      cellRenderer: StatusCellRendererComponent,
      cellRendererParams: (params: any) => ({ status: params.value }),
    },
    {
      field: "breachListLink",
      headerName: "Breach List",
      filter: true,
      width: 200,
    },
    {
      field: "testedRecordsCount",
      headerName: "Tested",
      filter: false,
      width: 150,
    },
    {
      field: "passedRecordsCount",
      headerName: "Passed",
      filter: true,
      valueGetter: (params: any) => {
        const passed = params.data?.passedRecordsCount ?? 0;
        const tested = params.data?.testedRecordsCount ?? 0;
        return passed === tested && tested > 0 ? "All Passed" : passed;
      },
      width: 150,
      cellRenderer: PassedCellRendererComponent,
    },
    {
      field: "failedRecordsCount",
      headerName: "Failed",
      filter: true,
      width: 150,
      cellRenderer: FailedCellRendererComponent,
    },
    {
      field: "failedRecordsWithErrorCount",
      headerName: "Failed (Error)",
      filter: true,
      width: 150,
      cellRenderer: FailedErrorCellRendererComponent,
    },
    {
      headerName: "Actions",
      cellRenderer: JobActionsCellRendererComponent,
      width: 120,
      pinned: "right",
      // suppressMenu removed: not a valid ColDef property
      sortable: false,
      filter: false,
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
