import { Component } from "@angular/core";
import { JobsGridComponent } from "../jobs-grid/jobs-grid.component";
import { widgetDemoAutomations } from "./widget-automation-content.dummy-data";
import { NgbNavModule, NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { BreachListOffcanvasComponent } from "./breach-list-offcanvas.component";

@Component({
  selector: "app-widget-automation-content",
  standalone: true,
  templateUrl: "./widget-automation-content.component.html",
  styleUrls: ["./widget-automation-content.component.scss"],
  imports: [JobsGridComponent, NgbNavModule, BreachListOffcanvasComponent],
})
export class WidgetAutomationContentComponent {
  jobs = widgetDemoAutomations;
  activeTab = 1;

  constructor(private offcanvas: NgbOffcanvas) {}

  showBreachList = (job: any) => {
    console.log("showBreachList called", job);
    if (job && job.breachList) {
      const ref = this.offcanvas.open(BreachListOffcanvasComponent, {
        position: "end",
        panelClass: "offcanvas-width-md",
      });
      (ref.componentInstance as any).breachList = job.breachList;
    }
  };
  // Editor tab logic will be added in the next step
}
