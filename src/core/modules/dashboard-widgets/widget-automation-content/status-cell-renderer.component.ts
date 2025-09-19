import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-status-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="celContent">
      <ng-container [ngSwitch]="status">
        <span
          *ngSwitchCase="'completed'"
          class="rounded py-1 px-2 bg-success-subtle text-success-emphasis"
          ><i class="fa-solid fa-check"></i>
          Completed
        </span>
        <div *ngSwitchCase="'running'" class=" d-flex gap-1 align-items-center">
          <div class="spinner-border spinner-border-sm text-info" role="status">
            <span class="visually-hidden">Running...</span>
          </div>
          <small class="opacity-50"> Running... </small>
        </div>
        <span
          class="rounded py-1 px-2 bg-danger-subtle text-danger-emphasis"
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
  `,
  styles: [
    `
      .celContent {
        height: 100%;
        flex-grow: 0;
        width: 100%;
        align-self: center;
        text-align: left;
      }

      :host {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: start;
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
