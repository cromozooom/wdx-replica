import { Component } from "@angular/core";
import { JobsGridComponent } from "../../../../app/jobs-grid/jobs-grid.component";
import { JobEditorComponent } from "./job-editor.component";
import { widgetDemoAutomations } from "./widget-automation-content.dummy-data";
import { NgbNavModule, NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { BreachListOffcanvasComponent } from "./breach-list-offcanvas.component";

@Component({
  selector: "app-widget-automation-content",
  standalone: true,
  templateUrl: "./widget-automation-content.component.html",
  styleUrls: ["./widget-automation-content.component.scss"],
  imports: [JobsGridComponent, NgbNavModule, JobEditorComponent],
})
export class WidgetAutomationContentComponent {
  jobs = widgetDemoAutomations;
  private _activeTab = 1;
  currentJob: any = null;

  constructor(private offcanvas: NgbOffcanvas) {}

  get activeTab() {
    return this._activeTab;
  }
  set activeTab(val: number) {
    this._activeTab = val;
    if (val === 1) {
      this.currentJob = null;
    }
  }

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
