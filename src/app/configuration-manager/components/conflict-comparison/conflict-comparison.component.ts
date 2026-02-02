import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConflictDetection } from "../../services/configuration-import.service";

@Component({
  selector: "app-conflict-comparison",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./conflict-comparison.component.html",
  styleUrl: "./conflict-comparison.component.scss",
})
export class ConflictComparisonComponent {
  @Input() conflict!: ConflictDetection;
  @Output() resolveConflict = new EventEmitter<
    "overwrite" | "keep" | "import-as-new"
  >();

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
   * Truncate long content for preview
   */
  truncateContent(content: string, maxLength: number = 500): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + "\n...(truncated)";
  }

  /**
   * Emit resolution decision
   */
  onResolve(strategy: "overwrite" | "keep" | "import-as-new") {
    this.resolveConflict.emit(strategy);
  }
}
