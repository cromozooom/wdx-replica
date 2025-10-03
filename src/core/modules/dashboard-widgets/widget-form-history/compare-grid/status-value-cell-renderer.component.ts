import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CompareStatus } from "./compare-status.enum";

@Component({
  selector: "app-status-value-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container [ngSwitch]="value">
      <span
        *ngSwitchCase="CompareStatus.Untouched"
        class="badge fw-normal rounded-pill text-body bg-light"
        >Untouched</span
      >
      <span
        *ngSwitchCase="CompareStatus.Removed"
        class="badge fw-normal rounded-pill bg-danger"
        >Removed</span
      >
      <span
        *ngSwitchCase="CompareStatus.New"
        class="badge fw-normal rounded-pill bg-success"
        >New</span
      >
      <span
        *ngSwitchCase="CompareStatus.Changed"
        class="badge fw-normal rounded-pill bg-warning text-dark"
        >Changed</span
      >
      <span
        *ngSwitchDefault
        class="badge fw-normal rounded-pill bg-light text-dark"
        >{{ value }}</span
      >
    </ng-container>
  `,
})
export class StatusValueCellRendererComponent {
  @Input() value: string = "";
  CompareStatus = CompareStatus;

  agInit?(params: any): void {
    this.value = params.value;
  }
}
