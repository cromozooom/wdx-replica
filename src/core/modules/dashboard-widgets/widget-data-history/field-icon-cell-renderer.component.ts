import { Component } from "@angular/core";
import { FieldTypeIcon, FieldIconMap } from "./field-icons";

import { CommonModule } from "@angular/common";

@Component({
  selector: "app-field-icon-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span *ngIf="icon" class="me-3 text-muted opacity-50">
      <i [ngClass]="icon"></i>
    </span>
    <span>{{ value }}</span>
  `,
  styles: [``],
})
export class FieldIconCellRendererComponent {
  params: any;
  icon: string | undefined;
  value: string = "";

  agInit(params: any): void {
    // ag-Grid passes either a params object or just the value for innerRenderer
    if (typeof params === "string") {
      this.value = params;
      this.icon = FieldIconMap[params as FieldTypeIcon];
      this.params = { value: params };
    } else {
      this.params = params;
      this.value = params.value;
      this.icon = FieldIconMap[params.value as FieldTypeIcon];
    }
  }
}
