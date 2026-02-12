import { Component, ChangeDetectionStrategy } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

/**
 * Custom cell renderer for Department column
 * Displays department value with background styling to indicate editability
 */
@Component({
  selector: "app-department-cell-renderer",
  standalone: true,
  template: `
    <span
      class="status-display editable-cell w-100 d-flex align-items-center gap-3"
    >
      <small class="text-muted opacity-50" style="font-size: 75%">
        <i class="fa-solid fa-pencil"></i>
      </small>
      {{ value }}
    </span>
  `,
  styles: [
    `
      .department-display {
        display: block;
        width: 100%;
        height: 100%;
        padding-left: 16px;
        padding-right: 8px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentCellRendererComponent
  implements ICellRendererAngularComp
{
  public value: string = "";

  agInit(params: ICellRendererParams): void {
    this.value = params.value;
  }

  refresh(params: ICellRendererParams): boolean {
    this.value = params.value;
    return true;
  }
}
