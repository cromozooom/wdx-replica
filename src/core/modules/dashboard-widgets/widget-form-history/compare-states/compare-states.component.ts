import {
  Component,
  inject,
  Input,
  TemplateRef,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";
import { CompareGridComponent } from "../compare-grid/compare-grid.component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
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
  imports: [CommonModule, FormsModule, AgGridAngular, CompareGridComponent],
  templateUrl: "./compare-states.component.html",
  styleUrls: ["./compare-states.component.scss"],
})
export class CompareStatesComponent implements OnChanges {
  @Input() selectedForm: any = null;
  @Input() formHistory: { [formId: string]: any[] } = {};
  @Input() selectedFormId: string = "";
  @Input() users: any[] = [];
  @Input() forms: any[] = [];
  @Input() historyA: any = null;
  @Input() historyB: any = null;
  private modalService = inject(NgbModal);

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

  gridOptions: GridOptions = {
    rowSelection: {
      mode: "multiRow",
      selectAll: "filtered",
    },
  };

  selectedRows: any[] = [];
  historyRows: any[] = [];
  modalSelectedIndexes: number[] = [];
  modalCompareIndex: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.selectedFormId &&
      this.formHistory &&
      this.formHistory[this.selectedFormId]
    ) {
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
    } else {
      this.historyRows = [];
    }
  }

  get canCompareSelected() {
    return this.selectedRows.length >= 2;
  }

  get modalCompareCurrent() {
    return this.canCompareSelected
      ? this.selectedRows[this.modalCompareIndex]
      : null;
  }
  get modalComparePrev() {
    return this.canCompareSelected && this.modalCompareIndex > 0
      ? this.selectedRows[this.modalCompareIndex - 1]
      : null;
  }
  get modalCompareNext() {
    return this.canCompareSelected &&
      this.modalCompareIndex < this.selectedRows.length - 1
      ? this.selectedRows[this.modalCompareIndex + 1]
      : null;
  }

  modalGoPrev() {
    if (this.canCompareSelected && this.modalCompareIndex > 0) {
      this.modalCompareIndex--;
    }
  }
  modalGoNext() {
    if (
      this.canCompareSelected &&
      this.modalCompareIndex < this.selectedRows.length - 1
    ) {
      this.modalCompareIndex++;
    }
  }

  openFullscreen(content: TemplateRef<any>) {
    if (this.selectedRows.length > 0) {
      this.modalCompareIndex = 0;
    }
    this.modalService.open(content, { fullscreen: true });
  }

  onSelectionChanged(event: any) {
    this.selectedRows = event.api.getSelectedRows();
    this.modalCompareIndex = 0;
    console.log("Selected Rows:", this.selectedRows);
  }
}
