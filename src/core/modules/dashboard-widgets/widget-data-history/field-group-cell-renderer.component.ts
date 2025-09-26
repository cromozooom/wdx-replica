import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FieldIconMap } from "./widget-data-history.component";

@Component({
  selector: "app-field-group-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center gap-2 py-2">
      <span
        class="btn btn-link btn-sm ag-group-expanded"
        *ngIf="params.node.expanded"
        (click)="toggle()"
      >
        <span class="ag-icon ag-icon-tree-open" role="presentation"></span>
      </span>
      <span
        class="btn btn-link btn-sm ag-group-contracted"
        *ngIf="!params.node.expanded"
        (click)="toggle()"
      >
        <span class="ag-icon ag-icon-tree-closed" role="presentation"></span>
      </span>
      <span *ngIf="icon" class="me-2 text-muted opacity-50">
        <i [ngClass]="icon"></i>
      </span>
      <span>{{ value }}</span>
      <span *ngIf="childCount !== undefined" class="ms-2 text-secondary">
        ({{ childCount }})
      </span>
    </div>
  `,
  styles: [``],
})
export class FieldGroupCellRendererComponent {
  value: string = "";
  icon: string | undefined;
  childCount: number | undefined;
  params: any;

  agInit(params: any): void {
    this.params = params;
    this.value = params.value;
    this.icon = FieldIconMap[params.value];
    this.childCount = params.node?.allChildrenCount;
  }

  toggle() {
    this.params.node.setExpanded(!this.params.node.expanded);
  }
}
