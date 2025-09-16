import { Component } from "@angular/core";
import { WidgetDefaultContentComponent } from "../widget-default-content/widget-default-content.component";

@Component({
  selector: "app-widget",
  standalone: true,
  templateUrl: "./widget.component.html",
  styleUrls: ["./widget.component.scss"],
  imports: [WidgetDefaultContentComponent],
})
export class WidgetComponent {}
