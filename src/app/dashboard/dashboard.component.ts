import { Component } from "@angular/core";
import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  imports: [WidgetComponent],
})
export class DashboardComponent {}
