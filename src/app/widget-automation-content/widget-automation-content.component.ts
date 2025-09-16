import { Component } from "@angular/core";
import { JobsGridComponent } from "../jobs-grid/jobs-grid.component";
import { JobEditorComponent } from "./job-editor.component";
import { widgetDemoAutomations } from "./widget-automation-content.dummy-data";
import { NgbNavModule, NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { BreachListOffcanvasComponent } from "./breach-list-offcanvas.component";

@Component({
  selector: "app-widget-automation-content",
  standalone: true,
  templateUrl: "./widget-automation-content.component.html",
  styleUrls: ["./widget-automation-content.component.scss"],
  imports: [
    JobsGridComponent,
    NgbNavModule,
    BreachListOffcanvasComponent,
    JobEditorComponent,
  ],
})
export class WidgetAutomationContentComponent {
  jobs = widgetDemoAutomations;
  activeTab = 1;
  currentJob: any = null;

  constructor(private offcanvas: NgbOffcanvas) {}

  showBreachList = (job: any) => {
    if (job && job.breachList) {
      const ref = this.offcanvas.open(BreachListOffcanvasComponent, {
        position: "end",
        panelClass: "offcanvas-width-md",
      });
      (ref.componentInstance as any).breachList = job.breachList;
    }
  };

  editJob = (jobName: string, jobData: any) => {
    // Find the job by name and set as current, then switch to Editor tab
    this.currentJob = jobData;
    this.activeTab = 2;
  };
}
