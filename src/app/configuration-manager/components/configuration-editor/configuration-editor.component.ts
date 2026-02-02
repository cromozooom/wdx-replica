import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationMetadataFormComponent } from '../configuration-metadata-form/configuration-metadata-form.component';
import { JsonEditorComponent } from '../json-editor/json-editor.component';
import { AceEditorComponent } from '../ace-editor/ace-editor.component';
import {
  Configuration,
} from '../../models/configuration.model';
import {
  ConfigurationType,
  getConfigurationFormat,
} from '../../models/configuration-type.enum';
import { ConfigurationService } from '../../services/configuration.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-configuration-editor',
  standalone: true,
  imports: [
    CommonModule,
    ConfigurationMetadataFormComponent,
    JsonEditorComponent,
    AceEditorComponent,
  ],
  templateUrl: './configuration-editor.component.html',
  styleUrls: ['./configuration-editor.component.scss'],
})
export class ConfigurationEditorComponent {
  @Input() configuration?: Configuration;
  @Output() saved = new EventEmitter<Configuration>();
  @Output() cancelled = new EventEmitter<void>();

  private configService = inject(ConfigurationService);
  private notificationService = inject(NotificationService);

  metadata: Partial<Configuration> = {};
  value: string = '';
  editorFormat: 'json' | 'xml' | 'text' = 'json';
  saving = false;

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
      this.value = '{}';
      this.editorFormat = 'json';
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

  private updateEditorFormat(type: ConfigurationType): void {
    this.editorFormat = getConfigurationFormat(type);
  }

  async onSave(): Promise<void> {
    if (!this.metadata.name || !this.metadata.type || !this.metadata.version) {
      this.notificationService.error(
        'Please fill in all required metadata fields'
      );
      return;
    }

    try {
      this.saving = true;

      let savedConfig: Configuration;
      if (this.configuration) {
        // Update existing
        savedConfig = await this.configService.update(
          this.configuration.id,
          {
            ...this.metadata,
            value: this.value,
          }
        );
        this.notificationService.success('Configuration updated successfully');
      } else {
        // Create new
        savedConfig = await this.configService.create(
          this.metadata.name,
          this.metadata.type,
          this.metadata.version,
          this.value
        );
        this.notificationService.success('Configuration created successfully');
      }

      this.saved.emit(savedConfig);
    } catch (error) {
      this.notificationService.error(
        `Failed to save configuration: ${(error as Error).message}`
      );
    } finally {
      this.saving = false;
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
