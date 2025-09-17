import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NgbOffcanvas,
  NgbOffcanvasModule,
  NgbActiveOffcanvas,
} from "@ng-bootstrap/ng-bootstrap";
import { BreachListItem } from "./widget-automation-content.models";
import { BreachListGridComponent } from "./breach-list-grid.component";

@Component({
  selector: "app-breach-list-offcanvas",
  standalone: true,
  imports: [CommonModule, NgbOffcanvasModule, BreachListGridComponent],
  template: `
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Breach List</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="activeOffcanvas.close()"
      ></button>
    </div>
    <div class="offcanvas-body">
      <ng-container *ngIf="breachList?.length; else noBreaches">
        <app-breach-list-grid
          [breachList]="breachList || []"
        ></app-breach-list-grid>
      </ng-container>
      <ng-template #noBreaches>
        <div class="text-muted">No breaches found.</div>
      </ng-template>
    </div>
  `,
})
export class BreachListOffcanvasComponent {
  @Input() breachList: BreachListItem[] | null = null;
  constructor(public activeOffcanvas: NgbActiveOffcanvas) {}
}
