import { Component, Input } from "@angular/core";
import { WidgetDefaultContentComponent } from "../widget-default-content/widget-default-content.component";
import { WidgetAutomationContentComponent } from "../widget-automation-content/widget-automation-content.component";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

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
  @Input() type: "default" | "automation" = "default";
}
