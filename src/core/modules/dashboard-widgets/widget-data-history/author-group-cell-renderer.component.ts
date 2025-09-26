import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FieldIconMap } from "./widget-data-history.component";

@Component({
  selector: "app-author-group-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center gap-2 py-2">
      <ng-container *ngIf="isFieldGroup; else authorTpl">
        <span *ngIf="icon" class="me-2 text-muted opacity-50">
          <i [ngClass]="icon"></i>
        </span>
        <span>{{ params.value }}</span>
        <span *ngIf="childCount !== undefined" class="ms-2 text-secondary">
          ({{ childCount }})
        </span>
      </ng-container>
      <ng-template #authorTpl>
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
        <span
          class="rounded rounded-circle p-2"
          [ngStyle]="{
            'background-color': 'var(--' + colorIndex + ')',
            color: 'var(--ink-' + colorIndex + ')',
          }"
        >
          {{ initials }}
        </span>
        <span>{{ params.value }}</span>
        <span *ngIf="childCount !== undefined" class="ms-2 text-secondary">
          ({{ childCount }})
        </span>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .rounded-circle {
        width: 2.2rem;
        height: 2.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class AuthorGroupCellRendererComponent {
  params: any;
  initials = "";
  colorIndex: number = 0;
  icon: string | undefined;
  isFieldGroup = false;
  childCount: number | undefined;

  agInit(params: any): void {
    this.params = params;
    this.childCount = params.node?.allChildrenCount;
    // Detect if this is a Field group row (for fieldDisplayName)
    if (params.node?.field === "fieldDisplayName") {
      this.isFieldGroup = true;
      this.icon = FieldIconMap[params.value];
    } else {
      this.isFieldGroup = false;
      const name = params.value || "";
      this.initials = this.getInitials(name);
      this.colorIndex = this.getColorIndex(name);
    }
  }

  getInitials(name: string): string {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getColorIndex(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return 1 + (Math.abs(hash) % 68);
  }
  toggle() {
    this.params.node.setExpanded(!this.params.node.expanded);
  }
}
