import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GardenRoomStore } from "../../store/garden-room.store";

/**
 * ExtractionEngineComponent - Display buy, cut, and hardware lists
 * Shows optimized material ordering and cutting guidance
 */
@Component({
  selector: "app-extraction-engine",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./extraction-engine.component.html",
  styleUrls: ["./extraction-engine.component.scss"],
})
export class ExtractionEngineComponent {
  readonly store = inject(GardenRoomStore);

  // Expose signals as component properties for template
  readonly buyList = this.store.buyList;
  readonly cutList = this.store.cutList;
  readonly hardwareList = this.store.hardwareList;
  readonly totalWasteMm = this.store.totalWasteMm;
  readonly totalMemberCount = this.store.totalMemberCount;

  /**
   * Trigger print dialog
   */
  printCutList() {
    window.print();
  }
}
