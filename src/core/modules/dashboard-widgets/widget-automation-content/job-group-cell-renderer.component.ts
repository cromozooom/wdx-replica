import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-job-group-cell-renderer",
  standalone: true,
  imports: [CommonModule, NgbTooltipModule],
  template: `
    <div class="d-flex align-items-center gap-1">
      <ng-container *ngIf="isGroupHeader()">
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-sm"
            (click)="showLastBreachList()"
            ngbTooltip="Last breach"
            placement="top"
            container="body"
          >
            <i class="fa-solid fa-list-ul"></i>
            <div class="sr-only">Breach list</div>
          </button>
          <button
            type="button"
            class="btn btn-sm"
            (click)="onEditJob()"
            ngbTooltip="Edit job"
            placement="top"
            container="body"
          >
            <i class="fa-solid fa-pen"></i>
            <div class="sr-only">Edit Job</div>
          </button>
        </div>
      </ng-container>
      <div class="separator"></div>
      <strong class="ag-group-value ms-2" data-ref="eValue">
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

  showLastBreachList() {
    if (
      this.params &&
      this.params.context &&
      this.params.context.showBreachList
    ) {
      let job = null;
      if (this.params.node.group && Array.isArray(this.params.context.jobs)) {
        job = this.params.context.jobs.find(
          (j: any) => j.name === this.params.node.key
        );
      } else {
        job = this.params.node.data;
      }
      this.params.context.showBreachList(job);
    }
  }

  isGroupHeader(): boolean {
    // ag-Grid group row: node.group === true, node.level === group level
    return this.params?.node?.group === true;
  }
}
