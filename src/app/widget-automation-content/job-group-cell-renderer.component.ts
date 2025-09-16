import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-job-group-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center gap-1">
      <ng-container *ngIf="isGroupHeader()">
        <button
          type="button"
          class="btn btn-sm btn-link ms-2"
          (click)="onEditJob()"
          title="Edit Job"
        >
          Edit
        </button>
      </ng-container>
      <strong class="ag-group-value" data-ref="eValue">
        {{ params.value }}</strong
      >
    </div>
  `,
})
export class JobGroupCellRendererComponent implements ICellRendererAngularComp {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }

  onEditJob() {
    if (this.params && this.params.context && this.params.context.editJob) {
      // For group header, node.key is the job name. Find the job object from context.jobs.
      let job = null;
      if (this.params.node.group && Array.isArray(this.params.context.jobs)) {
        job = this.params.context.jobs.find(
          (j: any) => j.name === this.params.node.key
        );
      } else {
        job = this.params.node.data;
      }
      this.params.context.editJob(this.params.node.key, job);
    }
  }

  isGroupHeader(): boolean {
    // ag-Grid group row: node.group === true, node.level === group level
    return this.params?.node?.group === true;
  }
}
