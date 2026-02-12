# Implementation Plan: ag-Grid with ng-select Cell Demo

**Branch**: `001-ag-grid-ng-select-demo` | **Date**: February 11, 2026 |
**Spec**: [spec.md](spec.md)  
**Input**: Feature specification from
`/specs/001-ag-grid-ng-select-demo/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See
`.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a demonstration component that displays a data grid with 15+ columns and
100+ rows of simulated data, where at least one column contains ng-select
dropdown components in constrained horizontal space. This serves as a testing
environment for evaluating ng-select behavior within ag-grid cells when space is
limited.

## Technical Context

**Language/Version**: TypeScript 5.7+ (strict mode)  
**Primary Dependencies**: Angular 19.2+, ag-grid-enterprise 33.3+,
@ng-select/ng-select 14.9+ (already installed)  
**Storage**: N/A (in-memory data generation only)  
**Testing**: Karma + Jasmine (existing setup)  
**Target Platform**: Web browser (Chrome, Edge, Safari)  
**Project Type**: Web application (Angular SPA with existing routing)  
**Performance Goals**: Grid renders 100 rows in <2 seconds, dropdown opens in
<100ms  
**Constraints**: Must fit within existing app routes, minimal bundle impact
(<50KB added), OnPush change detection  
**Scale/Scope**: Single demo component with 15 columns × 100 rows, ~5 dropdown
options per cell

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Minimal Dependencies ✅ PASS

**Status**: No new dependencies required

**Analysis**:

- ag-grid-enterprise 33.3.2 - ✅ already installed
- @ng-select/ng-select 14.9.0 - ✅ already installed
- All required dependencies are already approved and in use

**Bundle Impact**: Estimated <50KB for new component code (TypeScript +
template + data generation logic)

---

### II. Clean Code Standards ✅ PASS (with monitoring)

**Commitments**:

- Component will be <300 lines (template + logic combined)
- Data generation logic will be extracted to separate service
- Cell renderer for ng-select will be in dedicated class
- TypeScript strict mode enforced (project default)
- No `any` types except ag-grid's CellRendererParams (typed interface)

---

### III. Component Architecture ✅ PASS

**Design**:

- Standalone component (Angular 19 pattern)
- Smart/dumb separation: Main component (smart) manages grid config, cell
  renderer (dumb) renders ng-select
- OnPush change detection for performance
- Single concern: Demonstrate ng-select in constrained grid cells

---

### IV. Performance First ✅ PASS

**Strategies**:

- Lazy-loaded route module (not in main bundle)
- OnPush change detection
- Virtual scrolling handled by ag-grid (built-in)
- trackBy used if any \*ngFor outside grid
- Minimal asset requirements (no images)
- Target: Component loads in <2 seconds, dropdown opens in <100ms

---

### Summary

**Gate Result**: ✅ **PASS** - All constitutional principles satisfied

No violations. All dependencies exist. Component follows architectural
standards. Implementation can proceed to Phase 0.

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

### Source Code (repository root)

```text
src/app/ag-grid-demo/
├── ag-grid-demo.component.ts           # Main grid container (smart)
├── ag-grid-demo.component.html         # Grid template with ag-grid
├── ag-grid-demo.component.scss         # Minimal component styling
├── ag-grid-demo.component.spec.ts      # Component unit tests
├── ag-grid-demo.routes.ts              # Route configuration (default export)
├── components/
│   └── ng-select-cell-renderer/
│       ├── ng-select-cell-renderer.component.ts       # Cell renderer (dumb)
│       ├── ng-select-cell-renderer.component.html     # ng-select template
│       ├── ng-select-cell-renderer.component.scss     # Cell renderer styling
│       └── ng-select-cell-renderer.component.spec.ts  # Cell renderer tests
├── services/
│   ├── mock-data.service.ts            # Data generation service
│   └── mock-data.service.spec.ts       # Service unit tests
└── models/
    ├── grid-row.interface.ts           # Row data type
    └── status-option.interface.ts      # Dropdown option type
```

**Integration Point**:

```text
src/app/app.routes.ts
  └── Add lazy-loaded route: '/ag-grid-demo'
```

**Structure Decision**:

Angular web application structure (existing pattern). The demo follows the
established routing pattern used by `configuration-manager` and `garden-room`
modules:

- **Lazy-loaded module** for performance isolation
- **Feature directory** under `src/app/`
- **Component-service-model separation** for clean architecture
- **Standalone components** (Angular 19 pattern)
- **Route configuration** in dedicated `.routes.ts` file

This integrates seamlessly with the existing application without requiring any
build configuration changes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - No constitutional violations. All gates passed.

---

## Phase Summary

### ✅ Phase 0: Research & Design Decisions (Completed)

**Output**: [research.md](research.md)

**Key Decisions**:

- Use Custom Cell Renderer approach (ICellRendererAngularComp)
- Native TypeScript data generation (no faker.js)
- Lazy-loaded route '/ag-grid-demo'
- Fixed column widths with horizontal scrolling
- appendTo='body' for dropdown positioning
- Component-local state (no signals/store)

### ✅ Phase 1: Data Model & Contracts (Completed)

**Outputs**:

- [data-model.md](data-model.md)
- [quickstart.md](quickstart.md)
- [contracts/component-interfaces.md](contracts/component-interfaces.md)

**Defined**:

- 3 entities: GridRow, StatusOption, ColumnDefinition
- 15 fields per GridRow (id, name, email, status, department, location, role,
  startDate, salary, performance, projects, hoursLogged, certification,
  experience, team)
- 5 status options (Active, Pending, Inactive, Suspended, Archived)
- Component interface contracts (service, components, data models)
- Data generation strategy (deterministic mock data)

### 🔄 Phase 2: Tasks Breakdown (Next Step)

**Command**: `/speckit.tasks`

**Expected Output**: [tasks.md](tasks.md)

**Will Generate**:

- Atomic implementation tasks
- Task dependencies
- Acceptance criteria per task
- Estimated complexity

---

## Post-Design Constitution Re-Check

### I. Minimal Dependencies ✅ PASS

**Re-verified**: Design uses only existing dependencies

- No new packages required
- Bundle impact confirmed <50KB

### II. Clean Code Standards ✅ PASS

**Re-verified**: Design maintains clean architecture

- Services properly separated (MockDataService)
- Components follow smart/dumb pattern
- Interfaces properly defined
- TypeScript strict mode compliance

### III. Component Architecture ✅ PASS

**Re-verified**: Architecture follows project patterns

- Standalone components throughout
- OnPush change detection planned
- Single responsibility maintained
- Reusable cell renderer pattern

### IV. Performance First ✅ PASS

**Re-verified**: Performance considerations addressed

- Lazy loading confirmed
- Virtual scrolling via ag-Grid
- Minimal asset requirements
- Performance targets defined (SC-001 through SC-007)

**Final Gate Result**: ✅ **PASS** - Design approved for implementation

---

## Implementation Readiness

### Prerequisites Met

- ✅ All dependencies confirmed available
- ✅ Project structure defined
- ✅ Data model documented
- ✅ Component contracts specified
- ✅ Testing strategy outlined
- ✅ Performance targets set
- ✅ Constitution compliance verified

### Ready for Next Step

Execute `/speckit.tasks` to generate implementation tasks breakdown.

---

## References

- **Feature Spec**: [spec.md](spec.md)
- **Requirements Checklist**:
  [checklists/requirements.md](checklists/requirements.md)
- **Constitution**:
  [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- **Copilot Instructions**:
  [../../.github/copilot-instructions.md](../../.github/copilot-instructions.md)
