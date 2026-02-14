import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  GridOptions,
  ModuleRegistry,
  TextEditorModule,
} from "ag-grid-community";
import { RichSelectModule } from "ag-grid-enterprise";
import { MockDataService } from "./services/mock-data.service";
import { GridRow } from "./models/grid-row.interface";
import { NgSelectCellRendererComponent } from "./components/ng-select-cell-renderer/ng-select-cell-renderer.component";
import { AgGridStatusRendererComponent } from "./components/ag-grid-status-renderer/ag-grid-status-renderer.component";
import { DepartmentCellRendererComponent } from "./components/department-cell-renderer/department-cell-renderer.component";

// Register ag-Grid modules for Rich Select Editor and Text Editor
ModuleRegistry.registerModules([RichSelectModule, TextEditorModule]);

/**
 * Main container component for the ag-Grid with ng-select demonstration.
 * Displays a grid with 15 columns and 100 rows of simulated data,
 * where the status column contains ng-select dropdown components in constrained space.
 */
@Component({
  selector: "app-ag-grid-demo",
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: "./ag-grid-demo.component.html",
  styleUrls: ["./ag-grid-demo.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgGridDemoComponent implements OnInit {
  /** Grid data (100 rows of simulated data) */
  rowData: GridRow[] = [];

  /** Column definitions for all 15 columns */
  columnDefs: ColDef[] = [];

  /** Default column configuration applied to all columns */
  defaultColDef: ColDef = {
    width: 130,
    resizable: true,
    sortable: true,
    filter: true,
  };

  /** ag-Grid options */
  gridOptions: GridOptions = {
    animateRows: true,
    rowSelection: {
      mode: "singleRow",
    },
  };

  constructor(private mockDataService: MockDataService) {}

  ngOnInit(): void {
    // Generate 100 rows of mock data
    this.rowData = this.mockDataService.generate(100);

    // Define all 15 column definitions
    this.columnDefs = [
      { field: "id", headerName: "ID", width: 80 },
      { field: "name", headerName: "Name", width: 150 },
      { field: "email", headerName: "Email", width: 200 },
      {
        field: "status",
        headerName: "Status (ng-select)",
        width: 110, // Narrower width for constrained space
        cellRenderer: NgSelectCellRendererComponent,
        editable: false,
      },
      {
        field: "statusAgGrid",
        headerName: "Status AG-Grid",
        width: 110, // Narrower width for constrained space
        editable: true,
        cellRenderer: AgGridStatusRendererComponent,
        cellEditor: "agRichSelectCellEditor",
        cellEditorParams: {
          values: [
            "Active",
            "Pending",
            "Inactive",
            "Suspended",
            "Archived",
            "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
          ],
          cellHeight: 30,
          searchDebounceDelay: 500,
        },
      },
      {
        field: "department",
        headerName: "Department",
        editable: true,
        cellRenderer: DepartmentCellRendererComponent,
      },
      { field: "location", headerName: "Location" },
      { field: "role", headerName: "Role" },
      { field: "startDate", headerName: "Start Date", width: 120 },
      {
        field: "salary",
        headerName: "Salary",
        valueFormatter: (params) => {
          return params.value ? `$${params.value.toLocaleString()}` : "";
        },
      },
      { field: "performance", headerName: "Performance" },
      { field: "projects", headerName: "Projects", width: 100 },
      { field: "hoursLogged", headerName: "Hours Logged", width: 120 },
      { field: "certification", headerName: "Certification" },
      { field: "experience", headerName: "Experience (yrs)", width: 140 },
      { field: "team", headerName: "Team" },
    ];
  }
}
