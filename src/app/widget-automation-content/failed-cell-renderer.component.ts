import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-failed-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="{ 'has-failed': failed > 0 }">
      <ng-container *ngIf="failed > 0; else noneFailed">
        <span
          [ngClass]="{
            'badge bg-warning-subtle text-warning-emphasis': failed > 0,
          }"
        >
          {{ failed }}
        </span>
      </ng-container>
      <ng-template #noneFailed>
        <span class="badge bg-success-subtle text-success-emphasis">
          <i class="fa-solid fa-check"></i>
        </span>
      </ng-template>
    </span>
  `,
  styles: [
    `
      .has-failed {
        color: #b71c1c;
        font-weight: bold;
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
