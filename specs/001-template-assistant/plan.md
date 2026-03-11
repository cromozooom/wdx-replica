# Implementation Plan: Intelligent Template Assistant

**Branch**: `001-template-assistant` | **Date**: 2026-03-10 | **Spec**:
[spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-template-assistant/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an intelligent document template editor that allows bank analysts to
create reusable templates with atomic "pill" nodes representing customer data
fields (e.g., Full Name, Date of Birth, Sort Code). The editor uses **Milkdown**
(MANDATORY due to licensing requirements) with custom pill plugins for atomic
node behavior, preventing data corruption through smart interaction patterns
(atomic deletion, click-to-edit, arrow key navigation). Templates are stored in
browser localStorage with download/upload capabilities, and a live preview pane
shows real-time merging of templates with customer data. The system targets
<50ms preview interpolation, 60fps typing performance, and zero-lag display of
1,000+ customer records in AG-Grid integration.

**Technical Approach**: Milkdown v7.19.0 (115 KB gzipped, 15 KB over
constitutional budget but justified by mandatory licensing) with lazy loading,
custom atomic pill nodes via ProseMirror schema, Angular 19+ standalone
components with OnPush change detection, localStorage persistence with auto-save
drafts, and plain HTML email output.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode) with Angular 19.2+  
**Primary Dependencies**: Milkdown v7.19.0 (~115 KB: core 30 KB +
preset-commonmark 40 KB + preset-gfm 15 KB + plugins 25 KB + date-fns 3 KB),
Angular Material 19.2+, ag-grid-enterprise 33.3+, RxJS 7.5+, @ngrx/signals  
**Storage**: Browser localStorage for template persistence, draft auto-save
every 30 seconds, download/upload to file system  
**Testing**: Karma + Jasmine (existing framework)  
**Target Platform**: Modern web browsers (Chrome 120+, Firefox 120+, Safari 17+,
Edge 120+)  
**Project Type**: Web application (Angular SPA) - single frontend codebase  
**Performance Goals**: <50ms preview interpolation for template merging, 60fps
editor typing experience, 1,000+ AG-Grid rows with zero lag, <3 seconds to swap
data fields via arrow key or click-to-edit  
**Constraints**: Editor bundle <100KB gzipped (EXCEPTION: Milkdown 115 KB
justified by mandatory licensing + lazy loading), lazy-loaded feature module
(zero initial bundle impact), OnPush change detection, plain HTML email output
with minimal styling  
**Scale/Scope**: 1,000+ customer records in AG-Grid, 20-30 data field keys
(columns), template CRUD operations, undo/redo support, atomic pill interaction
patterns (FR-020 to FR-023), auto-save drafts + manual save workflow

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: Minimal Dependencies

**Status**: ⚠️ **CONDITIONAL PASS** (requires documented exception)

**New Dependency**: Milkdown v7.19.0 with plugins

**Justification**:

- **Necessity**: ✅ MANDATORY due to licensing requirements (TipTap MIT license
  incompatible with project requirements)
- **Bundle Impact**: ⚠️ 115 KB gzipped (15 KB over <100KB constitutional limit)
  - Mitigation: Lazy-loaded feature module (zero initial bundle impact)
  - Context: Application budget is <500KB total; 115 KB for mandatory editor
    leaves 385 KB for other features
  - Breakdown: core 30 KB + preset-commonmark 40 KB + preset-gfm 15 KB + plugins
    25 KB + date-fns 3 KB
- **Maintenance**: ✅ Active (v7.19.0 Jan 2026, 11.2k stars, weekly releases,
  50+ contributors)
- **Tree-shakeable**: ✅ Modular plugin architecture allows selective imports
- **Alternatives**: ❌ No lighter alternatives meet licensing requirements
  - TipTap: 28 KB but MIT license BLOCKED
  - ProseMirror: 40-50 KB but requires 4-6 weeks custom development
  - Quill: 56 KB but not markdown-native, limited atomic node support
  - Monaco: 100-200+ KB too heavy

**Exception Granted**: Constitutional Principle I allows exceptions for
mandatory business requirements. The 15 KB overage with lazy loading mitigation
is acceptable given no viable alternatives meeting licensing constraints.

---

### Principle II: Clean Code Standards

**Status**: ✅ **PASS**

**Commitments**:

- TypeScript strict mode enforced (tsconfig.json: `"strict": true`)
- Smart/Dumb component pattern: TemplateEditorComponent (smart - Milkdown
  lifecycle, localStorage), TemplatePreviewComponent (dumb - display merged
  data)
- Functions <30 lines, components <300 lines
- Self-documenting code with WHY comments only
- DRY principle: Extract pill node logic into reusable plugin modules

**Implementation Strategy**:

- Milkdown pill plugin extracted to `src/app/template-assistant/plugins/pill/`
  with separate files for node schema, input rules, commands, markdown
  serialization
- Template management service (`TemplateStorageService`) handles localStorage
  CRUD
- Customer data service (`CustomerDataService`) handles AG-Grid integration
- Preview service (`TemplatePreviewService`) handles merge logic

---

### Principle III: Component Architecture

**Status**: ✅ **PASS**

**Commitments**:

- **Standalone First**: All new components will be Angular 19+ standalone
  components
- **Smart/Dumb Pattern**:
  - **Smart**: `TemplateEditorComponent` (Milkdown lifecycle, event handling,
    state management)
  - **Smart**: `TemplateManagerComponent` (localStorage CRUD, template
    selection)
  - **Dumb**: `TemplatePreviewComponent` (input: template + customerData,
    output: merged HTML)
  - **Dumb**: `DataFieldSelectorComponent` (input: available fields, output:
    selected field event)
- **Single Concern**: Each component represents one UI concept (editor, preview,
  selector, manager)
- **Reactive Patterns**: RxJS for event streams, @ngrx/signals for template
  state management
- **Template Complexity**: Business logic in services, UI logic in component
  classes, minimal template expressions
- **Reusability**: Pill node plugin is reusable across any Milkdown-based
  editing feature

**Module Structure**:

```
src/app/template-assistant/
├── components/
│   ├── template-editor/        # Smart: Milkdown editor wrapper
│   ├── template-preview/        # Dumb: Preview pane with merged data
│   ├── data-field-selector/    # Dumb: Field selection dropdown
│   └── template-manager/        # Smart: Template CRUD UI
├── services/
│   ├── template-storage.service.ts
│   ├── customer-data.service.ts
│   └── template-preview.service.ts
└── plugins/
    └── pill/
        ├── pill-node.ts         # ProseMirror node schema
        ├── pill-inputrule.ts    # Trigger character detection
        ├── pill-command.ts      # Insert/delete commands
        ├── pill-markdown.ts     # Markdown serialization
        └── index.ts             # Plugin composition
```

---

### Principle IV: Performance First

**Status**: ✅ **PASS**

**Commitments**:

- **Bundle Size**: Milkdown 115 KB lazy-loaded (zero initial bundle impact),
  feature module code-split
- **Change Detection**: OnPush strategy for all components, use Milkdown
  listener plugin + ChangeDetectorRef.markForCheck()
- **Lazy Loading**: Template assistant feature module lazy-loaded via Angular
  router
- **Memory Management**:
  - Destroy Milkdown editor instance in ngOnDestroy
  - Use takeUntil for RxJS subscriptions
  - Milkdown initialization in NgZone.runOutsideAngular() to prevent Zone.js
    thrashing
- **Asset Optimization**: N/A (no images in this feature)
- **Rendering**:
  - Target 60fps editor typing (Milkdown handles efficiently)
  - <50ms template preview interpolation (simple string replacement)
  - AG-Grid virtual scrolling for 1,000+ customer rows (already configured)

**Performance Targets** (from spec.md):

- ✅ <50ms preview interpolation
- ✅ 60fps editor typing
- ✅ 1,000+ AG-Grid rows with zero lag
- ✅ <3 seconds to swap data fields via arrow key or click-to-edit

---

### Overall Gate Assessment

**Result**: ✅ **PASS WITH DOCUMENTED EXCEPTION**

All constitutional principles are satisfied. Principle I (Minimal Dependencies)
has a documented exception for Milkdown's 15 KB bundle overage, justified by:

1. MANDATORY licensing requirement (no alternatives available)
2. Lazy loading mitigation (zero initial bundle impact)
3. Remaining within overall <500KB application budget (385 KB available)

**Action**: Proceed to Phase 0 (research.md generation) and Phase 1 (design
artifacts)

## Project Structure

### Documentation (this feature)

```text
specs/001-template-assistant/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command) ✅ Complete
├── data-model.md        # Phase 1 output (/speckit.plan command) ✅ Complete
├── quickstart.md        # Phase 1 output (/speckit.plan command) ✅ Complete
├── contracts/           # Phase 1 output (/speckit.plan command) ✅ Complete
│   └── component-interfaces.md
├── checklists/          # Validation checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET CREATED)
```

### Source Code (repository root)

**Project Type**: Angular 19+ Single Page Application (SPA)

```text
src/app/
├── template-assistant/                    # Feature module (lazy-loaded)
│   ├── template-assistant.routes.ts       # Feature routing
│   ├── components/
│   │   ├── template-editor/               # Smart: Milkdown editor wrapper
│   │   │   ├── template-editor.component.ts
│   │   │   ├── template-editor.component.html
│   │   │   ├── template-editor.component.scss
│   │   │   └── template-editor.component.spec.ts
│   │   ├── template-preview/              # Dumb: Preview pane with merged data
│   │   │   ├── template-preview.component.ts
│   │   │   ├── template-preview.component.html
│   │   │   ├── template-preview.component.scss
│   │   │   └── template-preview.component.spec.ts
│   │   ├── data-field-selector/           # Dumb: Field selection dropdown
│   │   │   ├── data-field-selector.component.ts
│   │   │   ├── data-field-selector.component.html
│   │   │   ├── data-field-selector.component.scss
│   │   │   └── data-field-selector.component.spec.ts
│   │   └── template-manager/              # Smart: Template CRUD UI
│   │       ├── template-manager.component.ts
│   │       ├── template-manager.component.html
│   │       ├── template-manager.component.scss
│   │       └── template-manager.component.spec.ts
│   ├── services/
│   │   ├── template-storage.service.ts    # localStorage CRUD operations
│   │   ├── template-storage.service.spec.ts
│   │   ├── customer-data.service.ts       # AG-Grid customer data integration
│   │   ├── customer-data.service.spec.ts
│   │   ├── template-preview.service.ts    # Template merging logic
│   │   └── template-preview.service.spec.ts
│   ├── plugins/                           # Milkdown custom plugins
│   │   └── pill/
│   │       ├── pill-node.ts               # ProseMirror node schema (atomic)
│   │       ├── pill-inputrule.ts          # Trigger character detection ([, {{)
│   │       ├── pill-command.ts            # Insert/delete commands
│   │       ├── pill-markdown.ts           # Markdown serialization
│   │       └── index.ts                   # Plugin composition/export
│   ├── models/
│   │   ├── template.model.ts              # DocumentTemplate interface
│   │   ├── data-field.model.ts            # DataField interface
│   │   ├── customer.model.ts              # Customer interface
│   │   └── merged-document.model.ts       # MergedDocument interface
│   └── state/
│       └── template.store.ts              # @ngrx/signals state management

src/core/                                   # Shared core services
└── services/
    └── [existing services...]             # Reuse existing core services

src/assets/                                 # Static assets
└── templates/
    └── sample-customer-data.json          # Sample data for preview (Adrian Sterling)

```

**Structure Decision**:

This feature is implemented as a lazy-loaded Angular feature module under
`src/app/template-assistant/`. The structure follows Angular 19+ standalone
component architecture with:

- **Components** organized by responsibility (smart vs. dumb pattern)
- **Services** for business logic (template storage, customer data, preview
  merging)
- **Plugins** for Milkdown custom pill functionality (atomic nodes, input rules,
  commands)
- **Models** for TypeScript interfaces (DocumentTemplate, DataField, Customer,
  MergedDocument)
- **State** for @ngrx/signals state management (template selection, draft
  tracking)

The feature integrates with existing project infrastructure:

- **AG-Grid integration**: Reuses existing AG-Grid configuration from
  `src/app/jobs-grid/` or similar
- **localStorage utilities**: May leverage existing core utilities if available
- **Routing**: Lazy-loaded route registered in `src/app/app.routes.ts`

**Test Structure** (following Karma + Jasmine convention):

```text
src/app/template-assistant/
├── components/
│   └── [component-name]/
│       └── [component-name].component.spec.ts  # Component unit tests
└── services/
    └── [service-name].service.spec.ts          # Service unit tests
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                                 | Why Needed                                                                | Simpler Alternative Rejected Because                                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Milkdown bundle 115 KB (15 KB over limit) | MANDATORY due to licensing requirements (TipTap MIT license incompatible) | TipTap (28 KB) rejected due to license conflict; ProseMirror (40-50 KB) requires 4-6 weeks custom dev; Quill (56 KB) lacks markdown-native editing; Monaco (100-200+ KB) too heavy |
