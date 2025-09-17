import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-failed-error-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="celContent">
      <ng-container *ngIf="value > 0; else noError">
        <span
          [ngClass]="{
            'rounded py-1 px-2 bg-danger-subtle text-danger-emphasis':
              value > 0,
          }"
        >
          {{ value }}
        </span>
      </ng-container>
      <ng-template #noError>
        <span class="rounded py-1 px-2 bg-success-subtle text-success-emphasis">
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
export class FailedErrorCellRendererComponent
  implements ICellRendererAngularComp
{
  value: number = 0;

  agInit(params: any): void {
    this.value = params.value;
  }

  refresh(params: any): boolean {
    this.value = params.value;
    return true;
  }
}
