import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { MonacoEditorComponent } from "../monaco-editor/monaco-editor.component";
import { MonacoDiffViewerComponent } from "../monaco-diff-viewer/monaco-diff-viewer.component";
import { ConfigurationType } from "../../models/configuration-type.enum";

@Component({
  selector: "app-value-viewer",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorComponent,
    MonacoDiffViewerComponent,
  ],
  templateUrl: "./value-viewer.component.html",
  styleUrls: ["./value-viewer.component.scss"],
})
export class ValueViewerComponent implements OnInit {
  @Input() value: string = "";
  @Input() configurationType: ConfigurationType = ConfigurationType.Process;
  @Input() previousValue: string = "";
  @Input() nextValue: string = "";

  language: string = "javascript";
  viewMode: "single" | "previous" | "next" = "single";

  get hasPrevious(): boolean {
    return !!this.previousValue;
  }

  get hasNext(): boolean {
    return !!this.nextValue;
  }

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    // Set language based on configuration type
    this.language = this.getLanguageForType(this.configurationType);
  }

  private getLanguageForType(type: ConfigurationType): string {
    switch (type) {
      case ConfigurationType.Process:
        return "javascript";
      case ConfigurationType.DashboardConfig:
      case ConfigurationType.FormConfig:
      case ConfigurationType.SystemSetting:
        return "json";
      case ConfigurationType.FetchXMLQuery:
      case ConfigurationType.DashboardQuery:
        return "xml";
      default:
        return "plaintext";
    }
  }
}
