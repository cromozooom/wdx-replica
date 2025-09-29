import { Component, Input, ContentChild, TemplateRef } from "@angular/core";

@Component({
  selector: "app-widget-layout",
  standalone: true,
  template: `
    <div class="flex-grow-1 d-flex flex-column m-2 border shadow rounded">
      <div class="p-2 border-bottom">
        <ng-container *ngIf="headerTemplate">
          <ng-container *ngTemplateOutlet="headerTemplate"></ng-container>
        </ng-container>
        <ng-content select="[widget-title]"></ng-content>
      </div>
      <div class="flex-grow-1 d-flex flex-column">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: [],
})
export class WidgetLayoutComponent {
  @ContentChild("header", { read: TemplateRef })
  headerTemplate?: TemplateRef<any>;
}
