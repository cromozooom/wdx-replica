import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-status-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="d-flex gap-1 align-items-center h-100">
      <span [ngClass]="statusClass">
        <ng-container [ngSwitch]="status">
          <span *ngSwitchCase="'completed'" class="d-flex align-items-center">
            <span
              class="badge text-success-emphasis d-flex gap-1 align-items-center"
              ><i class="fa-solid fa-check"></i> Completed
            </span>
          </span>
          <span
            *ngSwitchCase="'running'"
            class=" d-flex gap-1 align-items-center"
          >
            <div
              class="spinner-border spinner-border-sm text-info"
              role="status"
            >
              <span class="visually-hidden">Running...</span>
            </div>
            <small> Running... </small>
          </span>
          <span
            class="badge bg-danger-subtle text-danger-emphasis d-flex gap-1 align-items-center"
            *ngSwitchCase="'failed'"
          >
            <i class="fa-solid fa-circle-exclamation"></i>
            Failed</span
          >
          <span
            class="badge bg-danger-subtle text-danger-emphasis"
            *ngSwitchDefault
            >{{ status }}</span
          >
        </ng-container>
      </span>
    </span>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class StatusCellRendererComponent implements ICellRendererAngularComp {
  status: string = "";

  agInit(params: any): void {
    this.status = params.value;
  }

  refresh(params: any): boolean {
    this.status = params.value;
    return true;
  }

  get statusClass() {
    switch (this.status) {
      case "completed":
        return "status-completed";
      case "running":
        return "status-running";
      case "failed":
        return "status-failed";
      default:
        return "";
    }
  }
}
