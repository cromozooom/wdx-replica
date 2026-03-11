# Component Interfaces & Contracts

**Feature**: Intelligent Template Assistant  
**Date**: 2026-03-10  
**Status**: Design Phase

## Overview

This document defines the public interfaces and contracts for all components,
services, and interactions in the Template Assistant feature. These contracts
ensure loose coupling and testability.

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│          TemplateAssistantComponent (Container/Smart)       │
│  Responsibilities:                                          │
│  - Orchestrate child components                             │
│  - Manage state (selected customer, current template)       │
│  - Coordinate events between editor, grid, preview          │
└────────────────┬────────────────────────────────────────────┘
                 │
       ┌─────────┴──────────┬──────────────┬──────────────┐
       │                    │              │              │
       ↓                    ↓              ↓              ↓
┌─────────────┐   ┌──────────────┐  ┌──────────┐  ┌──────────────┐
│ Template    │   │ DataGrid     │  │ Template │  │ Template     │
│ EditorView  │   │ Selector     │  │ Preview  │  │ Manager      │
│ (Dumb)      │   │ (Dumb)       │  │ (Dumb)   │  │ (Dumb)       │
└─────────────┘   └──────────────┘  └──────────┘  └──────────────┘
```

---

## 1. TemplateAssistantComponent (Container)

**File**: `src/app/template-assistant/template-assistant.component.ts`

### Interface

```typescript
@Component({
  selector: "app-template-assistant",
  standalone: true,
  imports: [
    TemplateEditorComponent,
    DataGridSelectorComponent,
    TemplatePreviewComponent,
    TemplateManagerComponent,
  ],
})
export class TemplateAssistantComponent implements OnInit, OnDestroy {
  // State
  currentTemplate$ = signal<DocumentTemplate | null>(null);
  selectedCustomer$ = signal<CustomerRecord | null>(null);
  availableFields$ = signal<DataField[]>([]);

  // Event Handlers
  onTemplateContentChanged(content: string): void;
  onCustomerSelected(customer: CustomerRecord): void;
  onTemplateSaved(template: DocumentTemplate): void;
  onTemplateLoaded(template: DocumentTemplate): void;
  onTemplateDeleted(templateId: string): void;
}
```

### Contract

**Inputs**: None (reads from route params if applicable)

**Outputs**: None (self-contained feature)

**Responsibilities**:

1. Load available data fields from registry service
2. Coordinate template content changes with preview updates
3. Manage current template state
4. Handle customer selection from grid
5. Persist templates via storage service

---

## 2. TemplateEditorComponent (Presentation)

**File**:
`src/app/template-assistant/components/template-editor/template-editor.component.ts`

### Interface

```typescript
@Component({
  selector: "app-template-editor",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditorComponent implements AfterViewInit, OnDestroy {
  // Inputs
  @Input() content = "";
  @Input() availableFields: DataField[] = [];
  @Input() readonly = false;

  // Outputs
  @Output() contentChange = new EventEmitter<string>();
  @Output() pillInserted = new EventEmitter<DataField>();

  // Methods
  focus(): void;
  insertPill(field: DataField): void;
  getContent(): string;
  setContent(content: string): void;
}
```

### Contract

**Inputs**:

- `content: string` - Initial markdown content with `{{field_id}}` syntax
- `availableFields: DataField[]` - List of fields available for pill insertion
- `readonly: boolean` - Whether editor is read-only (default: false)

**Outputs**:

- `contentChange: EventEmitter<string>` - Emits on every content change
  (debounced 300ms)
- `pillInserted: EventEmitter<DataField>` - Emits when user inserts a pill

**Public Methods**:

- `focus(): void` - Programmatically focus the editor
- `insertPill(field: DataField): void` - Programmatically insert a pill node
- `getContent(): string` - Get current markdown content
- `setContent(content: string): void` - Set editor content (replaces all)

**Responsibilities**:

1. Render Milkdown editor with custom pill nodes
2. Handle trigger characters (`[`, `{{`) to show pill menu
3. Serialize editor state to markdown with `{{field_id}}` syntax
4. Provide undo/redo via Cmd/Ctrl+Z
5. Emit content changes to parent

**Milkdown Integration Details**:

```typescript
// Editor initialization
private async initEditor(): Promise<void> {
  const editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, this.editorElement.nativeElement);
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(cursor)
    .use(tooltip)
    .use(pillPlugin)  // Custom plugin
    .use(listener)
    .create();

  // Listen for content changes
  editor.action((ctx) => {
    const listener = ctx.get(listenerCtx);
    listener.markdownUpdated((ctx, markdown) => {
      this.contentChange.emit(markdown);
    });
  });

  this.editor = editor;
}
```

---

## 3. DataGridSelectorComponent (Presentation)

**File**:
`src/app/template-assistant/components/data-grid-selector/data-grid-selector.component.ts`

### Interface

```typescript
@Component({
  selector: "app-data-grid-selector",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridSelectorComponent implements AfterViewInit {
  // Inputs
  @Input() customerData: CustomerRecord[] = [];
  @Input() columns: DataField[] = [];
  @Input() selectedCustomerId?: string;

  // Outputs
  @Output() customerSelected = new EventEmitter<CustomerRecord>();

  // Methods
  clearSelection(): void;
  selectCustomer(customerId: string): void;
}
```

### Contract

**Inputs**:

- `customerData: CustomerRecord[]` - Array of customer records to display
- `columns: DataField[]` - Column definitions (auto-generated from fields)
- `selectedCustomerId?: string` - Initially selected customer ID (optional)

**Outputs**:

- `customerSelected: EventEmitter<CustomerRecord>` - Emits when user clicks a
  row

**Public Methods**:

- `clearSelection(): void` - Clear current row selection
- `selectCustomer(customerId: string): void` - Programmatically select a
  customer

**Responsibilities**:

1. Render AG-Grid with customer data
2. Configure single-row selection
3. Auto-generate column definitions from `columns` input
4. Handle row click events
5. Maintain selected row state

**AG-Grid Configuration**:

```typescript
const gridOptions: GridOptions = {
  rowSelection: "single",
  rowMultiSelectWithClick: false,
  rowData: this.customerData,
  columnDefs: this.generateColumnDefs(),
  onRowClicked: (event) => {
    this.customerSelected.emit(event.data);
  },
  // Performance optimizations
  rowBuffer: 10,
  suppressScrollOnNewData: true,
  enableCellTextSelection: true,
};
```

---

## 4. TemplatePreviewComponent (Presentation)

**File**:
`src/app/template-assistant/components/template-preview/template-preview.component.ts`

### Interface

```typescript
@Component({
  selector: "app-template-preview",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePreviewComponent {
  // Inputs
  @Input() markdown = "";
  @Input() customerData: CustomerRecord | null = null;
  @Input() fields: DataField[] = [];

  // Computed
  protected renderedHtml$ = computed(() => {
    return this.interpolateAndRender(
      this.markdown,
      this.customerData,
      this.fields,
    );
  });

  // Methods
  private interpolateAndRender(
    markdown: string,
    customer: CustomerRecord | null,
    fields: DataField[],
  ): string;
}
```

### Contract

**Inputs**:

- `markdown: string` - Template markdown with `{{field_id}}` placeholders
- `customerData: CustomerRecord | null` - Selected customer data (null = use
  sample data)
- `fields: DataField[]` - Field definitions for formatting

**Outputs**: None (read-only display)

**Computed Properties**:

- `renderedHtml$: Signal<string>` - Interpolated and rendered HTML

**Responsibilities**:

1. Interpolate `{{field_id}}` placeholders with customer data
2. Apply field formatting (dates, currency, etc.)
3. Render markdown to HTML
4. Handle missing values ("(Not Available)" or blank)
5. Sanitize HTML output (Angular's DomSanitizer)
6. Use sample data when `customerData` is null

**Interpolation Logic**:

```typescript
private interpolateAndRender(
  markdown: string,
  customer: CustomerRecord | null,
  fields: DataField[]
): string {
  // Use sample data if no customer selected
  const data = customer || SAMPLE_CUSTOMER

  // Replace {{field_id}} with formatted values
  const interpolated = markdown.replace(/\{\{(\w+)\}\}/g, (match, fieldId) => {
    const field = fields.find(f => f.id === fieldId)
    const value = data[fieldId]

    if (value === null || value === undefined) {
      return '(Not Available)'  // Per clarification
    }

    return this.formatValue(value, field?.formatConfig)
  })

  // Render markdown to HTML
  return marked.parse(interpolated)
}
```

---

## 5. TemplateManagerComponent (Presentation)

**File**:
`src/app/template-assistant/components/template-manager/template-manager.component.ts`

### Interface

```typescript
@Component({
  selector: "app-template-manager",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateManagerComponent {
  // Inputs
  @Input() templates: DocumentTemplate[] = [];
  @Input() currentTemplateId?: string;

  // Outputs
  @Output() templateSelected = new EventEmitter<DocumentTemplate>();
  @Output() templateSaved = new EventEmitter<Partial<DocumentTemplate>>();
  @Output() templateDeleted = new EventEmitter<string>();
  @Output() templateDownloaded = new EventEmitter<DocumentTemplate>();
  @Output() templateUploaded = new EventEmitter<File>();

  // Methods
  saveTemplate(name: string, content: string): void;
  downloadTemplate(templateId: string): void;
  uploadTemplate(file: File): void;
  deleteTemplate(templateId: string): void;
}
```

### Contract

**Inputs**:

- `templates: DocumentTemplate[]` - List of saved templates
- `currentTemplateId?: string` - ID of currently active template (for
  highlighting)

**Outputs**:

- `templateSelected: EventEmitter<DocumentTemplate>` - User selected a template
- `templateSaved: EventEmitter<Partial<DocumentTemplate>>` - User saved template
- `templateDeleted: EventEmitter<string>` - User deleted template (by ID)
- `templateDownloaded: EventEmitter<DocumentTemplate>` - User clicked download
- `templateUploaded: EventEmitter<File>` - User uploaded a file

**Public Methods**:

- `saveTemplate(name, content): void` - Trigger save dialog
- `downloadTemplate(id): void` - Download template as `.wdx-template.json`
- `uploadTemplate(file): void` - Parse and load uploaded template file
- `deleteTemplate(id): void` - Trigger delete confirmation

**Responsibilities**:

1. Display list of saved templates
2. Handle new template creation
3. Handle template save (show name dialog)
4. Handle template download (JSON export)
5. Handle template upload (file input)
6. Handle template deletion (with confirmation)
7. Sort/filter templates by name, date, tags

---

## Service Interfaces

### 6. TemplateStorageService

**File**: `src/app/template-assistant/services/template-storage.service.ts`

```typescript
@Injectable({ providedIn: "root" })
export class TemplateStorageService {
  // Observable of all templates
  templates$ = signal<DocumentTemplate[]>([]);

  // CRUD operations
  save(template: DocumentTemplate): Promise<void>;
  load(id: string): Promise<DocumentTemplate | null>;
  loadAll(): Promise<DocumentTemplate[]>;
  delete(id: string): Promise<void>;

  // Import/export
  exportToFile(template: DocumentTemplate): Blob;
  importFromFile(file: File): Promise<DocumentTemplate>;

  // Storage management
  getStorageSize(): number;
  clearAll(): Promise<void>;
}
```

**Contract**:

- All operations return Promises (async localStorage access)
- `templates$` signal updates whenever templates change
- Export format: JSON with `.wdx-template` extension
- Import validates file format before parsing

---

### 7. TemplateInterpolationService

**File**:
`src/app/template-assistant/services/template-interpolation.service.ts`

```typescript
@Injectable({ providedIn: "root" })
export class TemplateInterpolationService {
  interpolate(
    markdown: string,
    customerData: CustomerRecord,
    fields: DataField[],
  ): string;

  formatValue(value: any, config?: FieldFormatConfig): string;

  extractFieldReferences(markdown: string): string[];

  validateReferences(
    markdown: string,
    availableFields: DataField[],
  ): ValidationResult;
}
```

**Contract**:

- `interpolate()` - Replace all `{{field_id}}` with formatted values
- `formatValue()` - Apply field-specific formatting (dates, currency, etc.)
- `extractFieldReferences()` - Return array of field IDs referenced in template
- `validateReferences()` - Check all referenced fields exist

---

### 8. DataFieldRegistryService

**File**: `src/app/template-assistant/services/data-field-registry.service.ts`

```typescript
@Injectable({ providedIn: "root" })
export class DataFieldRegistryService {
  // Observable of available fields
  fields$ = signal<DataField[]>([]);

  // Field management
  getAll(): DataField[];
  getById(id: string): DataField | undefined;
  getByCategory(category: string): DataField[];
  register(field: DataField): void;

  // Field validation
  isValidFieldId(id: string): boolean;
}
```

**Contract**:

- `fields$` signal provides reactive list of available fields
- Fields are registered at app initialization (from config or API)
- `getById()` returns `undefined` if field not found
- `isValidFieldId()` checks if field exists in registry

---

## Milkdown Custom Plugin Contract

### PillPlugin

**File**: `src/app/template-assistant/milkdown/pill-plugin/pill-plugin.ts`

```typescript
import { $node, $nodeAttr, $inputRule, $command } from "@milkdown/utils";

export const pillNode = $node("pill", () => ({
  group: "inline",
  inline: true,
  atom: true, // Non-editable atomic node

  attrs: {
    id: $nodeAttr(""),
    label: $nodeAttr(""),
  },

  parseDOM: [
    {
      tag: "span[data-pill]",
      getAttrs: (dom) => ({
        id: dom.getAttribute("data-field-id") || "",
        label: dom.textContent || "",
      }),
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

// Input rule to trigger pill menu
export const pillInputRule = $inputRule((ctx) => ({
  match: /(?:^|\s)(\[\[|\{\{)$/,
  handler: (state, match, start, end) => {
    // Show pill insertion menu
    // Actual implementation will use @milkdown/plugin-tooltip
  },
}));

// Command to insert pill programmatically
export const insertPillCommand = $command("insertPill", (ctx) => (attrs) => {
  return (state, dispatch) => {
    const node = state.schema.nodes.pill.create(attrs);
    const tr = state.tr.insert(state.selection.from, node);
    dispatch?.(tr);
    return true;
  };
});

export const pillPlugin = [pillNode, pillInputRule, insertPillCommand];
```

**Contract**:

- Pill nodes are atomic (`atom: true`) - cannot be partially edited
- Serializes to `{{field_id}}` in markdown
- Deserializes from `{{field_id}}` when loading template
- Triggers pill menu on `[[` or `{{` input
- Provides `insertPill` command for programmatic insertion

---

## Event Flow Diagrams

### Template Creation Flow

```
User types in Editor
       ↓
Editor emits contentChange event (debounced 300ms)
       ↓
Container updates currentTemplate$ signal
       ↓
Preview component reacts to signal change
       ↓
Preview interpolates + renders
```

### Customer Selection Flow

```
User clicks row in AG-Grid
       ↓
DataGridSelector emits customerSelected event
       ↓
Container updates selectedCustomer$ signal
       ↓
Preview component reacts to signal change
       ↓
Preview re-interpolates with new customer data
```

### Template Save Flow

```
User clicks Save in TemplateManager
       ↓
TemplateManager emits templateSaved event
       ↓
Container calls TemplateStorageService.save()
       ↓
Service updates templates$ signal
       ↓
TemplateManager receives updated template list
```

---

## Testing Contracts

### Component Testing

Each component should be tested with:

1. **Inputs**: Verify component renders correctly with different input
   combinations
2. **Outputs**: Verify events are emitted with correct data
3. **Public Methods**: Verify methods behave as documented
4. **Error Handling**: Verify graceful degradation (null inputs, etc.)

### Service Testing

Each service should be tested with:

1. **CRUD Operations**: Verify data persistence
2. **Edge Cases**: Empty data, missing fields, invalid input
3. **Async Behavior**: Promise resolution/rejection
4. **State Updates**: Signal emissions

---

## Type Safety

All interfaces are exported from `models` and used throughout:

```typescript
// Strict typing in components
@Input() template!: DocumentTemplate  // Not `any` or `object`
@Output() selected = new EventEmitter<CustomerRecord>()  // Not `any`

// Strict typing in services
save(template: DocumentTemplate): Promise<void>  // Not `any`
```

**No `any` types** except when integrating with untyped third-party libraries
(must be justified and documented).
