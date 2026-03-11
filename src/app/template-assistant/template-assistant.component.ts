/**
 * Template Assistant main component.
 * Container component for Intelligent Template Assistant feature.
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  effect,
  ElementRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TemplateEditorComponent } from "./components/template-editor/template-editor.component";
import { DataFieldSelectorComponent } from "./components/data-field-selector/data-field-selector.component";
import { TemplatePreviewComponent } from "./components/template-preview/template-preview.component";
import { DataFieldRegistryService } from "./services/data-field-registry.service";
import { TemplateStorageService } from "./services/template-storage.service";
import { DocumentTemplate, DataField } from "./models";

const SCROLL_SYNC_STORAGE_KEY = "wdx-scroll-sync-enabled";

@Component({
  selector: "app-template-assistant",
  standalone: true,
  imports: [
    CommonModule,
    TemplateEditorComponent,
    DataFieldSelectorComponent,
    TemplatePreviewComponent,
  ],
  templateUrl: "./template-assistant.component.html",
  styleUrls: ["./template-assistant.component.scss"],
})
export class TemplateAssistantComponent implements OnInit, OnDestroy {
  @ViewChild("editor") editorComponent!: TemplateEditorComponent;
  @ViewChild("fileUpload") fileUploadInput!: ElementRef<HTMLInputElement>;

  openingBraces = "{{";
  // State
  currentContent = signal<string>("");
  availableFields = signal<DataField[]>([]);
  scrollSyncEnabled = signal<boolean>(false);
  private isScrolling = false;
  private editorScrollEl: HTMLElement | null = null;
  private previewScrollEl: HTMLElement | null = null;
  private mdPreviewScrollEl: HTMLElement | null = null;
  private htmlPreviewScrollEl: HTMLElement | null = null;
  fieldSelectorVisible = signal<boolean>(false);
  fieldSelectorPosition = signal<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  pillBeingReplaced = signal<{ fieldId: string; position: number } | null>(
    null,
  );
  pillInsertPosition = signal<number | null>(null);

  // Template selection
  savedTemplates = signal<DocumentTemplate[]>([]);
  selectedTemplateId = signal<string | null>(null);

  constructor(
    private fieldRegistry: DataFieldRegistryService,
    private templateStorage: TemplateStorageService,
  ) {
    // Reactively update available fields when registry loads them
    effect(() => {
      const fields = this.fieldRegistry.fields$();
      if (fields.length > 0) {
        this.availableFields.set(fields);
      }
    });
  }

  ngOnInit(): void {
    // Load scroll sync preference from localStorage
    this.loadScrollSyncPreference();

    // Load all saved templates
    this.loadSavedTemplates();

    // Load auto-saved draft if exists
    const draft = this.templateStorage.loadAutosave();
    if (draft?.content) {
      this.currentContent.set(draft.content);
    }

    // Set up scroll sync after view init if enabled
    // Increased timeout to ensure child components are fully rendered
    setTimeout(() => this.setupScrollSync(), 500);
  }

  ngOnDestroy(): void {
    this.removeScrollListeners();
  }

  toggleScrollSync(): void {
    this.scrollSyncEnabled.update((enabled) => !enabled);

    // Save preference to localStorage
    this.saveScrollSyncPreference();

    if (this.scrollSyncEnabled()) {
      this.setupScrollSync();
    } else {
      this.removeScrollListeners();
    }
  }

  /**
   * Re-trigger scroll sync setup when tabs change.
   * This ensures the new tab's scroll container is properly synced.
   */
  onTabChange(): void {
    if (this.scrollSyncEnabled()) {
      console.log("Tab changed, re-triggering scroll sync...");
      setTimeout(() => {
        this.setupScrollSync();
      }, 200);
    }
  }

  /**
   * Load scroll sync preference from localStorage.
   */
  private loadScrollSyncPreference(): void {
    try {
      const stored = localStorage.getItem(SCROLL_SYNC_STORAGE_KEY);
      if (stored !== null) {
        const enabled = stored === "true";
        this.scrollSyncEnabled.set(enabled);
        console.log("Scroll sync preference loaded:", enabled);
      }
    } catch (error) {
      console.error("Failed to load scroll sync preference:", error);
    }
  }

  /**
   * Save scroll sync preference to localStorage.
   */
  private saveScrollSyncPreference(): void {
    try {
      localStorage.setItem(
        SCROLL_SYNC_STORAGE_KEY,
        String(this.scrollSyncEnabled()),
      );
      console.log("Scroll sync preference saved:", this.scrollSyncEnabled());
    } catch (error) {
      console.error("Failed to save scroll sync preference:", error);
    }
  }

  private setupScrollSync(): void {
    if (!this.scrollSyncEnabled()) {
      console.log("Scroll sync is disabled, skipping setup");
      return;
    }

    console.log("Setting up scroll sync...");

    // Query for scroll containers in child components
    // Using a slight delay to ensure DOM is ready
    setTimeout(() => {
      const editorContainer = document.querySelector(
        "[data-scroll-editor]",
      ) as HTMLElement;
      const previewContainer = document.querySelector(
        "[data-scroll-preview]",
      ) as HTMLElement;
      const mdPreviewContainer = document.querySelector(
        "[data-scroll-md-preview]",
      ) as HTMLElement;
      const htmlPreviewContainer = document.querySelector(
        "[data-scroll-html-preview]",
      ) as HTMLElement;

      if (!editorContainer) {
        console.warn("Editor container not found, retrying in 500ms...");
        console.log("Editor container:", editorContainer);

        // Retry once more with longer delay
        setTimeout(() => {
          this.setupScrollSync();
        }, 500);
        return;
      }

      console.log("Editor container found");
      console.log("Preview containers:", {
        html: !!previewContainer,
        markdown: !!mdPreviewContainer,
        htmlWithVariables: !!htmlPreviewContainer,
      });

      this.editorScrollEl = editorContainer;
      this.previewScrollEl = previewContainer;
      this.mdPreviewScrollEl = mdPreviewContainer;
      this.htmlPreviewScrollEl = htmlPreviewContainer;

      // Remove existing listeners first
      this.removeScrollListeners();

      // Add scroll listeners for editor
      if (this.editorScrollEl) {
        this.editorScrollEl.addEventListener("scroll", this.onEditorScroll);
      }

      // Add scroll listeners for all preview containers
      if (this.previewScrollEl) {
        this.previewScrollEl.addEventListener("scroll", this.onPreviewScroll);
      }
      if (this.mdPreviewScrollEl) {
        this.mdPreviewScrollEl.addEventListener(
          "scroll",
          this.onMdPreviewScroll,
        );
      }
      if (this.htmlPreviewScrollEl) {
        this.htmlPreviewScrollEl.addEventListener(
          "scroll",
          this.onHtmlPreviewScroll,
        );
      }

      console.log("Scroll sync successfully enabled");
    }, 100);
  }

  private removeScrollListeners(): void {
    if (this.editorScrollEl) {
      this.editorScrollEl.removeEventListener("scroll", this.onEditorScroll);
    }
    if (this.previewScrollEl) {
      this.previewScrollEl.removeEventListener("scroll", this.onPreviewScroll);
    }
    if (this.mdPreviewScrollEl) {
      this.mdPreviewScrollEl.removeEventListener(
        "scroll",
        this.onMdPreviewScroll,
      );
    }
    if (this.htmlPreviewScrollEl) {
      this.htmlPreviewScrollEl.removeEventListener(
        "scroll",
        this.onHtmlPreviewScroll,
      );
    }
  }

  private onEditorScroll = (): void => {
    if (this.isScrolling || !this.scrollSyncEnabled() || !this.editorScrollEl) {
      return;
    }

    this.isScrolling = true;
    const scrollPercentage =
      this.editorScrollEl.scrollTop /
      (this.editorScrollEl.scrollHeight - this.editorScrollEl.clientHeight);

    // Sync with all preview containers that are currently visible
    [this.previewScrollEl, this.mdPreviewScrollEl, this.htmlPreviewScrollEl]
      .filter((el) => el && this.isElementVisible(el))
      .forEach((previewEl) => {
        if (previewEl) {
          previewEl.scrollTop =
            scrollPercentage *
            (previewEl.scrollHeight - previewEl.clientHeight);
        }
      });

    setTimeout(() => {
      this.isScrolling = false;
    }, 50);
  };

  private onPreviewScroll = (): void => {
    this.syncPreviewToEditor(this.previewScrollEl);
  };

  private onMdPreviewScroll = (): void => {
    this.syncPreviewToEditor(this.mdPreviewScrollEl);
  };

  private onHtmlPreviewScroll = (): void => {
    this.syncPreviewToEditor(this.htmlPreviewScrollEl);
  };

  private syncPreviewToEditor(previewEl: HTMLElement | null): void {
    if (
      this.isScrolling ||
      !this.scrollSyncEnabled() ||
      !this.editorScrollEl ||
      !previewEl
    ) {
      return;
    }

    this.isScrolling = true;
    const scrollPercentage =
      previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight);
    this.editorScrollEl.scrollTop =
      scrollPercentage *
      (this.editorScrollEl.scrollHeight - this.editorScrollEl.clientHeight);

    setTimeout(() => {
      this.isScrolling = false;
    }, 50);
  }

  /**
   * Check if an element is currently visible in the DOM
   */
  private isElementVisible(element: HTMLElement): boolean {
    return !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    );
  }

  async loadSavedTemplates(): Promise<void> {
    const templates = await this.templateStorage.loadAll();
    this.savedTemplates.set(templates);
  }

  async loadTemplate(templateId: string): Promise<void> {
    const template = await this.templateStorage.load(templateId);
    if (template) {
      this.currentContent.set(template.content);
      this.selectedTemplateId.set(templateId);
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    if (confirm("Are you sure you want to delete this template?")) {
      await this.templateStorage.delete(templateId);
      await this.loadSavedTemplates();
      if (this.selectedTemplateId() === templateId) {
        this.selectedTemplateId.set(null);
        this.currentContent.set("");
      }
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

    // Store the insertion position
    this.pillInsertPosition.set(event.position);

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

    // Clear insert position (this is a replacement, not a new insert)
    this.pillInsertPosition.set(null);

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
        // Insert new pill at stored position
        const position = this.pillInsertPosition();
        console.log(
          "TemplateAssistant: Inserting new pill at position:",
          position,
          "field:",
          field.id,
        );
        this.editorComponent.insertPill(field, position);
      }
      console.log("TemplateAssistant: Operation completed");
    } else {
      console.error("TemplateAssistant: Editor component not available!");
    }

    // Clear pill being replaced and insert position, then close field selector
    this.pillBeingReplaced.set(null);
    this.pillInsertPosition.set(null);
    this.closeFieldSelector();
  }

  closeFieldSelector(): void {
    this.fieldSelectorVisible.set(false);
    this.pillBeingReplaced.set(null);
    this.pillInsertPosition.set(null);
  }

  async saveTemplate(): Promise<void> {
    const selectedId = this.selectedTemplateId();
    const templateName = prompt(
      "Enter template name:",
      selectedId
        ? this.savedTemplates().find((t) => t.id === selectedId)?.name
        : `Template ${new Date().toLocaleDateString()}`,
    );

    if (!templateName) {
      return; // User cancelled
    }

    const template: DocumentTemplate = {
      id: selectedId || crypto.randomUUID(),
      name: templateName,
      content: this.currentContent(),
      createdAt: selectedId
        ? this.savedTemplates().find((t) => t.id === selectedId)?.createdAt ||
          new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await this.templateStorage.save(template);
    this.templateStorage.clearAutosave();
    await this.loadSavedTemplates();
    this.selectedTemplateId.set(template.id);

    alert(`Template "${templateName}" saved successfully!`);
  }

  clearTemplate(): void {
    if (confirm("Are you sure you want to clear the template?")) {
      this.currentContent.set("");
      this.selectedTemplateId.set(null);
      this.templateStorage.clearAutosave();
    }
  }

  downloadTemplate(): void {
    const selectedId = this.selectedTemplateId();
    const template: DocumentTemplate = {
      id: selectedId || crypto.randomUUID(),
      name: selectedId
        ? this.savedTemplates().find((t) => t.id === selectedId)?.name ||
          "Untitled Template"
        : "Untitled Template",
      content: this.currentContent(),
      createdAt: selectedId
        ? this.savedTemplates().find((t) => t.id === selectedId)?.createdAt ||
          new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  triggerFileUpload(): void {
    this.fileUploadInput?.nativeElement?.click();
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const template: DocumentTemplate = JSON.parse(content);

        // Validate template structure
        if (!template.content || !template.name) {
          alert("Invalid template file format");
          return;
        }

        // Load the template content
        this.currentContent.set(template.content);
        this.selectedTemplateId.set(null); // Treat as new template

        alert(
          `Template "${template.name}" loaded successfully!\nClick "Save Template" to add it to your saved templates.`,
        );
      } catch (error) {
        console.error("Error parsing template file:", error);
        alert(
          "Failed to load template. Please ensure the file is a valid template JSON.",
        );
      }
    };

    reader.readAsText(file);

    // Reset input so the same file can be uploaded again
    input.value = "";
  }
}
