import { Component } from "@angular/core";
import { JobsGridComponent } from "../jobs-grid/jobs-grid.component";
import { widgetDemoAutomations } from "./widget-automation-content.dummy-data";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-widget-automation-content",
  standalone: true,
  templateUrl: "./widget-automation-content.component.html",
  styleUrls: ["./widget-automation-content.component.scss"],
  imports: [JobsGridComponent, NgbNavModule],
})
export class WidgetAutomationContentComponent {
  jobs = widgetDemoAutomations;
  activeTab = 1;
}
