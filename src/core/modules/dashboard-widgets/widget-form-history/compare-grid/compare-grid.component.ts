import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, GridOptions, ModuleRegistry } from "ag-grid-community";
import { RowGroupingModule } from "ag-grid-enterprise";
import { buildCompareRows, CompareGridRow } from "./compare-grid.utils";
import { StatusValueCellRendererComponent } from "./status-value-cell-renderer.component";

ModuleRegistry.registerModules([RowGroupingModule]);

@Component({
  selector: "app-compare-grid",
  standalone: true,
  imports: [CommonModule, AgGridAngular, StatusValueCellRendererComponent],
  templateUrl: "./compare-grid.component.html",
  styleUrls: ["./compare-grid.component.scss"],
})
export class CompareGridComponent implements OnChanges {
  @Input() prev: any = null;
  @Input() current: any = null;
  @Input() schema: any = null;
  @Input() prevMeta: any = null;
  @Input() currentMeta: any = null;

  rowData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    function toFlatRows(
      rows: CompareGridRow[],
      parentGroup: string | null = null,
      parentIndex: number = 0
    ): any[] {
      const result: any[] = [];
      let idx = parentIndex;
      for (const row of rows) {
        if (row.status === "group" && row.children) {
          let childIdx = 0;
          for (const child of row.children) {
            if (child.status !== "group") {
              result.push({
                ...child,
                group: row.label,
                field: child.label,
                sortIndex: idx + childIdx / 1000, // keep group fields together
              });
              childIdx++;
            }
          }
          idx++;
        } else if (!parentGroup) {
          result.push({
            ...row,
            group: "root",
            field: row.label,
            sortIndex: idx,
          });
          idx++;
        }
      }
      return result;
    }
    const rows = toFlatRows(
      buildCompareRows(this.prev, this.current, this.schema)
    );
    this.rowData = rows.sort((a, b) => a.sortIndex - b.sortIndex);
  }

  columnDefs: ColDef[] = [
    { field: "group", headerName: "Group", rowGroup: true, hide: true },
    { field: "field", headerName: "Field", filter: "agTextColumnFilter" },
    {
      field: "prevValue",
      headerName: "Previous",
      filter: "agTextColumnFilter",
      flex: 1,
      valueFormatter: (params: { value: any }) =>
        params.value === undefined ? "—" : params.value,
    },
    {
      field: "currentValue",
      headerName: "Current",
      flex: 1,
      filter: "agTextColumnFilter",
      valueFormatter: (params: { value: any }) =>
        params.value === undefined ? "—" : params.value,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0,
      width: 120,
      cellRenderer: "statusValueCellRenderer",
    },
  ];
  gridOptions: GridOptions = {
    domLayout: "autoHeight",
    groupHideParentOfSingleChild: "leafGroupsOnly",
    animateRows: true,
    defaultColDef: {
      floatingFilter: true,
      resizable: true,
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    },
    groupDisplayType: "singleColumn",
    groupDefaultExpanded: 1,
    components: {
      statusValueCellRenderer: StatusValueCellRendererComponent,
    },
  };

  // No longer needed: flattenRows removed. Tree structure is now provided directly.
}
