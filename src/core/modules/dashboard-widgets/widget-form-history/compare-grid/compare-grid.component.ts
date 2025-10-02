import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, GridOptions, ModuleRegistry } from "ag-grid-community";
import { RowGroupingModule } from "ag-grid-enterprise";
import { buildCompareRows, CompareGridRow } from "./compare-grid.utils";

ModuleRegistry.registerModules([RowGroupingModule]);

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
    // Flat array, set group: 'root' for top-level fields, group: group name for grouped fields
    function toFlatRows(
      rows: CompareGridRow[],
      parentGroup: string | null = null
    ): any[] {
      const result: any[] = [];
      for (const row of rows) {
        if (row.status === "group" && row.children) {
          for (const child of row.children) {
            if (child.status !== "group") {
              result.push({
                ...child,
                group: row.label,
                field: child.label,
              });
            }
          }
        } else if (!parentGroup) {
          result.push({
            ...row,
            group: "root",
            field: row.label,
          });
        }
      }
      return result;
    }
    return toFlatRows(buildCompareRows(this.prev, this.current, this.schema));
  }

  columnDefs: ColDef[] = [
    { field: "group", headerName: "Group", rowGroup: true, hide: true },
    { field: "field", headerName: "Field" },
    {
      field: "prevValue",
      headerName: "Previous",
      flex: 1,
      valueFormatter: (params: { value: any }) =>
        params.value === undefined ? "—" : params.value,
    },
    {
      field: "currentValue",
      headerName: "Current",
      flex: 1,
      valueFormatter: (params: { value: any }) =>
        params.value === undefined ? "—" : params.value,
    },
    { field: "status", headerName: "Status", flex: 0 },
  ];
  gridOptions: GridOptions = {
    animateRows: true,
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    },
    // autoGroupColumnDef: {
    //   minWidth: 200,
    // },
    groupDisplayType: "singleColumn",
    groupDefaultExpanded: 1,
    domLayout: "autoHeight",
  };

  // No longer needed: flattenRows removed. Tree structure is now provided directly.
}
