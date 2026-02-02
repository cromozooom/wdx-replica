# Implementation Plan: Configuration Manager

**Branch**: `001-config-manager` | **Date**: 2026-02-02 | **Spec**:
[spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-config-manager/spec.md`

## Summary

Multi-format configuration management system with CRUD operations, version
tracking, export/import via ZIP, and conflict detection. Users can create/edit
six types of configurations (JSON, FetchXML, text) using specialized editors
(JSON editor, Ace editor), track changes with update history (Jira integration,
markdown comments), view/filter configurations in AG-Grid Enterprise, and
export/import as ZIP archives with side-by-side comparison for conflict
resolution.

**Technical Approach**: Leverage existing dependencies (ag-grid-enterprise,
jsoneditor, ace-builds, jszip, ng-bootstrap) to build standalone Angular
components following smart/dumb pattern with OnPush change detection and
reactive state management using signals.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode) with Angular 19.2+  
**Primary Dependencies**:

- ag-grid-angular 33.3.2 & ag-grid-enterprise 33.3.2 (grid display)
- jsoneditor 9.10.5 (JSON editing)
- ace-builds 1.33.1 (FetchXML/text editing)
- jszip 3.10.1 (ZIP archive creation/extraction)
- @ng-bootstrap/ng-bootstrap 18.0.0 (modals, dropdowns)
- file-saver 2.0.2 (file downloads)
- ngx-markdown 19.1.1 (markdown rendering for comments)

**Storage**: Browser LocalStorage or IndexedDB for persistence (no backend
required for MVP)  
**Testing**: Karma + Jasmine (existing project setup)  
**Target Platform**: Modern browsers (Chrome 100+, Firefox 100+, Edge 100+,
Safari 15+)  
**Project Type**: Single Angular web application  
**Performance Goals**:

- Grid renders 100+ configurations in <2 seconds
- Editor loads in <500ms
- ZIP export/import completes in <5 seconds for 10 configurations
- File size validation prevents >10MB per configuration

**Constraints**:

- No new dependencies allowed (use existing only)
- Bundle size impact <100KB (gzipped) for feature module
- OnPush change detection required for all components
- All components must be standalone (Angular 19+)
- TypeScript strict mode with zero `any` types

**Scale/Scope**:

- Support up to 500 configurations stored locally
- Handle ZIP files up to 50MB
- 6 configuration types total
- Single-user local application (no multi-user concurrency)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: Minimal Dependencies ✅ PASS

**Status**: COMPLIANT - No new dependencies required

- ag-grid-enterprise 33.3.2 ✅ Already approved core dependency
- jsoneditor 9.10.5 ✅ Existing in package.json
- ace-builds 1.33.1 ✅ Existing in package.json
- jszip 3.10.1 ✅ Existing in package.json
- @ng-bootstrap/ng-bootstrap 18.0.0 ✅ Existing in package.json
- file-saver 2.0.2 ✅ Existing in package.json
- ngx-markdown 19.1.1 ✅ Existing in package.json

**Analysis**: All required libraries are already in package.json. No bundle
bloat from new dependencies.

### Principle II: Clean Code Standards ✅ PASS

**Enforcement Strategy**:

- Max 30 lines per function enforced via ESLint
- Max 300 lines per component enforced via code review
- TypeScript strict mode enabled - zero `any` types allowed
- Self-documenting code - descriptive names for all entities
- DRY principle - shared services for configuration operations, validators, and
  ZIP handling

**Component Breakdown**:

- ConfigurationManagerComponent (smart) - <250 lines
- ConfigurationGridComponent (dumb) - <200 lines
- ConfigurationEditorComponent (smart) - <300 lines
- JsonEditorComponent (dumb) - <150 lines
- AceEditorComponent (dumb) - <150 lines
- ConfigurationMetadataFormComponent (dumb) - <200 lines
- UpdateHistoryComponent (dumb) - <150 lines
- ImportWizardComponent (smart) - <300 lines
- ConflictComparisonComponent (dumb) - <250 lines

Total: 9 components, all within constitutional limits

### Principle III: Component Architecture ✅ PASS

**Architecture**:

- **Smart Components** (3): ConfigurationManagerComponent,
  ConfigurationEditorComponent, ImportWizardComponent
  - Handle data fetching, state management, business logic
  - Use @ngrx/signals for reactive state
- **Dumb Components** (6): All editor, form, grid, and comparison components
  - Input/Output only
  - No direct state management
  - Pure presentation logic

- **Standalone First**: All 9 components will be standalone (Angular 19+)
- **Single Concern**: Each component has one clear responsibility
- **Reactive Patterns**: RxJS for async operations, signals for state

### Principle IV: Performance First ✅ PASS

**Performance Strategy**:

- **Bundle Size**: Lazy load configuration manager module (<100KB target)
- **Change Detection**: OnPush strategy on all components
- **Memory Management**:
  - Unsubscribe using takeUntilDestroyed()
  - Dispose editors on component destroy
  - Clear large ZIP data after processing
- **Rendering**:
  - AG-Grid virtual scrolling for large datasets
  - trackBy functions for all \*ngFor loops
  - Debounce search/filter inputs (300ms)
- **Asset Optimization**:
  - Lazy load jsoneditor and ace-builds only when editor opens
  - Chunk ZIP processing for large files

**Measured Goals**:

- Initial module load: <500ms
- Grid render (100 items): <2s
- Editor open: <500ms
- ZIP export (10 configs): <5s

## Constitution Re-check After Design

✅ **ALL GATES PASSED** - No violations, no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-config-manager/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions and patterns
├── data-model.md        # Phase 1: Entity definitions and relationships
├── quickstart.md        # Phase 1: Developer onboarding guide
├── contracts/           # Phase 1: Service interfaces (if needed)
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Specification validation (complete)
└── tasks.md             # Phase 2: Implementation task list (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/app/
├── configuration-manager/              # Feature module (lazy-loaded)
│   ├── configuration-manager.component.ts       # Smart: Main container
│   ├── configuration-manager.component.html
│   ├── configuration-manager.component.scss
│   ├── configuration-manager.routes.ts          # Lazy route config
│   │
│   ├── components/                              # Presentation components
│   │   ├── configuration-grid/
│   │   │   ├── configuration-grid.component.ts  # Dumb: AG-Grid wrapper
│   │   │   ├── configuration-grid.component.html
│   │   │   └── configuration-grid.component.scss
│   │   ├── configuration-editor/
│   │   │   ├── configuration-editor.component.ts # Smart: Editor orchestrator
│   │   │   ├── configuration-editor.component.html
│   │   │   └── configuration-editor.component.scss
│   │   ├── json-editor/
│   │   │   ├── json-editor.component.ts         # Dumb: JSONEditor wrapper
│   │   │   ├── json-editor.component.html
│   │   │   └── json-editor.component.scss
│   │   ├── ace-editor/
│   │   │   ├── ace-editor.component.ts          # Dumb: Ace wrapper
│   │   │   ├── ace-editor.component.html
│   │   │   └── ace-editor.component.scss
│   │   ├── configuration-metadata-form/
│   │   │   ├── configuration-metadata-form.component.ts # Dumb: Metadata form
│   │   │   ├── configuration-metadata-form.component.html
│   │   │   └── configuration-metadata-form.component.scss
│   │   ├── update-history/
│   │   │   ├── update-history.component.ts      # Dumb: Update list
│   │   │   ├── update-history.component.html
│   │   │   └── update-history.component.scss
│   │   ├── import-wizard/
│   │   │   ├── import-wizard.component.ts       # Smart: Import flow
│   │   │   ├── import-wizard.component.html
│   │   │   └── import-wizard.component.scss
│   │   └── conflict-comparison/
│   │       ├── conflict-comparison.component.ts # Dumb: Side-by-side diff
│   │       ├── conflict-comparison.component.html
│   │       └── conflict-comparison.component.scss
│   │
│   ├── models/                                   # TypeScript interfaces
│   │   ├── configuration.model.ts               # Configuration entity
│   │   ├── configuration-type.enum.ts           # Type enumeration
│   │   ├── update-entry.model.ts                # Update history entry
│   │   └── export-package.model.ts              # ZIP structure
│   │
│   ├── services/                                 # Business logic services
│   │   ├── configuration.service.ts             # CRUD operations
│   │   ├── configuration-storage.service.ts     # LocalStorage/IndexedDB
│   │   ├── configuration-export.service.ts      # ZIP export logic
│   │   ├── configuration-import.service.ts      # ZIP import + conflict detection
│   │   ├── configuration-validator.service.ts   # Validation (JSON, FetchXML, version)
│   │   └── team-member.service.ts               # Team member list provider
│   │
│   ├── store/                                    # State management (@ngrx/signals)
│   │   ├── configuration.store.ts               # Configuration state
│   │   └── import-wizard.store.ts               # Import wizard state
│   │
│   └── utils/                                    # Utility functions
│       ├── version-validator.ts                 # V#.#.# format validation
│       ├── jira-validator.ts                    # WPO-##### format validation
│       └── semantic-version-comparator.ts       # Version sorting logic
│
src/assets/                                       # Static assets
└── configuration-templates/                      # Default templates
    ├── dashboard-config.json
    ├── form-config.json
    ├── process.json
    ├── system-settings.json
    ├── fetchxml-query.xml
    └── dashboard-query.xml
```

**Structure Decision**: Angular single-project structure with lazy-loaded
feature module. All components are standalone (Angular 19+). The
configuration-manager module is lazily loaded to minimize initial bundle size.
Services use dependency injection, components follow smart/dumb pattern, and
state is managed with @ngrx/signals for reactivity.

## Complexity Tracking

> No complexity tracking needed - all constitutional gates passed.

---

## Planning Phase Summary

### Phase 0: Research ✅ COMPLETE

**Output**: [research.md](research.md)

**Key Decisions**:

- JSON editing: jsoneditor 9.10.5 (existing)
- Code editing: ace-builds 1.33.1 (existing)
- Data grid: ag-grid-enterprise 33.3.2 (existing)
- ZIP handling: jszip 3.10.1 (existing)
- Persistence: IndexedDB native API (no wrapper)
- XML validation: DOMParser native (no library)
- Modals: @ng-bootstrap/ng-bootstrap 18.0.0 (existing)
- File download: file-saver 2.0.2 (existing)

**Result**: Zero new dependencies required, all technologies researched and
patterns documented.

### Phase 1: Design ✅ COMPLETE

**Outputs**:

- [data-model.md](data-model.md) - Entity definitions, relationships, state
  management
- [quickstart.md](quickstart.md) - Developer onboarding guide
- `.github/agents/copilot-instructions.md` - Updated agent context

**Key Deliverables**:

- 5 entity definitions (Configuration, ConfigurationType, UpdateEntry,
  ExportPackage, ImportConflict)
- IndexedDB schema with indexes
- @ngrx/signals store architecture
- Data flow diagrams for CRUD, export, import
- Component architecture (9 components, 3 smart/6 dumb)

**Result**: Complete technical design ready for task breakdown.

### Constitution Re-check Post-Design ✅ ALL GATES PASSED

- **Minimal Dependencies**: ✅ Zero new dependencies
- **Clean Code Standards**: ✅ All components <300 lines, functions <30 lines
- **Component Architecture**: ✅ Smart/dumb pattern, standalone components
- **Performance First**: ✅ Lazy loading, OnPush, virtual scrolling, memory
  management

**Bundle Impact**: Estimated <100KB (gzipped) for lazy-loaded feature module

### Next Steps

1. **Run `/speckit.tasks`** - Generate implementation task list from this plan
2. **Run `/speckit.implement`** - Execute tasks to build the feature

### Feature Readiness

**Status**: ✅ **READY FOR TASK GENERATION**

All planning phases complete. No blockers. No new dependencies required.
Constitutional compliance verified. Technical design finalized.

---

**Plan Version**: 1.0  
**Last Updated**: 2026-02-02  
**Status**: COMPLETE
