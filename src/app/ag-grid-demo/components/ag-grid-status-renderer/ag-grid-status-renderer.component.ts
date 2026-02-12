import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

/**
 * Cell renderer for ag-Grid rich select column.
 * Displays the status value when not in edit mode.
 */
@Component({
  selector: "app-ag-grid-status-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `<span
    class="status-display editable-cell w-100 d-flex align-items-center gap-3"
  >
    <small class="text-muted opacity-50" style="font-size: 75%">
      <i class="fa-solid fa-pencil"></i>
    </small>
    {{ value }}
  </span> `,
  styles: [
    `
      .status-display {
        display: block;
        padding-left: 12px;
        padding-right: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class AgGridStatusRendererComponent implements ICellRendererAngularComp {
  /** Current cell value */
  value: string = "";

  /** ag-Grid cell renderer parameters */
  params!: ICellRendererParams;

  /**
   * ag-Grid lifecycle method - initialize with cell parameters.
   */
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.value = params.value || "";
  }

  /**
   * ag-Grid lifecycle method - refresh cell value.
   */
  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.value = params.value || "";
    return true;
  }
}
