import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-failed-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="celContent">
      <ng-container *ngIf="failed > 0; else noneFailed">
        <span
          class="rounded py-1 px-2 bg-warning-subtle text-warning-emphasis "
        >
          {{ failed }}
        </span>
      </ng-container>
      <ng-template #noneFailed>
        <span
          class="rounded py-1 px-2 bg-success-subtle text-success-emphasis "
        >
          <i class="fa-solid fa-check"></i> All Passed
        </span>
      </ng-template>
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
export class FailedCellRendererComponent implements ICellRendererAngularComp {
  failed: number = 0;

  agInit(params: any): void {
    this.failed = params.value;
  }

  refresh(params: any): boolean {
    this.agInit(params);
    return true;
  }
}
