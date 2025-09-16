import { Component } from "@angular/core";
import { JobsGridComponent } from "../jobs-grid/jobs-grid.component";
import { widgetDemoAutomations } from "./widget-automation-content.dummy-data";

@Component({
  selector: "app-widget-automation-content",
  standalone: true,
  templateUrl: "./widget-automation-content.component.html",
  styleUrls: [],
  imports: [JobsGridComponent],
})
export class WidgetAutomationContentComponent {
  jobs = widgetDemoAutomations;
}
