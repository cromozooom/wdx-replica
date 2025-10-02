import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { buildCompareRows, CompareGridRow } from "./compare-grid.utils";

@Component({
  selector: "app-compare-grid",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./compare-grid.component.html",
  styleUrls: ["./compare-grid.component.scss"],
})
export class CompareGridComponent {
  @Input() prev: any = null;
  @Input() current: any = null;
  @Input() schema: any = null;
  @Input() prevMeta: any = null;
  @Input() currentMeta: any = null;

  get compareRows(): CompareGridRow[] {
    return buildCompareRows(this.prev, this.current, this.schema);
  }
}
