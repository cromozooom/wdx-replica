import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SpxMagicSelectorComponent } from "../spx-magic-selector.component";
import { SelectionChangeEvent } from "../../models/selection-change-event.interface";
import { SavedSelection } from "../../models/saved-selection.interface";

/**
 * Modal for adding a new selection
 */
@Component({
  selector: "app-add-selection-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, SpxMagicSelectorComponent],
  templateUrl: "./add-selection-modal.component.html",
  styleUrls: ["./add-selection-modal.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSelectionModalComponent {
  selectedDomain = "crm-scheduling";
  selectionName = "";
  lastEvent: SelectionChangeEvent | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
  ) {}

  onDomainChange(): void {
    // Reset selection when domain changes
    this.lastEvent = null;
    this.cdr.markForCheck();
  }

  onSelectionChange(event: SelectionChangeEvent): void {
    this.lastEvent = event;
    this.cdr.markForCheck();
  }

  canSave(): boolean {
    return (
      this.selectionName.trim() !== "" &&
      this.lastEvent !== null &&
      this.lastEvent.selectedItem !== null &&
      this.lastEvent.selectedQuery !== null
    );
  }

  save(): void {
    if (!this.canSave() || !this.lastEvent) return;

    const selection: SavedSelection = {
      id: this.generateId(),
      name: this.selectionName.trim(),
      domainId: this.selectedDomain,
      domainName: this.getDomainName(this.selectedDomain),
      itemName: this.lastEvent.selectedItem!.name,
      itemType: this.lastEvent.selectedItem!.type,
      entityName: this.lastEvent.selectedItem!.entityName,
      queryName: this.lastEvent.selectedQuery!.name,
      queryDescription: this.lastEvent.selectedQuery!.description || "",
      estimatedRecords: this.lastEvent.selectedQuery!.estimatedCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      selectionData: {
        itemId: this.lastEvent.selectedItem!.id,
        queryId: this.lastEvent.selectedQuery!.id,
        source: this.lastEvent.source,
      },
    };

    this.activeModal.close(selection);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  private generateId(): string {
    return `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDomainName(domainId: string): string {
    const domainNames: Record<string, string> = {
      "crm-scheduling": "CRM & Scheduling",
      "document-management": "Document Management",
    };
    return domainNames[domainId] || domainId;
  }
}
