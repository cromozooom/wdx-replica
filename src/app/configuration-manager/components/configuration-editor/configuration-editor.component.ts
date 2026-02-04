import { Component, Input, Output, EventEmitter, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbNavModule, NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ConfigurationMetadataFormComponent } from "../configuration-metadata-form/configuration-metadata-form.component";
import { JsonEditorComponent } from "../json-editor/json-editor.component";
import { AceEditorComponent } from "../ace-editor/ace-editor.component";
import { UpdateHistoryComponent } from "../update-history/update-history.component";
import { Configuration } from "../../models/configuration.model";
import { UpdateEntry } from "../../models/update-entry.model";
import {
  ConfigurationType,
  getConfigurationFormat,
} from "../../models/configuration-type.enum";
import { ConfigurationService } from "../../services/configuration.service";
import { NotificationService } from "../../services/notification.service";

@Component({
  selector: "app-configuration-editor",
  standalone: true,
  imports: [
    CommonModule,
    NgbNavModule,
    ConfigurationMetadataFormComponent,
    JsonEditorComponent,
    AceEditorComponent,
    UpdateHistoryComponent,
  ],
  templateUrl: "./configuration-editor.component.html",
  styleUrls: ["./configuration-editor.component.scss"],
})
export class ConfigurationEditorComponent {
  @Input() configuration?: Configuration;
  @Input() basketId!: number; // Required for creating new configurations
  @Output() saved = new EventEmitter<Configuration>();
  @Output() cancelled = new EventEmitter<void>();

  modal = inject(NgbActiveModal);
  private configService = inject(ConfigurationService);
  private notificationService = inject(NotificationService);

  metadata: Partial<Configuration> = {};
  value: string = "";
  updateEntries: UpdateEntry[] = [];
  editorFormat: "json" | "xml" | "text" = "json";
  saving = false;

  // Get current working configuration with merged changes
  get currentConfiguration(): Configuration | undefined {
    if (!this.configuration) return undefined;
    return {
      ...this.configuration,
      ...this.metadata,
      value: this.value,
    };
  }

  ngOnInit(): void {
    if (this.configuration) {
      this.metadata = {
        name: this.configuration.name,
        type: this.configuration.type,
        version: this.configuration.version,
      };
      this.value = this.configuration.value;
      this.updateEditorFormat(this.configuration.type);
    } else {
      this.value = "{}";
      this.editorFormat = "json";
    }
  }

  onMetadataChange(metadata: Partial<Configuration>): void {
    this.metadata = metadata;
    if (metadata.type) {
      this.updateEditorFormat(metadata.type);
    }
  }

  onValueChange(value: string): void {
    this.value = value;
  }

  onUpdateEntriesChange(entries: UpdateEntry[]): void {
    this.updateEntries = entries;
  }

  getTotalUpdateCount(): number {
    const existingCount = this.configuration?.updates?.length || 0;
    const newCount = this.updateEntries.length;
    return existingCount + newCount;
  }

  private updateEditorFormat(type: ConfigurationType): void {
    this.editorFormat = getConfigurationFormat(type);
  }

  async onSave(): Promise<void> {
    if (!this.metadata.name || !this.metadata.type || !this.metadata.version) {
      this.notificationService.error(
        "Please fill in all required metadata fields",
      );
      return;
    }

    // If editing, require at least one valid update entry
    if (this.configuration && this.updateEntries.length === 0) {
      this.notificationService.error(
        "Please add at least one update entry to document this change",
      );
      return;
    }

    try {
      this.saving = true;

      let savedConfig: Configuration;
      if (this.configuration) {
        // Update existing with multiple update entries
        savedConfig = await this.configService.updateWithMultipleEntries(
          this.configuration.basketId,
          this.configuration.id,
          {
            ...this.metadata,
            value: this.value,
          },
          this.updateEntries,
        );
        this.notificationService.success("Configuration updated successfully");
      } else {
        // Create new
        savedConfig = await this.configService.create(
          this.basketId,
          this.metadata.name,
          this.metadata.type,
          this.metadata.version,
          this.value,
        );
        this.notificationService.success("Configuration created successfully");
      }

      this.saved.emit(savedConfig);
      this.modal.close(savedConfig);
    } catch (error) {
      this.notificationService.error(
        `Failed to save configuration: ${(error as Error).message}`,
      );
    } finally {
      this.saving = false;
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.modal.dismiss();
  }
}
