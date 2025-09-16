import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NgbOffcanvas,
  NgbOffcanvasRef,
  NgbOffcanvasModule,
} from "@ng-bootstrap/ng-bootstrap";
import { BreachListItem } from "./widget-automation-content.models";

@Component({
  selector: "app-breach-list-offcanvas",
  standalone: true,
  imports: [CommonModule, NgbOffcanvasModule],
  template: `
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Breach List</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="close()"
      ></button>
    </div>
    <div class="offcanvas-body">
      <ng-container *ngIf="breachList?.length; else noBreaches">
        <ul class="list-group">
          <li class="list-group-item" *ngFor="let breach of breachList">
            {{ breach.details }}
          </li>
        </ul>
      </ng-container>
      <ng-template #noBreaches>
        <div class="text-muted">No breaches found.</div>
      </ng-template>
    </div>
  `,
})
export class BreachListOffcanvasComponent {
  @Input() breachList: BreachListItem[] | null = null;
  private offcanvasRef: NgbOffcanvasRef | null = null;

  constructor(private offcanvas: NgbOffcanvas) {}

  open(breachList: BreachListItem[]) {
    this.breachList = breachList;
    this.offcanvasRef = this.offcanvas.open(BreachListOffcanvasComponent, {
      position: "end",
      panelClass: "offcanvas-width-md",
    });
    (
      this.offcanvasRef.componentInstance as BreachListOffcanvasComponent
    ).breachList = breachList;
  }

  close() {
    this.offcanvasRef?.close();
  }
}
