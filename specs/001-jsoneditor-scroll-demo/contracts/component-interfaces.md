# Component Contracts: JSON Editor Scroll Behavior Demo

**Feature**: 001-jsoneditor-scroll-demo  
**Date**: 2026-02-25  
**Purpose**: Define TypeScript interfaces and component API contracts

## Component Interface

### JsonEditorScrollDemoComponent

Standalone Angular component displaying multiple JSONEditor instances for scroll
testing.

**Selector**: `app-jsoneditor-scroll-demo`

**Inputs**: None (standalone demo page, no external configuration)

**Outputs**: None (no user interactions to emit)

**Public Methods**: None (internal demonstration only)

**Component Contract**:

```typescript
@Component({
  selector: "app-jsoneditor-scroll-demo",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./jsoneditor-scroll-demo.component.html",
  styleUrls: ["./jsoneditor-scroll-demo.component.scss"],
})
export class JsonEditorScrollDemoComponent implements AfterViewInit, OnDestroy {
  // No @Input() - self-contained demo
  // No @Output() - no user interactions to emit

  // Internal state only
  scenarios: ScrollScenario[];
  editors: (JSONEditor | null)[];
}
```

**Lifecycle Hooks**:

- `AfterViewInit`: Initialize all 6 JSONEditor instances after DOM ready
- `OnDestroy`: Cleanup JSONEditor instances (call destroy() method)

---

## TypeScript Interfaces

### ScrollScenario

Defines configuration for a single scroll test scenario.

```typescript
/**
 * Configuration for a JSONEditor scroll behavior test scenario
 */
export interface ScrollScenario {
  /**
   * Unique identifier for the scenario (kebab-case)
   * @example 'small-content', 'vertical-scroll'
   */
  id: string;

  /**
   * Human-readable label displayed to developer
   * @example 'Small Content - No Scroll'
   */
  label: string;

  /**
   * Brief description of what scroll behavior to observe
   * @example 'Compact JSON that fits entirely in view'
   */
  description: string;

  /**
   * CSS class for container height/width constraints
   * @example 'editor-small', 'editor-vertical'
   */
  containerClass: string;

  /**
   * Initial JSONEditor display mode
   */
  editorMode: "code" | "tree";

  /**
   * Sample JSON data to display in editor
   * Can be any valid JSON type (object, array, primitive)
   */
  sampleData: unknown;
}
```

**Usage Example**:

```typescript
const scenario: ScrollScenario = {
  id: "vertical-scroll",
  label: "Vertical Scroll Only",
  description: "Tall content requiring vertical scrollbar",
  containerClass: "editor-vertical",
  editorMode: "code",
  sampleData: {
    users: [
      /* ... */
    ],
  },
};
```

---

## JSONEditor Library Interface (External)

**Type Definitions** (from jsoneditor package):

```typescript
// Note: jsoneditor does not have official TypeScript types
// Using implicit 'any' type is acceptable per constitution (third-party library exception)

interface JSONEditorOptions {
  mode?: 'tree' | 'view' | 'form' | 'code' | 'text';
  modes?: Array<'tree' | 'view' | 'form' | 'code' | 'text'>;
  onChange?: () => void;
  onModeChange?: (newMode: string, oldMode: string) => void;
  schema?: object;
  // ... other options as needed
}

// Constructor
new JSONEditor(container: HTMLElement, options: JSONEditorOptions): JSONEditor

// Key methods used:
editor.set(json: any): void
editor.get(): any
editor.destroy(): void
```

**Integration Pattern**:

```typescript
import JSONEditor from 'jsoneditor';

@ViewChild('editorContainer', { static: false })
container!: ElementRef;

editor: JSONEditor | null = null;

ngAfterViewInit() {
  this.editor = new JSONEditor(this.container.nativeElement, {
    mode: 'code',
    modes: ['code', 'tree'],
    onChange: () => {}
  });
  this.editor.set(this.sampleData);
}

ngOnDestroy() {
  if (this.editor) {
    this.editor.destroy();
  }
}
```

---

## Route Contract

**Route Configuration** (app.routes.ts):

```typescript
{
  path: 'jsoneditor-scroll-demo',
  loadChildren: () => import('./jsoneditor-scroll-demo/jsoneditor-scroll-demo.routes')
    .then(m => m.JSONEDITOR_SCROLL_DEMO_ROUTES)
}
```

**Feature Routes** (jsoneditor-scroll-demo.routes.ts):

```typescript
import { Routes } from "@angular/router";
import { JsonEditorScrollDemoComponent } from "./jsoneditor-scroll-demo.component";

export const JSONEDITOR_SCROLL_DEMO_ROUTES: Routes = [
  {
    path: "",
    component: JsonEditorScrollDemoComponent,
  },
];
```

**URL**: `/jsoneditor-scroll-demo`

**Navigation Example**:

```typescript
// In component
this.router.navigate(['/jsoneditor-scroll-demo']);

// In template
<a routerLink="/jsoneditor-scroll-demo">JSON Editor Scroll Demo</a>
```

---

## CSS Contract

**Component SCSS** structure:

```scss
:host {
  display: block;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.demo-header {
  margin-bottom: 32px;

  h1 {
    /* title styles */
  }
  p {
    /* description styles */
  }
}

.scenario-container {
  margin-bottom: 40px;

  .scenario-header {
    margin-bottom: 12px;

    h2 {
      /* scenario label */
    }
    p {
      /* scenario description */
    }
  }

  .editor-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: auto;

    // Size variants
    &.editor-small {
      height: 400px;
    }
    &.editor-vertical {
      height: 300px;
    }
    &.editor-horizontal {
      height: 300px;
      width: 400px;
    }
    &.editor-both {
      height: 300px;
      width: 500px;
    }
    &.editor-nested {
      height: 350px;
    }
    &.editor-long-lines {
      height: 300px;
      width: 400px;
    }
  }
}
```

**Required JSONEditor Styles** (imported globally or in component):

```scss
@import "jsoneditor/dist/jsoneditor.css";
```

---

## Testing Contracts

**Component Test Interface**:

```typescript
describe("JsonEditorScrollDemoComponent", () => {
  it("should create", () => {
    // Component instantiation test
  });

  it("should have 6 scroll scenarios", () => {
    // Verify SCROLL_SCENARIOS constant has 6 items
  });

  it("should initialize 6 JSONEditor instances after view init", () => {
    // Verify editors array populated in AfterViewInit
  });

  it("should destroy editors on component destruction", () => {
    // Verify cleanup in OnDestroy
  });

  it("should render all scenario labels", () => {
    // Verify template displays all 6 labels
  });
});
```

**No E2E tests required**: Internal development tool, manual testing acceptable

---

## Error Handling Contract

**No error handling required** for this demo:

- No user input validation
- No HTTP requests
- No async operations (beyond Angular lifecycle)
- Static data known to be valid

**Exception**: JSONEditor construction failure (unlikely)

```typescript
ngAfterViewInit() {
  try {
    this.editor = new JSONEditor(this.container.nativeElement, options);
  } catch (error) {
    console.error('Failed to initialize JSONEditor:', error);
    // Acceptable: console.error for development tool
  }
}
```

---

## Accessibility Contract

**ARIA Labels** (optional for demo, but good practice):

```html
<div
  class="editor-container"
  [attr.aria-label]="'JSON editor for ' + scenario.label"
  role="region"
>
  <div #editorContainer></div>
</div>
```

**Keyboard Navigation**: Handled by JSONEditor library (no custom implementation
needed)

---

## Performance Contract

**Metrics** (informal targets):

- Initial render: <500ms for all 6 editors
- Route load: <2s (lazy loading chunk)
- Memory: <100MB total (browser DevTools check)
- Scroll FPS: 60fps (smooth scrolling)

**No formal monitoring**: Use Chrome DevTools Performance tab for ad-hoc
verification

---

## Dependency Contract

**Required Dependencies** (all existing):

- `@angular/core`: ^19.2.0
- `@angular/common`: ^19.2.0
- `jsoneditor`: ^9.10.5

**No new dependencies required** ✅

**Peer Dependencies**: Satisfied by existing Angular installation

---

## Migration Contract

**Not applicable**: New feature, no migration needed

**Future deprecation plan**: None (demo tool can remain indefinitely)

---

## Security Contract

**No security concerns**:

- No user input
- No data persistence
- No API calls
- No authentication/authorization
- Static demo data only

**XSS Risk**: None (Angular sanitizes templates by default)

---

## Backwards Compatibility

**Not applicable**: New feature, no existing API to maintain

**Angular version compatibility**: Requires Angular 19.2+ (standalone
components)
