/**
 * Template Assistant main component.
 * Container component for Intelligent Template Assistant feature.
 */

import { Component, OnInit, signal, ViewChild } from "@angular/core";
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
  templateUrl: "./template-assistant.component.html",
  styleUrls: ["./template-assistant.component.scss"],
})
export class TemplateAssistantComponent implements OnInit {
  @ViewChild("editor") editorComponent!: TemplateEditorComponent;

  openingBraces = "{{";
  // State
  currentContent = signal<string>("");
  availableFields = signal<DataField[]>([]);
  fieldSelectorVisible = signal<boolean>(false);
  fieldSelectorPosition = signal<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  pillBeingReplaced = signal<{ fieldId: string; position: number } | null>(
    null,
  );

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

  onPillTrigger(event: { position: number }): void {
    console.log("Opening field selector at position:", event.position);

    // Clear any pill being replaced (this is a new insertion)
    this.pillBeingReplaced.set(null);

    // Calculate position for field selector dropdown
    // For now, show it centered on screen
    this.fieldSelectorPosition.set({
      top: 200,
      left: 400,
    });

    this.fieldSelectorVisible.set(true);
  }

  onPillClicked(event: { fieldId: string; position: number }): void {
    console.log("Pill clicked:", event.fieldId, "at position:", event.position);

    // Store which pill is being replaced
    this.pillBeingReplaced.set(event);

    // Show field selector
    this.fieldSelectorPosition.set({
      top: 200,
      left: 400,
    });

    this.fieldSelectorVisible.set(true);
  }

  onPillInserted(field: DataField): void {
    console.log("Pill inserted:", field);
    this.closeFieldSelector();
  }

  onFieldSelected(field: DataField): void {
    console.log("TemplateAssistant: Field selected:", field);
    console.log("TemplateAssistant: Editor component:", this.editorComponent);

    const pillToReplace = this.pillBeingReplaced();

    if (this.editorComponent) {
      if (pillToReplace) {
        // Replace existing pill
        console.log(
          "TemplateAssistant: Replacing pill:",
          pillToReplace.fieldId,
          "with:",
          field.id,
        );
        this.editorComponent.replacePill(
          pillToReplace.fieldId,
          field,
          pillToReplace.position,
        );
      } else {
        // Insert new pill
        console.log("TemplateAssistant: Inserting new pill:", field.id);
        this.editorComponent.insertPill(field);
      }
      console.log("TemplateAssistant: Operation completed");
    } else {
      console.error("TemplateAssistant: Editor component not available!");
    }

    // Clear pill being replaced and close field selector
    this.pillBeingReplaced.set(null);
    this.closeFieldSelector();
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
