# Research: JSON Editor Scroll Behavior Demo

**Feature**: 001-jsoneditor-scroll-demo  
**Date**: 2026-02-25  
**Purpose**: Technical research for implementing multiple JSONEditor instances
with different scroll scenarios

## Research Tasks

### 1. JSONEditor Multiple Instance Management

**Decision**: Create separate JSONEditor instances in AfterViewInit with unique
container references

**Rationale**:

- JSONEditor library (v9.10.5) is already used in FormCreatorComponent with this
  pattern
- Each instance must bind to a unique DOM element via ViewChild/ElementRef
- Multiple instances on same page are supported - each maintains independent
  state
- Instances should be created once and reused (no recreation on change
  detection)

**Alternatives considered**:

- Dynamic component creation: Rejected - unnecessary complexity for fixed number
  of instances
- Single editor with content switching: Rejected - defeats purpose of
  simultaneous viewing
- Web Components wrapper: Rejected - adds dependency and complexity

**Implementation pattern** (from existing codebase):

```typescript
@ViewChild('editorContainer1', { static: false }) container1!: ElementRef;
editor1: JSONEditor | null = null;

ngAfterViewInit() {
  this.editor1 = new JSONEditor(this.container1.nativeElement, {
    mode: 'code',
    modes: ['code', 'tree'],
    onChange: () => {}
  });
}
```

### 2. Angular Change Detection Strategy

**Decision**: Use ChangeDetectionStrategy.OnPush with manual editor management

**Rationale**:

- OnPush prevents unnecessary re-renders when JSONEditor manipulates DOM
- JSONEditor operates outside Angular's change detection zone
- Demo data is static (no external state changes)
- Improves performance with 6 heavy component instances

**Alternatives considered**:

- Default change detection: Rejected - causes performance issues with multiple
  editors
- NgZone.runOutsideAngular: Not needed - OnPush already prevents over-checking

**Best practices**:

- Initialize editors in AfterViewInit (guaranteed DOM availability)
- Use static configuration objects (no binding to component properties)
- No need for ChangeDetectorRef since editors don't trigger Angular updates

### 3. Scroll Container Architecture

**Decision**: CSS-based scroll containers with fixed heights per scenario

**Rationale**:

- Each editor needs defined container with `overflow: auto` or
  `overflow: scroll`
- Height constraints force scrollbars when content exceeds container
- Independent scroll state maintained by browser (no JavaScript needed)
- Flexbox/Grid layout prevents scroll interference between instances

**Scroll scenarios to implement**:

1. **Small Content (No Scroll)**:

   - Container: 400px height
   - Content: ~20 lines JSON
   - Expected: No scrollbars

2. **Vertical Scroll Only**:

   - Container: 300px height
   - Content: 100+ lines JSON
   - Expected: Vertical scrollbar only

3. **Horizontal Scroll Only**:

   - Container: 300px height, 400px width
   - Content: Long single-line strings (200+ chars)
   - Expected: Horizontal scrollbar only

4. **Both Scrollbars**:

   - Container: 300px height, 500px width
   - Content: 100+ lines with long strings
   - Expected: Both scrollbars

5. **Deeply Nested**:

   - Container: 350px height
   - Content: Nested objects 10+ levels deep
   - Expected: Vertical scroll, tree mode useful

6. **Long Single Lines**:
   - Container: 300px height, 400px width
   - Content: Arrays with very long string values
   - Expected: Horizontal scroll in code mode

**CSS pattern**:

```scss
.editor-container {
  border: 1px solid #ccc;
  margin: 16px 0;

  &.small {
    height: 400px;
  }
  &.vertical {
    height: 300px;
  }
  &.horizontal {
    height: 300px;
    width: 400px;
  }
  &.both {
    height: 300px;
    width: 500px;
  }
  &.nested {
    height: 350px;
  }
  &.long-lines {
    height: 300px;
    width: 400px;
  }
}
```

### 4. Sample JSON Data Strategy

**Decision**: Inline TypeScript constants with representative data for each
scenario

**Rationale**:

- No external file loading needed (simplifies deployment)
- Type-safe with TypeScript interfaces
- Easy to modify during development
- Meets requirement FR-004 (pre-populated content)

**Data generation approach**:

```typescript
const SCROLL_SCENARIOS = {
  small: { type: "object", properties: { id: 1, name: "test" } },
  vertical: {
    /* 100 properties */
  },
  horizontal: { value: "very long string..." },
  // ... etc
};
```

**Alternatives considered**:

- External JSON files: Rejected - adds HTTP request overhead
- Server API: Rejected - demo should work offline
- Random generation: Rejected - not reproducible for testing

### 5. Performance Optimization

**Decision**: Lazy-load route, minimize watchers, use OnPush

**Rationale**:

- JSONEditor is ~400KB (minified) - lazy loading prevents main bundle bloat
- 6 editor instances = significant DOM manipulation
- OnPush + no event handlers = minimal change detection cycles
- Meets constitutional requirement (<500KB initial bundle)

**Performance checklist**:

- ✅ Lazy-loaded route (configured in app.routes.ts)
- ✅ OnPush change detection
- ✅ No observables/subscriptions (no need to unsubscribe)
- ✅ Static data (no HTTP requests during render)
- ✅ No global state mutations
- ✅ Fixed number of editor instances (no dynamic creation)

**Alternatives considered**:

- Virtual scrolling: Not applicable (need all visible simultaneously)
- Pagination: Rejected - defeats purpose of simultaneous comparison
- Progressive loading: Not needed - 6 instances acceptable

### 6. Route Configuration

**Decision**: Add lazy-loaded route in app.routes.ts following existing pattern

**Rationale**:

- Existing features use lazy-loaded routes (ag-grid-demo, configuration-manager)
- Consistent with project architecture
- Prevents JSONEditor bundle from loading until route accessed

**Route pattern**:

```typescript
{
  path: 'jsoneditor-scroll-demo',
  loadChildren: () => import('./jsoneditor-scroll-demo/jsoneditor-scroll-demo.routes')
    .then(m => m.JSONEDITOR_SCROLL_DEMO_ROUTES)
}
```

## Technology Stack Confirmation

| Technology       | Version | Status      | Purpose                 |
| ---------------- | ------- | ----------- | ----------------------- |
| Angular          | 19.2+   | ✅ Existing | Framework               |
| TypeScript       | 5.7+    | ✅ Existing | Language (strict mode)  |
| jsoneditor       | 9.10.5  | ✅ Existing | JSON editing component  |
| Angular Material | 19.2+   | ✅ Existing | Optional (cards/layout) |
| SCSS             | -       | ✅ Existing | Styling                 |
| Karma + Jasmine  | -       | ✅ Existing | Testing                 |

**No new dependencies required** - Constitutional compliance ✅

## Open Questions Resolved

**Q1**: How many editor instances is performant?  
**A**: 6 instances is acceptable. JSONEditor is optimized for this. Reference
implementation (FormCreatorComponent) uses 2 without issues.

**Q2**: Should editors be in code or tree mode?  
**A**: Configurable per instance - some scenarios better in code mode (long
lines), others in tree (nested). Allow both modes per JSONEditor options.

**Q3**: Should component be routable or embedded?  
**A**: Routable (dedicated page). Matches spec requirement FR-001 "dedicated
route/page" and prevents pollution of other views.

**Q4**: Need responsive design?  
**A**: No. Internal dev tool. Desktop-only acceptable. Fixed container widths
OK.

**Q5**: Should scroll behavior be configurable?  
**A**: No. Static demo scenarios only. Meets P1/P2 user stories. P3
(configurability) is deprioritized.

## Risk Assessment

| Risk                         | Impact | Mitigation                                                          |
| ---------------------------- | ------ | ------------------------------------------------------------------- |
| Performance with 6 instances | Medium | OnPush, lazy loading, static data                                   |
| JSONEditor CSS conflicts     | Low    | Component-scoped SCSS, existing usage proves compatibility          |
| Browser compatibility        | Low    | JSONEditor supports modern browsers, target same as Angular         |
| Memory leaks                 | Low    | No subscriptions, editors created once, component lifecycle cleanup |

## Next Steps

Phase 1 deliverables:

1. **data-model.md**: Define ScrollScenario interface and sample data structure
2. **contracts/**: Component interface (inputs/outputs if needed)
3. **quickstart.md**: Developer guide for running/modifying demo
