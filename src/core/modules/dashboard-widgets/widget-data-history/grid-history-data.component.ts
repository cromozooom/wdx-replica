import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AgGridModule } from "ag-grid-angular";
import {
  ColDef,
  GridOptions,
  RowGroupingDisplayType,
  TextFilterModule,
  ModuleRegistry,
  ClientSideRowModelModule,
} from "ag-grid-community";
import {
  AdvancedFilterModule,
  ColumnMenuModule,
  ContextMenuModule,
} from "ag-grid-enterprise";
ModuleRegistry.registerModules([
  TextFilterModule,
  AdvancedFilterModule,
  ClientSideRowModelModule,
  ColumnMenuModule,
  ContextMenuModule,
  // ...(process.env.NODE_ENV !== "production" ? [ValidationModule] : []),
]);

@Component({
  selector: "app-grid-history-data",
  standalone: true,
  imports: [CommonModule, AgGridModule],
  templateUrl: "./grid-history-data.component.html",
  styleUrls: ["./grid-history-data.component.scss"],
})
export class GridHistoryDataComponent {
  gridOptions: GridOptions = {
    enableAdvancedFilter: true,
  };
  @Input() rowData: any[] = [];
  @Input() columnDefs: ColDef[] = [];
  @Input() autoGroupColumnDef: ColDef | undefined;
  @Input() defaultColDef: any;
  // Remove groupDisplayType and groupDisplayPanel, not needed
  @Output() gridReady = new EventEmitter<any>();

  onGridReady(event: any) {
    this.gridReady.emit(event);
  }
}
