import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DataField } from "../../models";

@Component({
  selector: "app-data-field-selector",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./data-field-selector.component.html",
  styleUrls: ["./data-field-selector.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataFieldSelectorComponent {
  @Input() set availableFields(fields: DataField[]) {
    this.allFields.set(fields);
  }

  @Input() visible = false;
  @Input() position: { top: number; left: number } = { top: 0, left: 0 };

  @Output() fieldSelected = new EventEmitter<DataField>();
  @Output() closed = new EventEmitter<void>();

  allFields = signal<DataField[]>([]);
  searchQuery = signal<string>("");

  /**
   * Filtered fields based on search query.
   */
  filteredFields = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.allFields();
    }

    return this.allFields().filter(
      (field) =>
        field.label.toLowerCase().includes(query) ||
        field.id.toLowerCase().includes(query) ||
        field.description?.toLowerCase().includes(query),
    );
  });

  /**
   * Fields grouped by category.
   */
  groupedFields = computed(() => {
    const fields = this.filteredFields();
    const groups: Record<string, DataField[]> = {
      personal: [],
      account: [],
      address: [],
      other: [],
    };

    fields.forEach((field) => {
      const category = field.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(field);
    });

    return groups;
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  selectField(field: DataField): void {
    console.log("DataFieldSelector: Field clicked:", field);
    this.fieldSelected.emit(field);
    this.searchQuery.set("");
    console.log("DataFieldSelector: Field selection event emitted");
  }

  close(): void {
    this.closed.emit();
    this.searchQuery.set("");
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      personal: "Personal Information",
      account: "Account Information",
      address: "Address",
      other: "Other",
    };
    return labels[category] || category;
  }
}
