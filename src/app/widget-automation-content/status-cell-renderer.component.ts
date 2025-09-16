import { Component } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-status-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="statusClass">
      <ng-container [ngSwitch]="status">
        <span class="badge text-success-emphasis" *ngSwitchCase="'completed'"
          >✅ Completed</span
        >
        <span
          class="badge bg-warning-subtle text-warning-emphasis"
          *ngSwitchCase="'running'"
          >⏳ Running</span
        >
        <span
          class="badge bg-danger-subtle text-danger-emphasis"
          *ngSwitchCase="'failed'"
          >Failed</span
        >
        <span
          class="badge bg-danger-subtle text-danger-emphasis"
          *ngSwitchDefault
          >{{ status }}</span
        >
      </ng-container>
    </span>
  `,
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
