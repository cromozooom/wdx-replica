# Implementation Plan: SPX Magic Selector

**Branch**: `001-spx-magic-selector` | **Date**: February 14, 2026 | **Spec**:
[spec.md](spec.md) **Input**: Feature specification from
`/specs/001-spx-magic-selector/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Advanced lookup component combining ng-select dropdown functionality with a
full-screen discovery modal featuring ag-grid for complex form/document
selection with entity-query relationships, contextual previews, and real-time
data validation.

## Technical Context

**Language/Version**: TypeScript 5.7+ with strict mode enabled  
**Primary Dependencies**: Angular 19.2+, Angular Material 19.2+, ng-select,
ag-grid-enterprise 33.3+  
**Storage**: In-memory mock data service (no persistence for initial
implementation)  
**Testing**: Karma + Jasmine (existing project setup)  
**Target Platform**: Web application (Angular SPA) **Project Type**: Angular
component library integration within existing web application  
**Performance Goals**: <1s selection response, <2s preview loading, <3s record
count updates  
**Constraints**: <500KB initial bundle impact, OnPush change detection required,
Bootstrap classes only for styling  
**Scale/Scope**: Support 100+ form-query combinations, handle 10k+ record
previews efficiently

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Minimal Dependencies (NON-NEGOTIABLE)

- ✅ **PASS**: No new dependencies required - uses existing approved libraries
  (ng-select, ag-grid-enterprise, Angular Material)
- ✅ **PASS**: All dependencies are already established in project baseline
- ✅ **PASS**: ng-select is tree-shakeable and actively maintained
- ✅ **PASS**: Bundle impact analysis not required as no new dependencies added

### II. Clean Code Standards

- ✅ **PASS**: Component architecture follows smart/dumb pattern
- ✅ **PASS**: Single responsibility - each component has one UI concern
- ✅ **PASS**: TypeScript strict mode compliance planned
- ✅ **PASS**: Functions will be limited to 30 lines, components to 300 lines
- ✅ **PASS**: Self-documenting code principles will be followed

### III. Component Architecture

- ✅ **PASS**: Standalone components planned (Angular 19+ pattern)
- ✅ **PASS**: Smart/dumb component separation implemented
- ✅ **PASS**: OnPush change detection strategy required in constraints
- ✅ **PASS**: Reactive patterns with RxJS for data flow
- ✅ **PASS**: Reusable component design for potential library extraction

### IV. Performance First

- ✅ **PASS**: Bundle size monitored - no new dependencies
- ✅ **PASS**: OnPush change detection mandated in constraints
- ✅ **PASS**: Performance goals defined: <1s response, <2s loading
- ✅ **PASS**: Memory management with proper observable handling
- ✅ **PASS**: Virtual scrolling considerations for large data sets

**GATE STATUS: ✅ PASS** - All constitutional requirements satisfied

### Post-Design Re-evaluation _(After Phase 1)_

**Re-checked**: February 14, 2026 after data model and contracts definition

#### I. Minimal Dependencies (NON-NEGOTIABLE)

- ✅ **PASS**: Final design confirms no new dependencies required
- ✅ **PASS**: All functionality achieved with ng-select, ag-grid-enterprise,
  Angular Material
- ✅ **PASS**: Bundle impact analysis: Zero new dependency additions
- ✅ **PASS**: Tree-shaking compatibility maintained throughout design

#### II. Clean Code Standards

- ✅ **PASS**: Component architecture maintains smart/dumb separation in design
- ✅ **PASS**: Interface contracts enforce single responsibility principle
- ✅ **PASS**: TypeScript strict mode compliance verified in all interface
  definitions
- ✅ **PASS**: Function complexity controlled through service-based architecture
- ✅ **PASS**: Self-documenting interfaces with clear naming conventions

#### III. Component Architecture

- ✅ **PASS**: Standalone component pattern confirmed in contracts
- ✅ **PASS**: Smart/dumb separation validated: SpxMagicSelectorComponent
  (smart), PreviewContainer/InspectorPanel (dumb)
- ✅ **PASS**: OnPush change detection strategy enforced in all component
  interfaces
- ✅ **PASS**: Reactive patterns with RxJS observables in service contracts
- ✅ **PASS**: Reusable design confirmed through interface abstraction

#### IV. Performance First

- ✅ **PASS**: Bundle size impact: Zero (no new dependencies)
- ✅ **PASS**: OnPush strategy mandated in component contracts
- ✅ **PASS**: Performance goals achievable with current architecture: <1s, <2s,
  <3s response times
- ✅ **PASS**: Memory management patterns defined in service interfaces
  (takeUntil pattern)
- ✅ **PASS**: Virtual scrolling and lazy loading designed into grid
  configuration

**FINAL GATE STATUS: ✅ PASS** - All constitutional requirements satisfied
post-design

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

## Project Structure

### Documentation (this feature)

```text
specs/001-spx-magic-selector/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/spx-magic-selector/
├── components/
│   ├── spx-magic-selector.component.ts      # Main smart component
│   ├── spx-magic-selector.component.html    # Bootstrap-based template
│   ├── spx-magic-selector.component.scss    # Empty/minimal SCSS file
│   ├── preview-container/
│   │   ├── preview-container.component.ts    # Dumb component for contextual preview
│   │   ├── preview-container.component.html  # Bootstrap template
│   │   └── preview-container.component.scss  # Empty SCSS file
│   └── discovery-modal/
│       ├── discovery-modal.component.ts      # Smart modal component with ag-grid
│       ├── discovery-modal.component.html    # Bootstrap modal template
│       ├── discovery-modal.component.scss    # Empty SCSS file
│       └── inspector-panel/
│           ├── inspector-panel.component.ts    # Dumb component for data preview
│           ├── inspector-panel.component.html  # Bootstrap template
│           └── inspector-panel.component.scss  # Empty SCSS file
├── models/
│   ├── selection-item.interface.ts           # Core data interfaces
│   ├── query.interface.ts                    # Query definition interface
│   ├── flat-selection-row.interface.ts       # Grid row interface
│   └── domain-schema.interface.ts            # Business domain interface
├── services/
│   ├── selection-data.service.ts             # Mock data service
│   ├── query-executor.service.ts             # Query execution and preview service
│   └── domain-switcher.service.ts            # Business domain management
└── spx-magic-selector.routes.ts              # Feature routing (if needed)

tests/
├── components/
│   ├── spx-magic-selector.component.spec.ts
│   ├── preview-container.component.spec.ts
│   ├── discovery-modal.component.spec.ts
│   └── inspector-panel.component.spec.ts
└── services/
    ├── selection-data.service.spec.ts
    ├── query-executor.service.spec.ts
    └── domain-switcher.service.spec.ts
```

**Structure Decision**: Angular feature module structure with standalone
components, following existing project patterns under `src/app/`. Components
separated by smart/dumb responsibility, with Bootstrap-only styling approach
(empty SCSS files created for tooling compatibility but all styling uses
Bootstrap classes).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
