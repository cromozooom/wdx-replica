import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import { StatusOption } from "../../models/status-option.interface";

/**
 * Custom cell renderer for ng-select dropdown component within ag-Grid cells.
 * Demonstrates dropdown behavior in constrained horizontal space.
 */
@Component({
  selector: "app-ng-select-cell-renderer",
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: "./ng-select-cell-renderer.component.html",
  styleUrls: ["./ng-select-cell-renderer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgSelectCellRendererComponent implements ICellRendererAngularComp {
  /** Current cell value */
  value: string = "";

  /** ag-Grid cell renderer parameters */
  params!: ICellRendererParams;

  /** Available status options for the dropdown */
  statusOptions: StatusOption[] = [
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "inactive", label: "Inactive" },
    { id: "suspended", label: "Suspended" },
    { id: "archived", label: "Archived" },
    {
      id: "lorem",
      label:
        "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    },
  ];

  /**
   * ag-Grid lifecycle method - initialize with cell parameters.
   * Called when the cell renderer is created.
   *
   * @param params - Cell renderer parameters from ag-Grid
   */
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.value = params.value || "";
  }

  /**
   * ag-Grid lifecycle method - refresh cell value.
   * Called when the cell value changes.
   *
   * @param params - Updated cell renderer parameters
   * @returns true if refresh successful, false to destroy and recreate
   */
  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.value = params.value || "";
    return true;
  }

  /**
   * Handle ng-select value change event.
   * Updates the cell value in ag-Grid's data model.
   *
   * @param newValue - Newly selected status value
   */
  onSelectionChange(newValue: string): void {
    if (this.params && this.params.setValue) {
      this.params.setValue(newValue);
    }
  }
}
