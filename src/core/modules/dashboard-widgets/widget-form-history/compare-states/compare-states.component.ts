import { Component, inject, Input, TemplateRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgGridAngular } from "ag-grid-angular";
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

  // No gridOptions needed; set rowSelection directly in template

  selectedRows: any[] = [];
  historyRows: any[] = [];

  // Modal navigation state
  modalHistoryIndex: number | null = null;

  get hasModalHistory() {
    return this.historyRows.length > 0 && this.modalHistoryIndex !== null;
  }

  get modalCurrent() {
    return this.hasModalHistory
      ? this.historyRows[this.modalHistoryIndex!]
      : null;
  }
  get modalPrev() {
    if (!this.hasModalHistory) return null;
    return this.modalHistoryIndex! > 0
      ? this.historyRows[this.modalHistoryIndex! - 1]
      : null;
  }
  get modalNext() {
    if (!this.hasModalHistory) return null;
    return this.modalHistoryIndex! < this.historyRows.length - 1
      ? this.historyRows[this.modalHistoryIndex! + 1]
      : null;
  }

  modalGoPrev() {
    if (this.modalHistoryIndex !== null && this.modalHistoryIndex > 0) {
      this.modalHistoryIndex--;
    }
  }
  modalGoNext() {
    if (
      this.modalHistoryIndex !== null &&
      this.modalHistoryIndex < this.historyRows.length - 1
    ) {
      this.modalHistoryIndex++;
    }
  }

  ngOnChanges(changes: any) {
    if (
      changes["formHistory"] ||
      changes["selectedFormId"] ||
      changes["users"]
    ) {
      if (!this.selectedFormId || !this.formHistory[this.selectedFormId]) {
        this.historyRows = [];
      } else {
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
      }
    }
  }

  openFullscreen(content: TemplateRef<any>) {
    // Open modal at selected row, or first if none selected
    if (this.selectedRows.length > 0) {
      const idx = this.historyRows.findIndex(
        (r) => r.entry?.id === this.selectedRows[0]?.entry?.id
      );
      this.modalHistoryIndex = idx >= 0 ? idx : 0;
    } else {
      this.modalHistoryIndex = 0;
    }
    this.modalService.open(content, { fullscreen: true });
  }

  onSelectionChanged(event: any) {
    this.selectedRows = event.api.getSelectedRows();
    console.log("Selected Rows:", this.selectedRows);
  }
}
