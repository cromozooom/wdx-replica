# Research: Configuration Manager

**Feature**: Configuration Manager  
**Phase**: 0 - Technology Decisions & Best Practices  
**Date**: 2026-02-02

## Purpose

Research best practices and implementation patterns for the technologies used in
this feature to resolve any NEEDS CLARIFICATION items and establish solid
technical foundations.

## Research Areas

### 1. JSONEditor Integration with Angular

**Decision**: Use `jsoneditor` 9.10.5 (already in package.json)

**Rationale**:

- Mature library with 9k+ GitHub stars
- Built-in validation, tree/code/text modes
- TypeScript definitions available
- Already used in project (package.json line 63)

**Best Practices**:

- Lazy load library only when editor component initializes
- Dispose editor instance in ngOnDestroy to prevent memory leaks
- Use `modes: ['tree', 'code']` for user flexibility
- Set `enableSort: false` to prevent accidental structure changes
- Implement custom validation via `onValidate` callback
- Handle change events with debounce (300ms) to reduce state updates

**Implementation Pattern**:

```typescript
// Lazy load JSONEditor
import type JSONEditor from 'jsoneditor';

private editor?: JSONEditor;

ngAfterViewInit() {
  import('jsoneditor').then(module => {
    const JSONEditor = module.default;
    this.editor = new JSONEditor(container, options);
  });
}

ngOnDestroy() {
  this.editor?.destroy();
}
```

**Alternatives Considered**:

- `ngx-json-viewer` - Read-only, not suitable for editing
- `@jsonforms/angular` - Already in project but more complex, form-focused
- **Rejected because**: jsoneditor provides better UX with tree/code views and
  is already approved

---

### 2. Ace Editor Integration for FetchXML

**Decision**: Use `ace-builds` 1.33.1 (already in package.json)

**Rationale**:

- Industry-standard code editor (used in Cloud9, GitHub, etc.)
- Excellent XML syntax highlighting
- Supports custom modes and themes
- Already in project (package.json line 43)

**Best Practices**:

- Use `xml` mode for FetchXML highlighting
- Set theme to `monokai` or `github` for readability
- Enable `showPrintMargin: false` for cleaner UI
- Set `fontSize: 14` for accessibility
- Implement validation via XML parser before save
- Use `readOnly: true` mode for comparison view

**Implementation Pattern**:

```typescript
import * as ace from 'ace-builds';

ngAfterViewInit() {
  const editor = ace.edit(this.editorElement.nativeElement);
  editor.session.setMode('ace/mode/xml');
  editor.setTheme('ace/theme/monokai');
  editor.setOptions({
    showPrintMargin: false,
    fontSize: 14
  });
}
```

**Alternatives Considered**:

- Monaco Editor (VS Code) - 3.5MB bundle size, too heavy
- CodeMirror - Different API, would require learning curve
- **Rejected because**: Ace is lighter and already approved

---

### 3. AG-Grid Enterprise Configuration

**Decision**: Use `ag-grid-enterprise` 33.3.2 with `ag-grid-angular` 33.3.2

**Rationale**:

- Already approved core dependency (constitution)
- Enterprise features needed: filtering, sorting, row selection
- Project already has license (package.json line 47)
- Existing `ag-grid-wrapper` library in src/libs/

**Best Practices**:

- Use `rowSelection: 'multiple'` with checkboxes for export selection
- Implement `getRowId` for stable row identity (use configuration ID)
- Use `defaultColDef` for consistent column behavior
- Enable `animateRows: false` for better performance
- Implement `quickFilter` for search functionality
- Use `suppressRowClickSelection: true` to prevent accidental selections
- Leverage virtual scrolling (enabled by default) for 100+ rows

**Grid Column Configuration**:

```typescript
columnDefs = [
  { field: "id", headerName: "ID", width: 80, checkboxSelection: true },
  { field: "name", headerName: "Name", filter: "agTextColumnFilter" },
  { field: "type", headerName: "Type", filter: "agSetColumnFilter" },
  {
    field: "version",
    headerName: "Version",
    comparator: semanticVersionComparator,
  },
  {
    field: "lastModifiedDate",
    headerName: "Last Updated",
    valueFormatter: dateFormatter,
  },
  { field: "lastModifiedBy", headerName: "Updated By" },
];
```

**Alternatives Considered**:

- Angular Material Table - Lacks advanced filtering/enterprise features
- PrimeNG Table - Would require new dependency
- **Rejected because**: AG-Grid Enterprise already approved and in use

---

### 4. ZIP File Handling with JSZip

**Decision**: Use `jszip` 3.10.1 (already in package.json)

**Rationale**:

- De facto standard for ZIP in browser (16k+ GitHub stars)
- Supports both creation and extraction
- Works with modern File API
- Already in project (package.json line 64)

**Best Practices for Export**:

```typescript
// Create ZIP with structured folders
const zip = new JSZip();
configurations.forEach((config) => {
  const folder = zip.folder(`config-${config.id}`);
  folder.file(
    "metadata.json",
    JSON.stringify(
      {
        id: config.id,
        name: config.name,
        type: config.type,
        version: config.version,
        updates: config.updates,
      },
      null,
      2,
    ),
  );
  folder.file(`value.${getExtension(config.type)}`, config.value);
});

// Generate ZIP and trigger download
zip.generateAsync({ type: "blob" }).then((blob) => {
  FileSaver.saveAs(blob, `configurations-${timestamp}.zip`);
});
```

**Best Practices for Import**:

```typescript
// Read ZIP file
JSZip.loadAsync(file).then((zip) => {
  const promises = [];
  zip.forEach((relativePath, file) => {
    if (!file.dir && file.name.endsWith(".json")) {
      promises.push(
        file
          .async("text")
          .then((content) => ({
            path: relativePath,
            content: JSON.parse(content),
          })),
      );
    }
  });
  return Promise.all(promises);
});
```

**File Size Considerations**:

- Implement 50MB max ZIP size check before processing
- Validate individual configuration <10MB before save
- Show progress bar for large ZIP processing (use `onUpdate` callback)

**Alternatives Considered**:

- Native ZIP API - Not yet widely supported across browsers
- fflate - Lighter but less features
- **Rejected because**: JSZip has better API and is already approved

---

### 5. LocalStorage vs IndexedDB for Persistence

**Decision**: Use IndexedDB with Dexie.js wrapper

**Rationale**:

- LocalStorage limited to ~5-10MB (insufficient for 500 configurations)
- IndexedDB supports larger storage (browser-dependent, typically hundreds of
  MB)
- Async API better for performance
- Dexie.js provides simple promise-based API

**NEEDS DECISION**: Dexie.js is not in package.json - requires approval

**Alternatives if Dexie.js rejected**:

1. Use native IndexedDB API directly (more complex but zero dependencies)
2. Use LocalStorage with compression (jszip can compress JSON)
3. Fallback hybrid: IndexedDB with LocalStorage fallback for older browsers

**Recommendation**: Use native IndexedDB API to comply with minimal dependencies
principle

**IndexedDB Schema**:

```typescript
const dbName = "ConfigurationManagerDB";
const storeName = "configurations";

interface ConfigurationDB {
  id: number;
  name: string;
  type: ConfigurationType;
  version: string;
  value: string;
  updates: UpdateEntry[];
  createdDate: Date;
  createdBy: string;
  lastModifiedDate: Date;
  lastModifiedBy: string;
}

// Schema version 1
// Primary key: id (auto-increment)
// Indexes: name, type, version, lastModifiedDate
```

---

### 6. FetchXML Validation Strategy

**Decision**: Use DOMParser for XML validation

**Rationale**:

- Native browser API, zero dependencies
- Fast and reliable for well-formedness checks
- Can validate FetchXML structure against known patterns

**Validation Approach**:

```typescript
function validateFetchXML(xml: string): { valid: boolean; error?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return { valid: false, error: parseError.textContent || "Invalid XML" };
  }

  // Check for <fetch> root element
  const fetchElement = doc.querySelector("fetch");
  if (!fetchElement) {
    return { valid: false, error: "FetchXML must have <fetch> root element" };
  }

  return { valid: true };
}
```

**Enhanced Validation** (optional):

- Check for required FetchXML attributes (entity, count, etc.)
- Validate entity-attribute relationships against known schema
- **Not in MVP** - can be added later if needed

**Alternatives Considered**:

- xml2js library - Would require new dependency
- XSD schema validation - Too complex for MVP
- **Rejected because**: DOMParser is sufficient and dependency-free

---

### 7. Markdown Rendering for Comments

**Decision**: Use `ngx-markdown` 19.1.1 (already in package.json)

**Rationale**:

- Already in project (package.json line 78)
- Supports GitHub Flavored Markdown
- Sanitizes HTML to prevent XSS
- Angular-friendly integration

**Best Practices**:

```typescript
// In update-history.component.html
<markdown [data]="updateEntry.comment"></markdown>

// Enable GFM and sanitization in module
MarkdownModule.forRoot({
  sanitize: SecurityContext.HTML
})
```

**Alternatives Considered**:

- marked.js - Already in package.json (line 67) but ngx-markdown uses it
  internally
- showdown - Would require new dependency
- **Rejected because**: ngx-markdown already approved and integrated

---

### 8. ng-bootstrap Modal Usage

**Decision**: Use `@ng-bootstrap/ng-bootstrap` 18.0.0 modals

**Rationale**:

- Already in project (package.json line 32)
- Provides Bootstrap 5 modals without jQuery
- Good Angular integration with services

**Modal Use Cases**:

1. **Configuration Editor Modal** - Large modal with editor (size: 'xl')
2. **Import Wizard Modal** - Step-by-step import flow (size: 'lg')
3. **Conflict Comparison Modal** - Side-by-side diff view (size: 'xl')
4. **Delete Confirmation** - Small confirmation dialog (size: 'sm')

**Best Practices**:

```typescript
constructor(private modalService: NgbModal) {}

openEditor(config?: Configuration) {
  const modalRef = this.modalService.open(ConfigurationEditorComponent, {
    size: 'xl',
    backdrop: 'static', // Prevent close on outside click
    keyboard: false     // Prevent ESC to avoid data loss
  });
  modalRef.componentInstance.configuration = config;
  modalRef.result.then(
    (result) => this.handleSave(result),
    (reason) => this.handleDismiss(reason)
  );
}
```

**Alternatives Considered**:

- Angular Material Dialog - Would require Material CDK setup
- Custom modal component - Reinventing the wheel
- **Rejected because**: ng-bootstrap already approved and simpler

---

### 9. Version String Validation (V#.#.#)

**Decision**: Use regex pattern with semantic versioning logic

**Pattern**: `/^V\d+\.\d+\.\d+$/`

**Implementation**:

```typescript
function validateVersion(version: string): boolean {
  return /^V\d+\.\d+\.\d+$/.test(version);
}

function parseVersion(version: string): [number, number, number] {
  const match = version.match(/^V(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error("Invalid version format");
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}
```

**Alternatives Considered**:

- semver library - Would require new dependency
- String comparison - Would incorrectly sort V1.10.0 before V1.2.0
- **Rejected because**: Custom regex is sufficient and dependency-free

---

### 10. Team Member Data Source

**Decision**: Hardcoded list in service (MVP), extensible for future API
integration

**Rationale**:

- No backend in MVP scope
- List can be easily moved to configuration file or API later
- Satisfies immediate requirement

**Implementation**:

```typescript
@Injectable({ providedIn: "root" })
export class TeamMemberService {
  private members = signal<string[]>([
    "John Smith",
    "Jane Doe",
    "Bob Johnson",
    "Alice Williams",
    // TODO: Load from API or configuration in future
  ]);

  getTeamMembers(): Signal<string[]> {
    return this.members.asReadonly();
  }
}
```

**Future Enhancement Path**:

- Replace with HTTP call to user API
- Integrate with authentication service for current user
- Support user profiles with avatars

**Alternatives Considered**:

- Configuration file in assets - Harder to update without rebuild
- User input only - No dropdown, poor UX
- **Rejected because**: Service provides flexibility for future changes

---

## Summary of Decisions

| Area               | Technology                        | Status      | Notes                         |
| ------------------ | --------------------------------- | ----------- | ----------------------------- |
| JSON Editing       | jsoneditor 9.10.5                 | ✅ Existing | Lazy load, dispose on destroy |
| Code Editing       | ace-builds 1.33.1                 | ✅ Existing | XML mode for FetchXML         |
| Data Grid          | ag-grid-enterprise 33.3.2         | ✅ Existing | Use existing wrapper          |
| ZIP Handling       | jszip 3.10.1                      | ✅ Existing | 50MB limit, progress bar      |
| Persistence        | IndexedDB (native)                | ✅ No deps  | Native API, no wrapper        |
| XML Validation     | DOMParser (native)                | ✅ No deps  | Browser native                |
| Markdown           | ngx-markdown 19.1.1               | ✅ Existing | Sanitized rendering           |
| Modals             | @ng-bootstrap/ng-bootstrap 18.0.0 | ✅ Existing | Bootstrap 5 modals            |
| File Download      | file-saver 2.0.2                  | ✅ Existing | Cross-browser support         |
| Version Validation | Custom regex                      | ✅ No deps  | Semantic versioning logic     |

## Outstanding Questions

**None** - All technical decisions resolved using existing dependencies. No new
dependencies required, fully compliant with constitution.

## Next Steps

1. ✅ Phase 0 Complete - All technology decisions made
2. ⏭️ Phase 1 - Create data-model.md with entity definitions
3. ⏭️ Phase 1 - Create quickstart.md for developer onboarding
4. ⏭️ Phase 1 - Update agent context with technology stack
