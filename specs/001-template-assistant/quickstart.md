# Quickstart Guide: Intelligent Template Assistant

**Feature**: Template editor with atomic pill nodes  
**Date**: 2026-03-10  
**Audience**: Developers implementing this feature

## Overview

This guide provides step-by-step instructions for implementing the Intelligent
Template Assistant feature using Milkdown editor, AG-Grid, and Angular 19+
standalone components.

**Estimated Implementation Time**: 1-2 weeks (1 developer)

---

## Prerequisites

- Angular 19.2+ CLI installed
- Node.js 18+ and npm
- Existing WDX Replica project cloned
- Familiarity with Angular standalone components and signals

---

## Phase 1: Setup & Dependencies (Day 1)

### Step 1.1: Install Dependencies

```bash
# Navigate to project root
cd wdx-replica

# Install Milkdown packages
npm install @milkdown/core@^7.19.0 @milkdown/ctx@^7.19.0
npm install @milkdown/preset-commonmark@^7.19.0 @milkdown/preset-gfm@^7.19.0
npm install @milkdown/plugin-history@^7.19.0 @milkdown/plugin-cursor@^7.19.0 @milkdown/plugin-tooltip@^7.19.0
npm install @milkdown/plugin-listener@^7.19.0
npm install @milkdown/prose@^7.19.0 @milkdown/utils@^7.19.0

# Install date formatting library (tree-shakeable)
npm install date-fns@^3.3.0

# Verify installations
npm list @milkdown/core @milkdown/preset-commonmark date-fns
```

**Bundle Size Check**:

```bash
# After installation, verify bundle impact
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/wdx-replica/stats.json
```

Expected sizes (gzipped):

- `@milkdown/core`: ~30 KB ✅
- `@milkdown/preset-commonmark`: ~40 KB ✅
- `@milkdown/preset-gfm`: ~15 KB ✅
- `@milkdown/plugin-history`: ~8 KB ✅
- `@milkdown/plugin-cursor`: ~4 KB ✅
- `@milkdown/plugin-tooltip`: ~6 KB ✅
- `date-fns` (tree-shaken): ~2-3 KB ✅
- **Total**: ~115 KB (15 KB over budget BUT lazy-loaded, zero initial impact)

---

### Step 1.2: Create Feature Module Structure

```bash
# From project root
mkdir -p src/app/template-assistant/{components,services,models,milkdown/pill-plugin}

# Create component directories
mkdir -p src/app/template-assistant/components/{template-editor,data-grid-selector,template-preview,template-manager}

# Create placeholder files
touch src/app/template-assistant/template-assistant.component.ts
touch src/app/template-assistant/template-assistant.routes.ts
touch src/app/template-assistant/components/template-editor/template-editor.component.ts
touch src/app/template-assistant/components/data-grid-selector/data-grid-selector.component.ts
touch src/app/template-assistant/components/template-preview/template-preview.component.ts
touch src/app/template-assistant/components/template-manager/template-manager.component.ts

# Create service files
touch src/app/template-assistant/services/template-storage.service.ts
touch src/app/template-assistant/services/template-interpolation.service.ts
touch src/app/template-assistant/services/data-field-registry.service.ts

# Create model files
touch src/app/template-assistant/models/template.model.ts
touch src/app/template-assistant/models/data-field.model.ts
touch src/app/template-assistant/models/customer-record.model.ts
touch src/app/template-assistant/models/field-format.model.ts
touch src/app/template-assistant/models/index.ts
```

---

## Phase 2: Data Models (Day 1-2)

### Step 2.1: Define Core Interfaces

Create `src/app/template-assistant/models/template.model.ts`:

```typescript
export interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: {
    description?: string;
    tags?: string[];
    lastPreviewCustomerId?: string;
  };
}
```

Create `src/app/template-assistant/models/data-field.model.ts`:

```typescript
export interface DataField {
  id: string;
  label: string;
  type: "text" | "date" | "number" | "currency";
  formatConfig?: FieldFormatConfig;
  description?: string;
  required?: boolean;
  category?: "personal" | "account" | "address" | "other";
}
```

Create `src/app/template-assistant/models/customer-record.model.ts`:

```typescript
export interface CustomerRecord {
  id: string;
  [fieldId: string]: string | number | Date | null | undefined;
}
```

Create `src/app/template-assistant/models/field-format.model.ts`:

```typescript
export interface DateFormatConfig {
  dateFormat: string;
}

export interface CurrencyFormatConfig {
  currencyCode: "GBP" | "EUR" | "USD";
  decimals?: number;
  symbolPosition?: "before" | "after";
}

export type FieldFormatConfig = DateFormatConfig | CurrencyFormatConfig; // Add more as needed
```

Create `src/app/template-assistant/models/index.ts`:

```typescript
export * from "./template.model";
export * from "./data-field.model";
export * from "./customer-record.model";
export * from "./field-format.model";
```

---

## Phase 3: Core Services (Day 2-3)

### Step 3.1: Template Storage Service

Create `src/app/template-assistant/services/template-storage.service.ts`:

```typescript
import { Injectable, signal } from "@angular/core";
import { DocumentTemplate } from "../models";

const STORAGE_KEY = "wdx-templates";

@Injectable({ providedIn: "root" })
export class TemplateStorageService {
  templates$ = signal<DocumentTemplate[]>([]);

  constructor() {
    this.loadAll();
  }

  async save(template: DocumentTemplate): Promise<void> {
    const templates = this.getAllFromStorage();
    templates[template.id] = template;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    await this.loadAll();
  }

  async load(id: string): Promise<DocumentTemplate | null> {
    const templates = this.getAllFromStorage();
    return templates[id] || null;
  }

  async loadAll(): Promise<DocumentTemplate[]> {
    const templates = Object.values(this.getAllFromStorage());
    this.templates$.set(templates);
    return templates;
  }

  async delete(id: string): Promise<void> {
    const templates = this.getAllFromStorage();
    delete templates[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    await this.loadAll();
  }

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

  async importFromFile(file: File): Promise<DocumentTemplate> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.format !== "wdx-template") {
      throw new Error("Invalid template file format");
    }

    return data.template;
  }

  private getAllFromStorage(): Record<string, DocumentTemplate> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }
}
```

### Step 3.2: Field Registry Service

Create `src/app/template-assistant/services/data-field-registry.service.ts`:

```typescript
import { Injectable, signal } from "@angular/core";
import { DataField } from "../models";

const DEFAULT_FIELDS: DataField[] = [
  {
    id: "full_name",
    label: "Full Name",
    type: "text",
    category: "personal",
  },
  {
    id: "date_of_birth",
    label: "Date of Birth",
    type: "date",
    formatConfig: { dateFormat: "dd MMM yyyy" },
    category: "personal",
  },
  {
    id: "sort_code",
    label: "Sort Code",
    type: "text",
    category: "account",
  },
  // Add more fields as needed
];

@Injectable({ providedIn: "root" })
export class DataFieldRegistryService {
  fields$ = signal<DataField[]>(DEFAULT_FIELDS);

  getAll(): DataField[] {
    return this.fields$();
  }

  getById(id: string): DataField | undefined {
    return this.fields$().find((f) => f.id === id);
  }

  getByCategory(category: string): DataField[] {
    return this.fields$().filter((f) => f.category === category);
  }

  isValidFieldId(id: string): boolean {
    return this.getById(id) !== undefined;
  }
}
```

### Step 3.3: Interpolation Service

Create `src/app/template-assistant/services/template-interpolation.service.ts`:

```typescript
import { Injectable } from "@angular/core";
import { format } from "date-fns";
import { CustomerRecord, DataField, FieldFormatConfig } from "../models";

@Injectable({ providedIn: "root" })
export class TemplateInterpolationService {
  interpolate(
    markdown: string,
    customerData: CustomerRecord,
    fields: DataField[],
  ): string {
    return markdown.replace(/\{\{(\w+)\}\}/g, (match, fieldId) => {
      const field = fields.find((f) => f.id === fieldId);
      const value = customerData[fieldId];

      if (value === null || value === undefined) {
        return "(Not Available)"; // Per spec clarification
      }

      return this.formatValue(value, field?.formatConfig, field?.type);
    });
  }

  formatValue(
    value: any,
    config?: FieldFormatConfig,
    type?: DataField["type"],
  ): string {
    if (type === "date" && config && "dateFormat" in config) {
      const date = typeof value === "string" ? new Date(value) : value;
      return format(date, config.dateFormat);
    }

    if (type === "currency" && config && "currencyCode" in config) {
      const formatted =
        typeof value === "number" ? value.toFixed(config.decimals || 2) : value;
      return `${config.symbolPosition === "after" ? "" : config.currencyCode}${formatted}${config.symbolPosition === "after" ? " " + config.currencyCode : ""}`;
    }

    return String(value);
  }

  extractFieldReferences(markdown: string): string[] {
    const matches = markdown.matchAll(/\{\{(\w+)\}\}/g);
    return Array.from(matches, (m) => m[1]);
  }
}
```

---

## Phase 4: Milkdown Custom Pill Plugin (Day 3-4)

### Step 4.1: Create Pill Node Plugin

Create `src/app/template-assistant/milkdown/pill-plugin/pill-node.ts`:

```typescript
import { $node, $nodeAttr } from "@milkdown/utils";

export const pillNode = $node("pill", () => ({
  group: "inline",
  inline: true,
  atom: true, // Makes it atomic/non-editable

  attrs: {
    id: $nodeAttr(""),
    label: $nodeAttr(""),
  },

  parseDOM: [
    {
      tag: "span[data-pill]",
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        return {
          id: dom.getAttribute("data-field-id") || "",
          label: dom.textContent || "",
        };
      },
    },
  ],

  toDOM: (node) => [
    "span",
    {
      "data-pill": "",
      "data-field-id": node.attrs.id,
      class: "pill-node",
      contenteditable: "false",
    },
    node.attrs.label,
  ],
}));
```

### Step 4.2: Add Input Rule for Trigger Characters

Create `src/app/template-assistant/milkdown/pill-plugin/pill-inputrule.ts`:

```typescript
import { $inputRule } from "@milkdown/utils";
import { pillNode } from "./pill-node";

export const pillInputRule = $inputRule((ctx) => ({
  match: /(?:^|\s)(\[\[|\{\{)$/,
  handler: (state, match, start, end) => {
    // This will trigger the pill menu via tooltip plugin
    // Actual implementation handled by Step 4.3
    return null;
  },
}));
```

### Step 4.3: Add Markdown Serialization

Create `src/app/template-assistant/milkdown/pill-plugin/pill-markdown.ts`:

```typescript
import { $remark } from "@milkdown/utils";

// Add markdown serialization for pill nodes
export const pillMarkdown = $remark("pillMarkdown", () => {
  return {
    // Serialize: Node → Markdown
    toMarkdown: {
      pill(state, node) {
        state.write(`{{${node.attrs.id}}}`);
      },
    },

    // Deserialize: Markdown → Node
    fromMarkdown: {
      pill: {
        match: /\{\{(\w+)\}\}/,
        runner: (state, match) => {
          state.openNode({
            type: "pill",
            attrs: {
              id: match[1],
              label: match[1],
            },
          });
          state.closeNode();
        },
      },
    },
  };
});
```

### Step 4.4: Create Command for Programmatic Insertion

Create `src/app/template-assistant/milkdown/pill-plugin/pill-command.ts`:

```typescript
import { $command } from "@milkdown/utils";

interface InsertPillPayload {
  id: string;
  label: string;
}

export const insertPillCommand = $command(
  "insertPill",
  (ctx) => (payload: InsertPillPayload) => {
    return (state, dispatch) => {
      const node = state.schema.nodes.pill.create(payload);
      const tr = state.tr.insert(state.selection.from, node);

      if (dispatch) {
        dispatch(tr);
      }

      return true;
    };
  },
);
```

### Step 4.5: Combine into Plugin Bundle

Create `src/app/template-assistant/milkdown/pill-plugin/index.ts`:

```typescript
import { pillNode } from "./pill-node";
import { pillInputRule } from "./pill-inputrule";
import { pillMarkdown } from "./pill-markdown";
import { insertPillCommand } from "./pill-command";

export const pillPlugin = [
  pillNode,
  pillInputRule,
  pillMarkdown,
  insertPillCommand,
];

export { insertPillCommand };
export type { InsertPillPayload } from "./pill-command";
```

---

## Phase 5: Template Editor Component (Day 4-6)

### Step 5.1: Create Editor Component

Create
`src/app/template-assistant/components/template-editor/template-editor.component.ts`:

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  Element Ref,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  NgZone,
} from "@angular/core";
import { Editor, rootCtx, editorViewOptionsCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { cursor } from "@milkdown/plugin-cursor";
import { tooltip } from "@milkdown/plugin-tooltip";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { pillPlugin, insertPillCommand } from "../../milkdown/pill-plugin";
import { DataField } from "../../models";

@Component({
  selector: "app-template-editor",
  standalone: true,
  template: `
    <div class="editor-container">
      <div #editorRef class="editor-content"></div>
    </div>
  `,
  styleUrls: ["./template-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditorComponent implements AfterViewInit, OnDestroy {
  @Input() content = "";
  @Input() availableFields: DataField[] = [];
  @Input() readonly = false;

  @Output() contentChange = new EventEmitter<string>();
  @Output() pillInserted = new EventEmitter<DataField>();

  @ViewChild("editorRef", { static: true }) editorElement!: ElementRef;

  private editor?: Editor;

  constructor(private ngZone: NgZone) {}

  async ngAfterViewInit() {
    // Run Milkdown editor outside Angular zone for performance
    await this.ngZone.runOutsideAngular(() => this.initEditor());
  }

  ngOnDestroy() {
    this.editor?.destroy();
  }

  private async initEditor(): Promise<void> {
    this.editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, this.editorElement.nativeElement);
        ctx.set(editorViewOptionsCtx, { editable: () => !this.readonly });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(cursor)
      .use(tooltip)
      .use(pillPlugin)
      .use(listener)
      .create();

    // Listen for content changes
    this.editor.action((ctx) => {
      const listenerPlugin = ctx.get(listenerCtx);

      listenerPlugin.markdownUpdated((ctx, markdown) => {
        this.ngZone.run(() => {
          this.contentChange.emit(markdown);
        });
      });
    });

    // Set initial content
    if (this.content) {
      this.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const parser = ctx.get(parserCtx);
        const doc = parser(this.content);
        if (doc) {
          view.updateState(view.state.reconfigure({ doc }));
        }
      });
    }
  }

  insertPill(field: DataField): void {
    this.editor?.action((ctx) => {
      const command = ctx.get(insertPillCommand.key);
      command({ id: field.id, label: field.label });
    });
    this.pillInserted.emit(field);
  }

  focus(): void {
    this.editor?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.focus();
    });
  }

  getContent(): string {
    let markdown = "";
    this.editor?.action((ctx) => {
      const serializer = ctx.get(serializerCtx);
      markdown = serializer(ctx.get(editorViewCtx).state.doc);
    });
    return markdown;
  }

  setContent(content: string): void {
    this.editor?.action((ctx) => {
      const parser = ctx.get(parserCtx);
      const view = ctx.get(editorViewCtx);
      const doc = parser(content);
      if (doc) {
        const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
        view.dispatch(tr);
      }
    });
  }
}
```

**Important**: Add required imports at the top:

```typescript
import { editorViewCtx, parserCtx, serializerCtx } from "@milkdown/core";
```

Create
`src/app/template-assistant/components/template-editor/template-editor.component.scss`:

```scss
.editor-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  min-height: 300px;

  .editor-content {
    min-height: 250px;
    outline: none;

    ::ng-deep .pill-node {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
      cursor: default;
      user-select: none;
      display: inline-block;
      margin: 0 2px;

      &:hover {
        background-color: #bbdefb;
      }
    }
  }
}
```

---

## Phase 6: AG-Grid Selector Component (Day 6-7)

### Step 6.1: Create Grid Selector

Create
`src/app/template-assistant/components/data-grid-selector/data-grid-selector.component.ts`:

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { AgGridAngular } from "ag-grid-angular";
import { GridOptions, RowClickedEvent } from "ag-grid-community";
import { CustomerRecord, DataField } from "../../models";

@Component({
  selector: "app-data-grid-selector",
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      style="width: 100%; height: 400px;"
      class="ag-theme-alpine"
      [gridOptions]="gridOptions"
      [rowData]="customerData"
      [columnDefs]="columnDefs"
      (rowClicked)="onRowClicked($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridSelectorComponent implements AfterViewInit {
  @Input() set customerData(data: CustomerRecord[]) {
    this._customerData = data;
    this.updateColumnDefs();
  }
  get customerData(): CustomerRecord[] {
    return this._customerData;
  }

  @Output() customerSelected = new EventEmitter<CustomerRecord>();

  private _customerData: CustomerRecord[] = [];

  columnDefs: any[] = [];

  gridOptions: GridOptions = {
    rowSelection: "single",
    rowMultiSelectWithClick: false,
    suppressScrollOnNewData: true,
    enableCellTextSelection: true,
  };

  ngAfterViewInit() {
    this.updateColumnDefs();
  }

  onRowClicked(event: RowClickedEvent) {
    this.customerSelected.emit(event.data);
  }

  private updateColumnDefs(): void {
    if (this.customerData.length === 0) return;

    const firstRow = this.customerData[0];
    this.columnDefs = Object.keys(firstRow).map((key) => ({
      field: key,
      headerName: this.formatHeaderName(key),
      sortable: true,
      filter: true,
    }));
  }

  private formatHeaderName(key: string): string {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
```

---

## Phase 7: Preview Component (Day 7-8)

### Step 7.1: Create Preview Component

Create
`src/app/template-assistant/components/template-preview/template-preview.component.ts`:

```typescript
import {
  Component,
  Input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { marked } from "marked";
import { CustomerRecord, DataField } from "../../models";
import { TemplateInterpolationService } from "../../services/template-interpolation.service";

@Component({
  selector: "app-template-preview",
  standalone: true,
  template: `
    <div class="preview-container">
      <h3>Preview</h3>
      <div class="preview-content" [innerHTML]="renderedHtml$()"></div>
    </div>
  `,
  styleUrls: ["./template-preview.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePreviewComponent {
  @Input() markdown = "";
  @Input() customerData: CustomerRecord | null = null;
  @Input() fields: DataField[] = [];

  protected renderedHtml$ = computed(() => {
    return this.interpolateAndRender();
  });

  constructor(
    private interpolationService: TemplateInterpolationService,
    private sanitizer: DomSanitizer,
  ) {}

  private interpolateAndRender(): SafeHtml {
    const customer = this.customerData || this.getSampleCustomer();
    const interpolated = this.interpolationService.interpolate(
      this.markdown,
      customer,
      this.fields,
    );
    const html = marked.parse(interpolated) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private getSampleCustomer(): CustomerRecord {
    return {
      id: "SAMPLE",
      full_name: "Mr. Adrian Sterling",
      date_of_birth: "1985-03-10",
      sort_code: "20-00-00",
      balance: 5000.0,
    };
  }
}
```

---

## Phase 8: Container Component (Day 8-9)

### Step 8.1: Create Main Container

Create `src/app/template-assistant/template-assistant.component.ts`:

```typescript
import { Component, OnInit, signal } from "@angular/core";
import { TemplateEditorComponent } from "./components/template-editor/template-editor.component";
import { DataGridSelectorComponent } from "./components/data-grid-selector/data-grid-selector.component";
import { TemplatePreviewComponent } from "./components/template-preview/template-preview.component";
import { DataFieldRegistryService } from "./services/data-field-registry.service";
import { CustomerRecord, DataField, DocumentTemplate } from "./models";

@Component({
  selector: "app-template-assistant",
  standalone: true,
  imports: [
    TemplateEditorComponent,
    DataGridSelectorComponent,
    TemplatePreviewComponent,
  ],
  template: `
    <div class="template-assistant-container">
      <h1>Intelligent Template Assistant</h1>

      <div class="editor-section">
        <app-template-editor
          [content]="currentTemplate$()?.content || ''"
          [availableFields]="availableFields$()"
          (contentChange)="onContentChange($event)"
        />
      </div>

      <div class="grid-section">
        <h2>Customer Data</h2>
        <app-data-grid-selector
          [customerData]="sampleCustomers"
          (customerSelected)="onCustomerSelected($event)"
        />
      </div>

      <div class="preview-section">
        <app-template-preview
          [markdown]="currentTemplate$()?.content || ''"
          [customerData]="selectedCustomer$()"
          [fields]="availableFields$()"
        />
      </div>
    </div>
  `,
  styleUrls: ["./template-assistant.component.scss"],
})
export class TemplateAssistantComponent implements OnInit {
  currentTemplate$ = signal<DocumentTemplate | null>(null);
  selectedCustomer$ = signal<CustomerRecord | null>(null);
  availableFields$ = signal<DataField[]>([]);

  // Sample data for demo
  sampleCustomers: CustomerRecord[] = [
    {
      id: "CUST001",
      full_name: "Adrian Sterling",
      date_of_birth: "1985-03-10",
      sort_code: "20-00-00",
      balance: 5000,
    },
    // Add more sample customers
  ];

  constructor(private fieldRegistry: DataFieldRegistryService) {}

  ngOnInit() {
    this.availableFields$.set(this.fieldRegistry.getAll());
  }

  onContentChange(content: string): void {
    const current = this.currentTemplate$();
    if (current) {
      this.currentTemplate$.set({ ...current, content });
    } else {
      this.currentTemplate$.set({
        id: crypto.randomUUID(),
        name: "Untitled",
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      });
    }
  }

  onCustomerSelected(customer: CustomerRecord): void {
    this.selectedCustomer$.set(customer);
  }
}
```

---

## Phase 9: Routing & Testing (Day 9-10)

### Step 9.1: Configure Routes

Create `src/app/template-assistant/template-assistant.routes.ts`:

```typescript
import { Routes } from "@angular/router";

export const TEMPLATE_ASSISTANT_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./template-assistant.component").then(
        (m) => m.TemplateAssistantComponent,
      ),
  },
];
```

Add to `src/app/app.routes.ts`:

```typescript
export const routes: Routes = [
  // ... existing routes
  {
    path: "template-assistant",
    loadChildren: () =>
      import("./template-assistant/template-assistant.routes").then(
        (m) => m.TEMPLATE_ASSISTANT_ROUTES,
      ),
  },
];
```

---

## Testing

### Unit Test Example

```typescript
import { TestBed } from "@angular/core/testing";
import { TemplateInterpolationService } from "./template-interpolation.service";

describe("TemplateInterpolationService", () => {
  let service: TemplateInterpolationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateInterpolationService);
  });

  it("should interpolate field values", () => {
    const markdown = "Hello {{full_name}}";
    const customer = { id: "1", full_name: "John Doe" };
    const result = service.interpolate(markdown, customer, []);
    expect(result).toBe("Hello John Doe");
  });

  it("should handle missing values", () => {
    const markdown = "DOB: {{date_of_birth}}";
    const customer = { id: "1", date_of_birth: null };
    const result = service.interpolate(markdown, customer, []);
    expect(result).toBe("DOB: (Not Available)");
  });
});
```

---

## Troubleshooting

### Issue: Milkdown editor not rendering

**Solution**: Ensure you imported Milkdown styles in your global `styles.scss`:

```scss
@import "@milkdown/theme-nord/style.css";
// Or use another theme:
// @import "@milkdown/theme-tokyo/style.css";
```

And install the theme package:

```bash
npm install @milkdown/theme-nord@^7.19.0
```

### Issue: Pills not serializing to markdown

**Solution**: Check that `pillPlugin` is included in the editor's `.use()` chain
and the markdown serialization in `pill-markdown.ts` is properly configured.

### Issue: Editor crashes on initialization

**Solution**: Ensure Milkdown editor is initialized outside Angular's zone:

```typescript
await this.ngZone.runOutsideAngular(() => this.initEditor());
```

### Issue: AG-Grid not displaying

**Solution**: Import AG-Grid theme CSS in `angular.json`:

```json
"styles": [
  "node_modules/ag-grid-community/styles/ag-grid.css",
  "node_modules/ag-grid-community/styles/ag-theme-alpine.css"
]
```

---

## Next Steps

1. **Implement Template Manager** component for save/load/download/upload
2. **Add pill selector menu** (dropdown on trigger characters using
   @milkdown/plugin-tooltip)
3. **Enhance field formatting** (more date/currency options)
4. **Add validation** for template references
5. **Write comprehensive tests** for all components
6. **Monitor Milkdown updates** for potential bundle size optimizations

---

## Resources

- [Milkdown Documentation](https://milkdown.dev/)
- [Milkdown API Reference](https://milkdown.dev/docs/api/core)
- [Milkdown Plugins](https://milkdown.dev/docs/plugin)
- [AG-Grid Angular Guide](https://www.ag-grid.com/angular-data-grid/)
- [date-fns Documentation](https://date-fns.org/)
- [Angular Signals Guide](https://angular.io/guide/signals)
