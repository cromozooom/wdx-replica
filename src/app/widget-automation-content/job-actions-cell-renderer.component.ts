import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ICellRendererAngularComp } from "ag-grid-angular";

@Component({
  selector: "app-job-actions-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="btn-group" role="group" aria-label="Basic example">
      <button
        (click)="onShowBreachList()"
        title="Show Breach List"
        type="button"
        class="btn btn-sm btn-outline-primary"
      >
        List
      </button>
      <!-- <button
        (click)="onOpenEditor()"
        title="Open Editor"
        type="button"
        class="btn btn-sm btn-outline-primary"
      >
        Edit
      </button> -->
    </div>
  `,
})
export class JobActionsCellRendererComponent
  implements ICellRendererAngularComp
{
  params: any;

  @Output() showBreachList = new EventEmitter<any>();
  @Output() openEditor = new EventEmitter<any>();

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }

  onShowBreachList() {
    if (
      this.params &&
      this.params.context &&
      this.params.context.showBreachList
    ) {
      this.params.context.showBreachList(this.params.data);
    }
  }

  onOpenEditor() {
    if (this.params && this.params.context && this.params.context.openEditor) {
      this.params.context.openEditor(this.params.data);
    }
  }
}
