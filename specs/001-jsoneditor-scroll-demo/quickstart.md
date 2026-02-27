# Quickstart Guide: JSON Editor Scroll Behavior Demo

**Feature**: 001-jsoneditor-scroll-demo  
**Date**: 2026-02-25  
**Purpose**: Developer guide for implementing, running, and modifying the JSON
Editor scroll demo

---

## Overview

This feature provides a dedicated test page with 6 JSONEditor instances
demonstrating different scroll behaviors. It's an internal development tool for
visually testing and debugging scroll-related issues with the jsoneditor
library.

**What you'll build**: A single-page Angular component at route
`/jsoneditor-scroll-demo` with 6 side-by-side editor instances.

**Time to implement**: ~2-3 hours for experienced Angular developer

---

## Prerequisites

✅ Angular 19.2+ project (already set up)  
✅ TypeScript 5.7+ with strict mode (already configured)  
✅ jsoneditor ^9.10.5 (already installed)  
✅ Basic understanding of Angular lifecycle hooks  
✅ Familiarity with ViewChild and ElementRef

**Check dependencies**:

```powershell
# From project root
Get-Content package.json | Select-String "jsoneditor"
# Should show: "jsoneditor": "^9.10.5"
```

---

## Implementation Steps

### Step 1: Create Feature Directory Structure

```powershell
# From src/app/
New-Item -ItemType Directory -Path "jsoneditor-scroll-demo"
New-Item -ItemType Directory -Path "jsoneditor-scroll-demo/models"
```

**Expected structure**:

```
src/app/jsoneditor-scroll-demo/
├── jsoneditor-scroll-demo.component.ts
├── jsoneditor-scroll-demo.component.html
├── jsoneditor-scroll-demo.component.scss
├── jsoneditor-scroll-demo.component.spec.ts
├── jsoneditor-scroll-demo.routes.ts
└── models/
    ├── scroll-scenario.interface.ts
    └── scroll-scenarios.constant.ts
```

---

### Step 2: Create TypeScript Interface

**File**: `src/app/jsoneditor-scroll-demo/models/scroll-scenario.interface.ts`

```typescript
export interface ScrollScenario {
  id: string;
  label: string;
  description: string;
  containerClass: string;
  editorMode: "code" | "tree";
  sampleData: unknown;
}
```

---

### Step 3: Create Sample Data Constant

**File**: `src/app/jsoneditor-scroll-demo/models/scroll-scenarios.constant.ts`

```typescript
import { ScrollScenario } from "./scroll-scenario.interface";

export const SCROLL_SCENARIOS: ScrollScenario[] = [
  {
    id: "small-content",
    label: "Small Content - No Scroll",
    description: "Compact JSON that fits entirely without scrollbars",
    containerClass: "editor-small",
    editorMode: "tree",
    sampleData: {
      userId: 1,
      userName: "John Doe",
      email: "john@example.com",
      isActive: true,
      role: "developer",
      settings: { theme: "dark", notifications: true },
    },
  },
  {
    id: "vertical-scroll",
    label: "Vertical Scroll Only",
    description: "Tall content requiring vertical scrollbar",
    containerClass: "editor-vertical",
    editorMode: "code",
    sampleData: {
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        active: i % 2 === 0,
      })),
      metadata: { total: 100, page: 1 },
    },
  },
  {
    id: "horizontal-scroll",
    label: "Horizontal Scroll Only",
    description: "Wide content with very long strings",
    containerClass: "editor-horizontal",
    editorMode: "code",
    sampleData: {
      apiKey:
        "sk_live_51234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890verylongkeythatextendsbeyondnormalviewport",
      endpoint:
        "https://api.example.com/v1/extremely/long/url/path/with/multiple/segments/that/extends/way/beyond/typical/screen/width/for/testing",
      description:
        "This is a deliberately long description field that contains a significant amount of text without line breaks to force horizontal scrolling behavior",
    },
  },
  {
    id: "both-scrollbars",
    label: "Both Scrollbars",
    description: "Tall and wide content requiring both scrollbars",
    containerClass: "editor-both",
    editorMode: "code",
    sampleData: {
      records: Array.from({ length: 80 }, (_, i) => ({
        id: i + 1,
        longFieldName: `This is record ${i + 1} with a very long value that will cause horizontal scrolling when displayed`,
        url: `https://example.com/path/to/resource/${i + 1}/with/very/long/segments`,
        timestamp: new Date().toISOString(),
      })),
    },
  },
  {
    id: "deeply-nested",
    label: "Deeply Nested Structures",
    description: "Multiple levels of nesting (best in tree mode)",
    containerClass: "editor-nested",
    editorMode: "tree",
    sampleData: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: {
                  level7: {
                    level8: {
                      level9: {
                        level10: {
                          data: "deepest value",
                          properties: ["a", "b", "c"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      anotherBranch: {
        nested: { deeper: { evenDeeper: { value: "test" } } },
      },
    },
  },
  {
    id: "long-lines",
    label: "Long Single-Line Arrays",
    description: "Arrays with many items causing horizontal scroll",
    containerClass: "editor-long-lines",
    editorMode: "code",
    sampleData: {
      tags: Array.from({ length: 50 }, (_, i) => `tag${i + 1}`),
      longString:
        "A single line of text that goes on and on without any natural breaking points making it necessary to scroll horizontally to see the complete content which is exactly what we want to test in this scenario",
      ids: Array.from({ length: 100 }, (_, i) => 10000 + i),
    },
  },
];
```

---

### Step 4: Create Component Class

**File**: `src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts`

```typescript
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  QueryList,
  ViewChildren,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import JSONEditor from "jsoneditor";
import { ScrollScenario } from "./models/scroll-scenario.interface";
import { SCROLL_SCENARIOS } from "./models/scroll-scenarios.constant";

@Component({
  selector: "app-jsoneditor-scroll-demo",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./jsoneditor-scroll-demo.component.html",
  styleUrls: ["./jsoneditor-scroll-demo.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonEditorScrollDemoComponent implements AfterViewInit, OnDestroy {
  scenarios: ScrollScenario[] = SCROLL_SCENARIOS;
  editors: (JSONEditor | null)[] = [];

  @ViewChildren("editorContainer")
  editorContainers!: QueryList<ElementRef>;

  ngAfterViewInit(): void {
    // Initialize all editors after view is ready
    this.editorContainers.forEach((containerRef, index) => {
      const scenario = this.scenarios[index];
      try {
        const editor = new JSONEditor(containerRef.nativeElement, {
          mode: scenario.editorMode,
          modes: ["code", "tree"],
          onChange: () => {},
        });
        editor.set(scenario.sampleData);
        this.editors.push(editor);
      } catch (error) {
        console.error(`Failed to initialize editor for ${scenario.id}:`, error);
        this.editors.push(null);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup all editor instances
    this.editors.forEach((editor) => {
      if (editor) {
        try {
          editor.destroy();
        } catch (error) {
          console.error("Error destroying editor:", error);
        }
      }
    });
    this.editors = [];
  }
}
```

---

### Step 5: Create Component Template

**File**: `src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.html`

```html
<div class="demo-header">
  <h1>JSON Editor Scroll Behavior Demo</h1>
  <p>
    This page demonstrates various scroll behaviors with multiple JSONEditor
    instances. Each scenario tests different content configurations to verify
    scroll functionality.
  </p>
</div>

<div class="scenarios-grid">
  <div *ngFor="let scenario of scenarios" class="scenario-container">
    <div class="scenario-header">
      <h2>{{ scenario.label }}</h2>
      <p class="description">{{ scenario.description }}</p>
    </div>
    <div
      class="editor-container"
      [ngClass]="scenario.containerClass"
      #editorContainer
    ></div>
  </div>
</div>
```

---

### Step 6: Create Component Styles

**File**: `src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.scss`

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
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }

  p {
    font-size: 16px;
    color: #666;
  }
}

.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 32px;
}

.scenario-container {
  .scenario-header {
    margin-bottom: 12px;

    h2 {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 4px;
      color: #444;
    }

    .description {
      font-size: 14px;
      color: #777;
      margin: 0;
    }
  }

  .editor-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: auto;
    background: #fff;

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

// Ensure JSONEditor styles are imported
@import "jsoneditor/dist/jsoneditor.css";
```

---

### Step 7: Create Route Configuration

**File**: `src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.routes.ts`

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

---

### Step 8: Register Route in App Routes

**File**: `src/app/app.routes.ts`

Add the lazy-loaded route:

```typescript
// ... existing imports
{
  path: 'jsoneditor-scroll-demo',
  loadChildren: () => import('./jsoneditor-scroll-demo/jsoneditor-scroll-demo.routes')
    .then(m => m.JSONEDITOR_SCROLL_DEMO_ROUTES)
},
// ... other routes
```

---

### Step 9: Create Basic Unit Test

**File**:
`src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { JsonEditorScrollDemoComponent } from "./jsoneditor-scroll-demo.component";

describe("JsonEditorScrollDemoComponent", () => {
  let component: JsonEditorScrollDemoComponent;
  let fixture: ComponentFixture<JsonEditorScrollDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonEditorScrollDemoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JsonEditorScrollDemoComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have 6 scroll scenarios", () => {
    expect(component.scenarios.length).toBe(6);
  });

  it("should initialize empty editors array", () => {
    expect(component.editors).toEqual([]);
  });
});
```

---

## Running the Demo

### Start Development Server

```powershell
# From project root
npm start
# or
ng serve
```

### Navigate to Demo

Open browser to: `http://localhost:4200/jsoneditor-scroll-demo`

**Expected result**: Page displays 6 labeled JSONEditor instances, each
demonstrating different scroll behavior.

---

## Testing Scroll Behaviors

### Manual Test Checklist

1. **Small Content**: ✅ No scrollbars visible, all content fits
2. **Vertical Scroll**: ✅ Vertical scrollbar present, can scroll up/down
3. **Horizontal Scroll**: ✅ Horizontal scrollbar present, can scroll left/right
4. **Both Scrollbars**: ✅ Both scrollbars present, can scroll in all directions
5. **Deeply Nested**: ✅ Tree view expands/collapses, vertical scroll works
6. **Long Lines**: ✅ Horizontal scroll for long arrays in code mode

### Browser Testing

Test in:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

---

## Customization Guide

### Adding New Scenarios

**Edit**: `src/app/jsoneditor-scroll-demo/models/scroll-scenarios.constant.ts`

```typescript
export const SCROLL_SCENARIOS: ScrollScenario[] = [
  // ... existing scenarios
  {
    id: "my-custom-scenario",
    label: "My Custom Test",
    description: "Description of what I am testing",
    containerClass: "editor-custom", // Add CSS for this class
    editorMode: "code",
    sampleData: {
      /* your test data */
    },
  },
];
```

**Add CSS** for new container class in component SCSS:

```scss
.editor-container {
  &.editor-custom {
    height: 350px;
    width: 600px;
  }
}
```

### Modifying Existing Scenarios

Simply edit the `sampleData` field in `scroll-scenarios.constant.ts`:

```typescript
{
  id: 'vertical-scroll',
  // ... other properties
  sampleData: {
    myCustomData: Array.from({ length: 200 }, (_, i) => ({
      // your modified structure
    }))
  }
}
```

Save and reload browser - changes reflect immediately (hot module replacement).

---

## Troubleshooting

### JSONEditor styles not loading

**Problem**: Editors display but look unstyled  
**Solution**: Ensure jsoneditor CSS is imported. Add to `angular.json`:

```json
"styles": [
  "node_modules/jsoneditor/dist/jsoneditor.css",
  "src/styles.scss"
]
```

### Editors not initializing

**Problem**: Blank containers, console errors  
**Solution**: Check AfterViewInit timing. ViewChildren may not be ready. Use
setTimeout as workaround:

```typescript
ngAfterViewInit(): void {
  setTimeout(() => {
    // initialization code
  }, 0);
}
```

### Scroll not working

**Problem**: Content visible but no scroll  
**Solution**: Check container has `overflow: auto` and fixed height/width in
CSS.

### Route not found

**Problem**: 404 when navigating to `/jsoneditor-scroll-demo`  
**Solution**: Verify route added to `app.routes.ts` and lazy loading syntax is
correct.

---

## Performance Tips

1. **OnPush Change Detection**: Already configured - don't switch to Default
2. **Lazy Loading**: Route is lazy-loaded - editor bundle only loads when
   visited
3. **No Watchers**: Avoid adding observables or event listeners
4. **Fixed Instances**: Don't dynamically create/destroy editors after init

---

## Next Steps

After implementation:

1. ✅ Run `ng test` to verify unit tests pass
2. ✅ Run `ng lint` to check code quality
3. ✅ Test in multiple browsers
4. ✅ Document any scroll issues discovered
5. ✅ Use findings to fix scroll problems in actual application

---

## Resources

- **JSONEditor Docs**: https://github.com/josdejong/jsoneditor
- **Angular Lifecycle Hooks**: https://angular.dev/guide/components/lifecycle
- **ViewChild/ViewChildren**: https://angular.dev/api/core/ViewChild
- **Lazy Loading**:
  https://angular.dev/guide/routing/common-router-tasks#lazy-loading

---

## Support

For questions or issues:

1. Check existing FormCreatorComponent for reference implementation
2. Review this quickstart guide
3. Consult project constitution for code standards
4. Ask team members familiar with Angular patterns

**Estimated completion time**: 2-3 hours (implementation + testing)
