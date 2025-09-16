import { Component } from "@angular/core";
import { WidgetDefaultContentComponent } from "../widget-default-content/widget-default-content.component";
import { WidgetAutomationContentComponent } from "../widget-automation-content/widget-automation-content.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-widget",
  standalone: true,
  templateUrl: "./widget.component.html",
  styleUrls: ["./widget.component.scss"],
  imports: [
    CommonModule,
    WidgetDefaultContentComponent,
    WidgetAutomationContentComponent,
  ],
})
export class WidgetComponent {
  showAutomationContent = false;
  toggleContent() {
    this.showAutomationContent = !this.showAutomationContent;
  }
}
