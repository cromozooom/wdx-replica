import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-passed-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="celContent">
      <span
        [ngClass]="{
          'all-passed': isAllPassed,
          'partial-passed': !isAllPassed,
        }"
      >
        <ng-container *ngIf="isAllPassed; else partial">
          <span
            class="rounded py-1 px-2  bg-success-subtle text-success-emphasis"
          >
            <i class="fa-solid fa-check"></i> All Passed
          </span>
        </ng-container>
        <ng-template #partial> {{ passed }} </ng-template>
      </span>
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
export class PassedCellRendererComponent implements ICellRendererAngularComp {
  passed: number = 0;
  tested: number = 0;
  isAllPassed: boolean = false;

  agInit(params: any): void {
    // params.value is either 'All Passed' or a number (from valueGetter)
    this.passed = params.data?.passedRecordsCount ?? 0;
    this.tested = params.data?.testedRecordsCount ?? 0;
    this.isAllPassed = this.passed === this.tested && this.tested > 0;
  }

  refresh(params: any): boolean {
    this.agInit(params);
    return true;
  }
}
