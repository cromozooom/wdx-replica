# Data Model: JSON Editor Scroll Behavior Demo

**Feature**: 001-jsoneditor-scroll-demo  
**Date**: 2026-02-25  
**Purpose**: Define data structures and sample content for scroll test scenarios

## Core Entities

### ScrollScenario

Represents a single test case configuration for JSONEditor scroll behavior.

**TypeScript Interface**:

```typescript
export interface ScrollScenario {
  id: string; // Unique identifier (e.g., 'small', 'vertical')
  label: string; // Display label shown to developer
  description: string; // Brief explanation of scenario purpose
  containerClass: string; // CSS class for container sizing
  editorMode: "code" | "tree"; // Initial editor mode
  sampleData: any; // JSON content to display
}
```

**Field Descriptions**:

- `id`: Kebab-case unique identifier, used as CSS class suffix and ViewChild
  reference
- `label`: Human-readable title displayed above editor instance
- `description`: 1-2 sentence explanation of what scroll behavior to observe
- `containerClass`: CSS class determining height/width constraints
- `editorMode`: JSONEditor display mode ('code' for text, 'tree' for expandable)
- `sampleData`: Any valid JSON structure appropriate for the scenario

**Validation Rules**:

- `id` must be unique across all scenarios
- `label` must not be empty
- `editorMode` must be 'code' or 'tree'
- `sampleData` must be valid JSON (object, array, primitive)

**Example Instance**:

```typescript
{
  id: 'small-content',
  label: 'Small Content - No Scroll',
  description: 'Compact JSON that fits without scrollbars',
  containerClass: 'editor-small',
  editorMode: 'tree',
  sampleData: {
    userId: 1,
    userName: "John Doe",
    isActive: true,
    role: "developer"
  }
}
```

## Sample Data Specifications

### 1. Small Content (No Scroll)

**Purpose**: Verify editor displays without scrollbars when content is minimal

**Structure**:

```json
{
  "id": 1,
  "name": "Test User",
  "email": "test@example.com",
  "active": true,
  "role": "developer",
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
```

**Characteristics**: ~15 lines, shallow nesting (2 levels), short values

---

### 2. Vertical Scroll Only

**Purpose**: Test vertical scrollbar behavior with tall content

**Structure**:

```json
{
  "users": [
    { "id": 1, "name": "User 1", "email": "user1@example.com" },
    { "id": 2, "name": "User 2", "email": "user2@example.com" }
    // ... repeat 50-100 items
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "pageSize": 100
  }
}
```

**Characteristics**: 100+ lines, array of objects, no overly long strings

---

### 3. Horizontal Scroll Only

**Purpose**: Test horizontal scrollbar with wide content

**Structure**:

```json
{
  "apiKey": "test_key_51234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890verylongkeythatextendsbeyondnormalviewport",
  "endpoint": "https://api.example.com/v1/longurlpath/with/multiple/segments/that/extends/beyond/typical/screen/width",
  "secretToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c_extended_with_more_content",
  "description": "This is a deliberately long description field that contains a significant amount of text without line breaks to force horizontal scrolling behavior in the JSON editor component"
}
```

**Characteristics**: <30 lines, very long string values (200+ chars each)

---

### 4. Both Scrollbars

**Purpose**: Test both vertical and horizontal scroll simultaneously

**Structure**:

```json
{
  "records": [
    {
      "id": 1,
      "longFieldName": "Very long content string here...",
      "anotherLongField": "Another very long content string...",
      "url": "https://example.com/very/long/path/..."
    }
    // ... repeat 80-100 items
  ]
}
```

**Characteristics**: 100+ lines AND long string values

---

### 5. Deeply Nested Structures

**Purpose**: Test tree view scrolling with deeply nested objects

**Structure**:

```json
{
  "level1": {
    "level2": {
      "level3": {
        "level4": {
          "level5": {
            "level6": {
              "level7": {
                "level8": {
                  "level9": {
                    "level10": {
                      "data": "deepest value",
                      "properties": ["a", "b", "c"]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "another_branch": {
    "nested": {
      /* ... similar depth */
    }
  }
}
```

**Characteristics**: 10+ nesting levels, best viewed in 'tree' mode

---

### 6. Long Single-Line Arrays

**Purpose**: Test horizontal scroll with array formatting

**Structure**:

```json
{
  "tags": ["tag1", "tag2", "tag3" /* ... 50 tags */],
  "longString": "A single line of text that goes on and on without any natural breaking points making it necessary to scroll horizontally to see the complete content which is exactly what we want to test",
  "ids": [10001, 10002, 10003 /* ... 100 numeric IDs */]
}
```

**Characteristics**: Arrays with many items, code mode forces horizontal scroll

---

## Data Generation Strategy

**Implementation Approach**: TypeScript constant with generated content

```typescript
// src/app/jsoneditor-scroll-demo/models/scroll-scenario.model.ts

import { ScrollScenario } from "./scroll-scenario.interface";

export const SCROLL_SCENARIOS: ScrollScenario[] = [
  {
    id: "small-content",
    label: "Small Content - No Scroll",
    description: "Compact JSON that fits entirely in view",
    containerClass: "editor-small",
    editorMode: "tree",
    sampleData: {
      /* small data */
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
    },
  },
  // ... additional scenarios
];
```

**Benefits**:

- Type-safe at compile time
- No runtime data loading
- Easy to modify during development
- Reproducible test cases
- Can use Array.from() for programmatic generation

## Container Sizing Model

**CSS Classes** (defined in component SCSS):

```scss
.editor-container {
  border: 1px solid #ddd;
  margin: 16px 0;
  overflow: auto;

  &.editor-small {
    height: 400px;
    width: 100%;
  }

  &.editor-vertical {
    height: 300px;
    width: 100%;
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
    width: 100%;
  }

  &.editor-long-lines {
    height: 300px;
    width: 400px;
  }
}
```

**Responsive Behavior**: Not required (internal dev tool, desktop-only)

## State Management

**Approach**: No state management needed

**Rationale**:

- Static demo data (no CRUD operations)
- No user input persistence
- No shared state between instances
- Each editor is independent
- Meets constitutional principle (avoid unnecessary complexity)

**Data Flow**:

```
SCROLL_SCENARIOS constant
  → Component initialization
  → JSONEditor.set(scenario.sampleData)
  → End (no updates)
```

## Memory Management

**Lifecycle**:

1. Component created (route navigation)
2. AfterViewInit: Create 6 JSONEditor instances
3. Set sample data once
4. Component destroyed (route navigation away)
5. JSONEditor cleanup (automatic via DOM removal)

**No manual cleanup required**: JSONEditor instances garbage collected when
component destroyed

## Validation

**Not required** for this demo feature:

- No user input
- No form validation
- No API contract validation
- Sample data is hardcoded and known-valid

## Relationships

**Entity Relationships**: None - isolated demo component with no external
dependencies

```
ScrollScenario (interface)
  ↓ (has-many, composition)
SCROLL_SCENARIOS (constant array)
  ↓ (used-by)
JsonEditorScrollDemoComponent
  ↓ (creates)
JSONEditor instances × 6
```

## Performance Considerations

**Data Size Estimates**:

- Small scenario: ~200 bytes
- Vertical scroll: ~10-15 KB (100 user objects)
- Horizontal scroll: ~2 KB (long strings)
- Both scrollbars: ~15-20 KB
- Nested: ~3-5 KB
- Long lines: ~5 KB

**Total**: ~40-50 KB of JSON data in memory (negligible)

**DOM Impact**: 6 JSONEditor instances = ~6 iframe elements + Monaco-like
editors (managed by library)

**Mitigation**: OnPush change detection, lazy-loaded route, no watchers

## Future Extensions (Out of Scope)

- ❌ Editable scenarios (P3 deprioritized)
- ❌ Custom data input
- ❌ Scenario persistence
- ❌ Export/import scenarios
- ❌ Performance metrics dashboard
- ❌ Automated scroll behavior testing

These could be added in future iterations if needed.
