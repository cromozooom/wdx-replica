import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-job-name-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="d-flex align-items-center gap-2">
      <ng-container [ngSwitch]="type">
        <i *ngSwitchCase="'form'" class="fa-regular fa-question" title="Form">
        </i>
        <i
          *ngSwitchCase="'document'"
          class="fa-regular fa-file"
          title="Document"
        ></i>
        <i *ngSwitchDefault class="fa-regular home" title="Other"></i>
      </ng-container>
      <span class="job-name-label">{{ name }}</span>
    </span>
  `,
})
export class JobNameCellRendererComponent implements ICellRendererAngularComp {
  name: string = "";
  type: string = "";

  agInit(params: any): void {
    this.name = params.value;
    this.type = params.data?.type ?? "";
  }

  refresh(params: any): boolean {
    this.agInit(params);
    return true;
  }
}
