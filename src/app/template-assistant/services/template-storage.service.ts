/**
 * Template storage service using localStorage.
 * Handles CRUD operations for document templates.
 */

import { Injectable, signal } from "@angular/core";
import { DocumentTemplate } from "../models";

const STORAGE_KEY = "wdx-templates";
const AUTOSAVE_KEY = "wdx-template-autosave";

@Injectable({ providedIn: "root" })
export class TemplateStorageService {
  templates$ = signal<DocumentTemplate[]>([]);

  constructor() {
    this.loadAll();
  }

  /**
   * Save template to localStorage.
   * Updates existing template or creates new one.
   */
  async save(template: DocumentTemplate): Promise<void> {
    const templates = this.getAllFromStorage();
    template.updatedAt = new Date().toISOString();
    templates[template.id] = template;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    await this.loadAll();
  }

  /**
   * Load single template by ID.
   */
  async load(id: string): Promise<DocumentTemplate | null> {
    const templates = this.getAllFromStorage();
    return templates[id] || null;
  }

  /**
   * Load all templates from localStorage.
   */
  async loadAll(): Promise<DocumentTemplate[]> {
    const templates = Object.values(this.getAllFromStorage());
    this.templates$.set(templates);
    return templates;
  }

  /**
   * Delete template by ID.
   */
  async delete(id: string): Promise<void> {
    const templates = this.getAllFromStorage();
    delete templates[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    await this.loadAll();
  }

  /**
   * Auto-save draft template (30 second interval).
   * Separate from named templates.
   */
  autoSave(template: Partial<DocumentTemplate>): void {
    const draft = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
  }

  /**
   * Load auto-saved draft.
   */
  loadAutosave(): Partial<DocumentTemplate> | null {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear auto-save draft.
   */
  clearAutosave(): void {
    localStorage.removeItem(AUTOSAVE_KEY);
  }

  /**
   * Export template to JSON file.
   */
  exportToFile(template: DocumentTemplate): Blob {
    const exportData = {
      format: "wdx-template",
      version: "1.0",
      template,
      exportedAt: new Date().toISOString(),
    };
    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
  }

  /**
   * Import template from JSON file.
   */
  async importFromFile(file: File): Promise<DocumentTemplate> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.format !== "wdx-template") {
      throw new Error("Invalid template file format");
    }

    return data.template;
  }

  /**
   * Get all templates from storage as record.
   */
  private getAllFromStorage(): Record<string, DocumentTemplate> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }
}
