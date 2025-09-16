import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-passed-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [ngClass]="{ 'all-passed': isAllPassed, 'partial-passed': !isAllPassed }"
    >
      <ng-container *ngIf="isAllPassed; else partial">
        <span class="badge bg-success-subtle text-success-emphasis">
          <i class="fa-solid fa-check"></i> All Passed
        </span>
      </ng-container>
      <ng-template #partial> {{ passed }} </ng-template>
    </span>
  `,
})
export class PassedCellRendererComponent implements ICellRendererAngularComp {
  passed: number = 0;
  tested: number = 0;
  isAllPassed: boolean = false;

  agInit(params: any): void {
    this.passed = params.value;
    this.tested = params.data?.testedRecordsCount ?? 0;
    this.isAllPassed = this.passed === this.tested && this.tested > 0;
  }

  refresh(params: any): boolean {
    this.agInit(params);
    return true;
  }
}
