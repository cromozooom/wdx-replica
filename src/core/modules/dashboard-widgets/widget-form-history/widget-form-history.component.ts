import { Component } from "@angular/core";
import { NgbNavModule } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-widget-form-history",
  templateUrl: "./widget-form-history.component.html",
  styleUrls: ["./widget-form-history.component.scss"],
  standalone: true,
  imports: [NgbNavModule],
})
export class WidgetFormHistoryComponent {
  active = 1;
  // Add your logic here
}
