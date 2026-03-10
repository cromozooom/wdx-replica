/**
 * Template Assistant main component.
 * Container component for Intelligent Template Assistant feature.
 */

import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TemplateEditorComponent } from "./components/template-editor/template-editor.component";
import { DataFieldSelectorComponent } from "./components/data-field-selector/data-field-selector.component";
import { DataFieldRegistryService } from "./services/data-field-registry.service";
import { TemplateStorageService } from "./services/template-storage.service";
import { DocumentTemplate, DataField } from "./models";

@Component({
  selector: "app-template-assistant",
  standalone: true,
  imports: [CommonModule, TemplateEditorComponent, DataFieldSelectorComponent],
  template: `
    <div class="template-assistant-container">
      <div class="header">
        <h1>Intelligent Template Assistant</h1>
        <p class="subtitle">Create templates with dynamic data fields</p>
      </div>

      <div class="content">
        <!-- Template Editor -->
        <div class="editor-section">
          <h2>Template Editor</h2>
          <p class="instructions">
            Type <strong>{{</strong> to insert a data field pill. Click pills to
            edit them.
          </p>

          <app-template-editor
            [content]="currentContent()"
            [availableFields]="availableFields()"
            (contentChange)="onContentChange($event)"
            (pillInserted)="onPillInserted($event)"
          />
        </div>

        <!-- Field Selector -->
        <app-data-field-selector
          [availableFields]="availableFields()"
          [visible]="fieldSelectorVisible()"
          [position]="fieldSelectorPosition()"
          (fieldSelected)="onFieldSelected($event)"
          (closed)="closeFieldSelector()"
        />

        <!-- Actions -->
        <div class="actions">
          <button class="btn btn-primary" (click)="saveTemplate()">
            Save Template
          </button>
          <button class="btn btn-secondary" (click)="clearTemplate()">
            Clear
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .template-assistant-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .header {
        margin-bottom: 2rem;

        h1 {
          color: #333;
          margin: 0 0 0.5rem 0;
          font-size: 28px;
        }

        .subtitle {
          color: #666;
          margin: 0;
          font-size: 16px;
        }
      }

      .content {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 2rem;
      }

      .editor-section {
        margin-bottom: 2rem;

        h2 {
          font-size: 20px;
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        .instructions {
          color: #666;
          font-size: 14px;
          margin: 0 0 1rem 0;
        }
      }

      .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;

        .btn {
          padding: 10px 24px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }

          &:active {
            transform: translateY(0);
          }
        }

        .btn-primary {
          background-color: #1976d2;
          color: #fff;

          &:hover {
            background-color: #1565c0;
          }
        }

        .btn-secondary {
          background-color: #f5f5f5;
          color: #333;

          &:hover {
            background-color: #e0e0e0;
          }
        }
      }
    `,
  ],
})
export class TemplateAssistantComponent implements OnInit {
  // State
  currentContent = signal<string>("");
  availableFields = signal<DataField[]>([]);
  fieldSelectorVisible = signal<boolean>(false);
  fieldSelectorPosition = signal<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  constructor(
    private fieldRegistry: DataFieldRegistryService,
    private templateStorage: TemplateStorageService,
  ) {}

  ngOnInit(): void {
    // Load available fields
    this.availableFields.set(this.fieldRegistry.getAll());

    // Load auto-saved draft if exists
    const draft = this.templateStorage.loadAutosave();
    if (draft?.content) {
      this.currentContent.set(draft.content);
    }
  }

  onContentChange(content: string): void {
    this.currentContent.set(content);

    // Auto-save draft
    this.templateStorage.autoSave({
      content,
      updatedAt: new Date().toISOString(),
    });
  }

  onPillInserted(field: DataField): void {
    console.log("Pill inserted:", field);
    this.closeFieldSelector();
  }

  onFieldSelected(field: DataField): void {
    console.log("Field selected:", field);
    // Insert pill into editor
    // This will be handled by editor component
  }

  closeFieldSelector(): void {
    this.fieldSelectorVisible.set(false);
  }

  saveTemplate(): void {
    const template: DocumentTemplate = {
      id: crypto.randomUUID(),
      name: `Template ${new Date().toLocaleString()}`,
      content: this.currentContent(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    this.templateStorage.save(template);
    this.templateStorage.clearAutosave();

    alert("Template saved successfully!");
  }

  clearTemplate(): void {
    if (confirm("Are you sure you want to clear the template?")) {
      this.currentContent.set("");
      this.templateStorage.clearAutosave();
    }
  }
}
