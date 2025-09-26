import { Component } from "@angular/core";
import { FieldTypeIcon, FieldIconMap } from "./widget-data-history.component";

import { CommonModule } from "@angular/common";

@Component({
  selector: "app-field-icon-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span *ngIf="icon" class="me-3 text-muted opacity-50">
      <i [ngClass]="icon"></i>
    </span>
    <span>{{ params.value }}</span>
  `,
  styles: [``],
})
export class FieldIconCellRendererComponent {
  params: any;
  icon: string | undefined;

  agInit(params: any): void {
    this.params = params;
    this.icon = FieldIconMap[params.value as FieldTypeIcon];
  }
}
