import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConflictDetection } from "../../services/configuration-import.service";
import { MonacoDiffViewerComponent } from "../monaco-diff-viewer/monaco-diff-viewer.component";
import { ConfigurationType } from "../../models/configuration-type.enum";
import { A11yModule } from "@angular/cdk/a11y";

@Component({
  selector: "app-conflict-comparison",
  standalone: true,
  imports: [CommonModule, MonacoDiffViewerComponent, A11yModule],
  templateUrl: "./conflict-comparison.component.html",
  styleUrl: "./conflict-comparison.component.scss",
})
export class ConflictComparisonComponent {
  @Input() conflict!: ConflictDetection;
  @Input() allConflicts: ConflictDetection[] = [];
  @Input() currentIndex: number = 0;
  @Input() selectedStrategy?: "overwrite" | "keep" | "import-as-new";

  @Output() resolveConflict = new EventEmitter<
    "overwrite" | "keep" | "import-as-new"
  >();
  @Output() closeModal = new EventEmitter<void>();
  @Output() navigateToConflict = new EventEmitter<number>();

  /**
   * Check if there is a previous conflict
   */
  get hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if there is a next conflict
   */
  get hasNext(): boolean {
    return this.currentIndex < this.allConflicts.length - 1;
  }

  /**
   * Navigate to previous conflict
   */
  onPrevious(): void {
    if (this.hasPrevious) {
      this.navigateToConflict.emit(this.currentIndex - 1);
    }
  }

  /**
   * Navigate to next conflict
   */
  onNext(): void {
    if (this.hasNext) {
      this.navigateToConflict.emit(this.currentIndex + 1);
    }
  }

  /**
   * Get list of metadata changes
   */
  getMetadataChanges(): Array<{
    field: string;
    existing: string;
    imported: string;
  }> {
    const changes: Array<{
      field: string;
      existing: string;
      imported: string;
    }> = [];

    if (this.conflict.differences.metadata.name) {
      changes.push({
        field: "Name",
        existing: this.conflict.differences.metadata.name.existing,
        imported: this.conflict.differences.metadata.name.imported,
      });
    }

    if (this.conflict.differences.metadata.version) {
      changes.push({
        field: "Version",
        existing: this.conflict.differences.metadata.version.existing,
        imported: this.conflict.differences.metadata.version.imported,
      });
    }

    if (this.conflict.differences.metadata.type) {
      changes.push({
        field: "Type",
        existing: this.conflict.differences.metadata.type.existing,
        imported: this.conflict.differences.metadata.type.imported,
      });
    }

    return changes;
  }

  /**
   * Get formatted content for display
   */
  getFormattedContent(content: string): string {
    try {
      // Try to pretty-print JSON
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Return as-is if not JSON
      return content;
    }
  }

  /**
   * Emit resolution decision
   */
  onResolve(strategy: "overwrite" | "keep" | "import-as-new") {
    this.resolveConflict.emit(strategy);
  }

  /**
   * Close the modal
   */
  onClose() {
    this.closeModal.emit();
  }

  /**
   * Get Monaco editor language based on configuration type
   */
  getMonacoLanguage(type: string): string {
    if (
      type === ConfigurationType.DashboardConfig ||
      type === ConfigurationType.FormConfig ||
      type === ConfigurationType.SystemSetting
    ) {
      return "json";
    }

    if (
      type === ConfigurationType.FetchXMLQuery ||
      type === ConfigurationType.DashboardQuery
    ) {
      return "xml";
    }

    if (type === ConfigurationType.Process) {
      return "javascript";
    }

    return "plaintext";
  }
}
