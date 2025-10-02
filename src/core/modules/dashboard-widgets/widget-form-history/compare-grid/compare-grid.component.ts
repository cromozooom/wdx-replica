import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, GridOptions } from "ag-grid-community";
import { buildCompareRows, CompareGridRow } from "./compare-grid.utils";

@Component({
  selector: "app-compare-grid",
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: "./compare-grid.component.html",
  styleUrls: ["./compare-grid.component.scss"],
})
export class CompareGridComponent {
  @Input() prev: any = null;
  @Input() current: any = null;
  @Input() schema: any = null;
  @Input() prevMeta: any = null;
  @Input() currentMeta: any = null;

  get rowData(): any[] {
    // Flatten group rows for ag-Grid tree data
    return this.flattenRows(
      buildCompareRows(this.prev, this.current, this.schema)
    );
  }

  columnDefs: ColDef[] = [
    {
      field: "label",
      headerName: "Field",
      cellRenderer: "agGroupCellRenderer",
      flex: 2,
    },
    {
      field: "prevValue",
      headerName: "Previous",
      flex: 1,
      valueFormatter: (params) =>
        params.value === undefined ? "—" : params.value,
    },
    {
      field: "currentValue",
      headerName: "Current",
      flex: 1,
      valueFormatter: (params) =>
        params.value === undefined ? "—" : params.value,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
  ];

  gridOptions: GridOptions = {
    treeData: true,
    animateRows: true,
    getDataPath: (data: any) => data._treePath,
    autoGroupColumnDef: {
      headerName: "Field",
      cellRendererParams: {
        suppressCount: true,
      },
    },
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
    },
    domLayout: "autoHeight",
  };

  // Helper to flatten group rows for ag-Grid tree data
  private flattenRows(rows: CompareGridRow[], path: string[] = []): any[] {
    const result: any[] = [];
    for (const row of rows) {
      const node: any = { ...row, _treePath: [...path, row.label] };
      if (row.status === "group" && row.children) {
        result.push(node);
        result.push(...this.flattenRows(row.children, [...path, row.label]));
      } else {
        result.push(node);
      }
    }
    return result;
  }
}
