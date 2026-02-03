import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MarkdownModule } from "ngx-markdown";
import { NgbAccordionModule } from "@ng-bootstrap/ng-bootstrap";
import { UpdateEntry } from "../../models/update-entry.model";
import { MonacoDiffViewerComponent } from "../monaco-diff-viewer/monaco-diff-viewer.component";
import { ConfigurationType } from "../../models/configuration-type.enum";

@Component({
  selector: "app-update-history",
  standalone: true,
  imports: [
    CommonModule,
    MarkdownModule,
    NgbAccordionModule,
    MonacoDiffViewerComponent,
  ],
  templateUrl: "./update-history.component.html",
  styleUrls: ["./update-history.component.scss"],
})
export class UpdateHistoryComponent {
  @Input() updates: UpdateEntry[] = [];
  @Input() configurationType?: ConfigurationType;
  @Input() currentValue?: string;

  get sortedUpdates(): UpdateEntry[] {
    return [...this.updates].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getMonacoLanguage(type?: ConfigurationType): string {
    if (!type) return "plaintext";
    switch (type) {
      case ConfigurationType.DashboardConfig:
      case ConfigurationType.FormConfig:
      case ConfigurationType.SystemSetting:
        return "json";
      case ConfigurationType.FetchXMLQuery:
      case ConfigurationType.DashboardQuery:
        return "xml";
      case ConfigurationType.Process:
        return "javascript";
      default:
        return "plaintext";
    }
  }

  getNextValue(index: number): string {
    if (index === 0 && this.currentValue) {
      return this.currentValue;
    }
    const nextUpdate = this.sortedUpdates[index - 1];
    return nextUpdate?.previousValue || "";
  }
}
