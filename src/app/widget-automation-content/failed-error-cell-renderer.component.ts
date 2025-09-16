import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-failed-error-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span>
      <ng-container *ngIf="value > 0; else noError">
        <span [ngClass]="{ 'error-highlight': value > 0 }">
          {{ value }}
        </span>
      </ng-container>
      <ng-template #noError>
        <span>
          <div class="fa fa-check"></div>
        </span>
      </ng-template>
    </span>
  `,
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
