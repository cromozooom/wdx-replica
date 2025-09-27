import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-history-visualisation-data",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./history-visualisation-data.component.html",
  styleUrls: ["./history-visualisation-data.component.scss"],
})
export class HistoryVisualisationDataComponent {
  @Input() data: any[] = [];
  @Input() timeframe: string = "daily";
  @Input() selectedDay: string | null = null;
  @Input() currentDate: Date = new Date();
  // Add more @Input()s as needed for D3 rendering
}
