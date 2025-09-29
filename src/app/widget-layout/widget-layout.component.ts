import { Component, ContentChild, TemplateRef } from "@angular/core";

@Component({
  selector: "app-widget-layout",
  standalone: true,
  templateUrl: "./widget-layout.component.html",
  styleUrls: ["./widget-layout.component.scss"],
})
export class WidgetLayoutComponent {
  @ContentChild("header", { read: TemplateRef })
  header?: TemplateRef<any>;
}
