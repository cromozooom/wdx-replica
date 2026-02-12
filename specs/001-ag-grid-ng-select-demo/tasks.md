# Tasks: ag-Grid with ng-select Cell Demo

**Branch**: `001-ag-grid-ng-select-demo`  
**Input**: Design documents from `/specs/001-ag-grid-ng-select-demo/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md),
[research.md](research.md), [data-model.md](data-model.md),
[contracts/component-interfaces.md](contracts/component-interfaces.md)

**Tests**: Unit tests included for service and components (Karma + Jasmine)

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create feature directory structure and integrate with existing app
routing

- [x] T001 Create feature directory structure src/app/ag-grid-demo/ with
      subdirectories (components/, services/, models/)
- [x] T002 [P] Create models directory and placeholder files in
      src/app/ag-grid-demo/models/
- [x] T003 [P] Create services directory and placeholder files in
      src/app/ag-grid-demo/services/
- [x] T004 [P] Create components directory for ng-select-cell-renderer in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data structures and services that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Define GridRow interface with 15 fields in
      src/app/ag-grid-demo/models/grid-row.interface.ts
- [x] T006 [P] Define StatusOption interface in
      src/app/ag-grid-demo/models/status-option.interface.ts
- [x] T007 Create MockDataService with generate(rowCount: number) method in
      src/app/ag-grid-demo/services/mock-data.service.ts
- [x] T008 Implement data generation logic for 15 columns (id, name, email,
      status, department, location, role, startDate, salary, performance,
      projects, hoursLogged, certification, experience, team) in
      src/app/ag-grid-demo/services/mock-data.service.ts
- [x] T009 [P] Create unit test for MockDataService in
      src/app/ag-grid-demo/services/mock-data.service.spec.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - View Grid with Simulated Data (Priority: P1) 🎯 MVP

**Goal**: Display a data grid with 15+ columns and 100+ rows of simulated data
where at least one column contains dropdown selectors in constrained space

**Independent Test**: Launch application at /ag-grid-demo route and verify grid
displays with 15 columns, 100 rows, and one dropdown selector column

**Acceptance Criteria** (from spec.md):

1. Data grid displays with at least 15 columns
2. At least 100 rows of simulated data visible
3. At least one column contains dropdown selectors in each cell
4. Dropdown selector column has limited horizontal space due to column density

### Implementation for User Story 1

- [x] T010 [P] [US1] Create ag-grid-demo.component.ts as standalone component
      with OnPush change detection in
      src/app/ag-grid-demo/ag-grid-demo.component.ts
- [x] T011 [P] [US1] Create ag-grid-demo.component.html template file in
      src/app/ag-grid-demo/ag-grid-demo.component.html
- [x] T012 [P] [US1] Create ag-grid-demo.component.scss with minimal styling in
      src/app/ag-grid-demo/ag-grid-demo.component.scss
- [x] T013 [US1] Inject MockDataService and generate 100 rows in ngOnInit() in
      src/app/ag-grid-demo/ag-grid-demo.component.ts
- [x] T014 [US1] Define column definitions array with 15 columns in
      src/app/ag-grid-demo/ag-grid-demo.component.ts
- [x] T015 [US1] Configure default column settings (width: 130px, resizable,
      sortable, filter) in src/app/ag-grid-demo/ag-grid-demo.component.ts
- [x] T016 [US1] Configure status column with narrower width (110px) for
      constrained space in src/app/ag-grid-demo/ag-grid-demo.component.ts
- [x] T017 [US1] Add ag-grid-angular component to template with rowData and
      columnDefs bindings in src/app/ag-grid-demo/ag-grid-demo.component.html
- [x] T018 [US1] Import required ag-grid and Angular modules in
      src/app/ag-grid-demo/ag-grid-demo.component.ts
- [x] T019 [US1] Create route configuration file with default export in
      src/app/ag-grid-demo/ag-grid-demo.routes.ts
- [x] T020 [US1] Add lazy-loaded route '/ag-grid-demo' to main app routes in
      src/app/app.routes.ts
- [x] T021 [US1] Create unit test scaffold for AgGridDemoComponent in
      src/app/ag-grid-demo/ag-grid-demo.component.spec.ts
- [x] T022 [US1] Write unit test: component initializes with 100 rows in
      src/app/ag-grid-demo/ag-grid-demo.component.spec.ts
- [x] T023 [US1] Write unit test: component has 15 column definitions in
      src/app/ag-grid-demo/ag-grid-demo.component.spec.ts

**Checkpoint**: At this point, User Story 1 should display a functional grid
with 15 columns and 100 rows accessible at /ag-grid-demo

---

## Phase 4: User Story 2 - Interact with Dropdown Selector in Constrained Space (Priority: P2)

**Goal**: Enable users to click dropdown selector cells, view options, and
select values despite limited horizontal space

**Independent Test**: Click any status column cell, verify dropdown opens with 5
options, select a value, verify dropdown closes and cell updates

**Acceptance Criteria** (from spec.md):

1. Clicking a cell opens dropdown and displays available options
2. Options are fully readable and selectable despite narrow width
3. Dropdown behaves smoothly when scrolling through options
4. Selecting an option closes dropdown
5. Selected value displays in the cell

### Implementation for User Story 2

- [x] T024 [P] [US2] Create ng-select-cell-renderer.component.ts implementing
      ICellRendererAngularComp in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [x] T025 [P] [US2] Create ng-select-cell-renderer.component.html template in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.html
- [x] T026 [P] [US2] Create ng-select-cell-renderer.component.scss in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.scss
- [x] T027 [US2] Implement agInit(params: ICellRendererParams) method to receive
      cell value in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [x] T028 [US2] Implement refresh(params: ICellRendererParams) method in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [x] T029 [US2] Define statusOptions array with 5 options (Active, Pending,
      Inactive, Suspended, Archived) in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [x] T030 [US2] Add ng-select component to template with [(ngModel)]="value"
      binding in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.html
- [x] T031 [US2] Configure ng-select with appendTo="body" to prevent clipping in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.html
- [x] T032 [US2] Configure ng-select with [clearable]="false" in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.html
- [x] T033 [US2] Implement onSelectionChange(event) handler in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [x] T034 [US2] Call params.setValue(newValue) in onSelectionChange handler in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [x] T035 [US2] Import NgSelectModule and FormsModule in component imports in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [x] T036 [US2] Update status column definition to use
      NgSelectCellRendererComponent as cellRenderer in
      src/app/ag-grid-demo/ag-grid-demo.component.ts
- [x] T037 [US2] Create unit test scaffold for NgSelectCellRendererComponent in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.spec.ts
- [x] T038 [US2] Write unit test: component implements ICellRendererAngularComp
      in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.spec.ts
- [x] T039 [US2] Write unit test: agInit initializes with cell value in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.spec.ts
- [x] T040 [US2] Write unit test: onSelectionChange calls params.setValue() in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.spec.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - grid
displays and dropdown selectors are fully interactive

---

## Phase 5: User Story 3 - Verify Data Updates (Priority: P3)

**Goal**: Ensure selected values persist in the data model and display correctly
when cells are re-opened or after scrolling

**Independent Test**: Select values in multiple cells, scroll away and back,
verify selections persist; re-open cells to verify selected value shown as
selected

**Acceptance Criteria** (from spec.md):

1. Cell immediately displays new selected value
2. Re-opening cell shows previously selected value as selected
3. Selections persist when scrolling through grid
4. Selecting different value in previously edited cell updates correctly

### Implementation for User Story 3

- [ ] T041 [US3] Verify params.setValue() properly updates ag-Grid's internal
      data model in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [ ] T042 [US3] Ensure agInit() correctly reflects current cell value when
      component is reused in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [ ] T043 [US3] Test data persistence: Create manual test scenario for
      selection persistence in specs/001-ag-grid-ng-select-demo/quickstart.md
      (update Testing section)
- [ ] T044 [US3] Add change detection trigger if needed for immediate visual
      update in
      src/app/ag-grid-demo/components/ng-select-cell-renderer/ng-select-cell-renderer.component.ts
- [ ] T045 [US3] Write unit test: multiple selections update rowData correctly
      in src/app/ag-grid-demo/ag-grid-demo.component.spec.ts
- [ ] T046 [US3] Write integration test scenario documentation for data
      persistence validation in specs/001-ag-grid-ng-select-demo/quickstart.md

**Checkpoint**: At this point, all three User Stories are complete - grid
displays, dropdowns work, and data persists correctly

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, documentation, and production readiness

### Edge Cases (from spec.md)

- [ ] T047 [P] Test edge case: Dropdown content wider than cell width (verify
      appendTo="body" handles this)
- [ ] T048 [P] Test edge case: Grid resize behavior (verify dropdown repositions
      correctly)
- [ ] T049 [P] Test edge case: Click outside dropdown (verify dropdown closes)
- [ ] T050 [P] Test edge case: Scrolling grid with open dropdown (document
      behavior)
- [ ] T051 [P] Test edge case: Dropdown cell at viewport edge (verify
      auto-positioning works)

### Documentation & Validation

- [ ] T052 Verify all functional requirements FR-001 through FR-010 are
      satisfied
- [ ] T053 Verify all success criteria SC-001 through SC-007 are met
      (performance, functionality)
- [ ] T054 Run ESLint and ensure zero warnings per constitution requirements
- [ ] T055 Verify component file sizes are under 300 lines per constitution
      clean code standards
- [ ] T056 Measure bundle size impact and confirm <50KB added
- [ ] T057 Test application loads and grid renders in <2 seconds (SC-001)
- [ ] T058 Test dropdown opens in <100ms (SC-003)
- [ ] T059 Update README or quickstart.md with final usage instructions (if
      needed)

---

## Task Dependencies

### Dependency Graph (by User Story)

```
Phase 1 (Setup): T001 → T002, T003, T004
                 ↓
Phase 2 (Foundational): T005, T006 → T007 → T008 → T009
                 ↓                              ↓
Phase 3 (US1): T010-T012 (parallel) → T013 → T014-T016 (sequential) → T017-T018 → T019 → T020 → T021-T023
                                                                         ↓
Phase 4 (US2): T024-T026 (parallel) → T027-T029 → T030-T032 → T033-T035 → T036 → T037-T040
                                                                           ↓
Phase 5 (US3): T041-T042 → T043-T044 → T045-T046
                                        ↓
Phase 6 (Polish): T047-T051 (parallel) → T052-T059
```

### Critical Path

```
T001 → T005 → T007 → T008 → T013 → T014 → T017 → T020 → T027 → T033 → T036 → T041 → T052
```

**Estimated Duration**: ~8-12 hours total (assuming single developer)

- Phase 1-2: 1-2 hours (setup + models + service)
- Phase 3 (US1): 2-3 hours (main grid component + routing)
- Phase 4 (US2): 3-4 hours (cell renderer + ng-select integration)
- Phase 5 (US3): 1 hour (data persistence verification)
- Phase 6: 1-2 hours (testing + polish)

---

## Parallel Execution Opportunities

### User Story 1 Parallelization

**Group A** (can work simultaneously):

- T010 (component.ts)
- T011 (component.html)
- T012 (component.scss)

**Group B** (can work simultaneously after Group A):

- T019 (routes.ts)
- T021-T023 (unit tests)

### User Story 2 Parallelization

**Group C** (can work simultaneously):

- T024 (cell renderer .ts)
- T025 (cell renderer .html)
- T026 (cell renderer .scss)

**Group D** (can work simultaneously after cell renderer complete):

- T037-T040 (unit tests)

### Polish Phase Parallelization

**Group E** (can work simultaneously):

- T047-T051 (all edge case tests)
- T052-T059 (all validation tasks)

---

## Implementation Strategy

### MVP Delivery (User Story 1 Only)

**Minimum Viable Product** includes only Phase 1, 2, and 3:

- Tasks T001-T023 (59 total tasks → 23 for MVP)
- Delivers: Functional grid with 15 columns, 100 rows, basic display
- Demo-able: Yes, shows grid layout and data
- Value: Demonstrates ag-grid integration and data generation

**Delivery time**: ~3-5 hours

### Incremental Delivery

**Increment 1** (MVP): T001-T023 → Grid displays with data  
**Increment 2** (+US2): T024-T040 → Interactive dropdown selectors  
**Increment 3** (+US3): T041-T046 → Data persistence verified  
**Increment 4** (Complete): T047-T059 → Production-ready with edge cases tested

---

## Success Metrics

### Functional Requirements Coverage

| Requirement                     | Tasks      | Acceptance                         |
| ------------------------------- | ---------- | ---------------------------------- |
| FR-001: 15 columns              | T014, T015 | Column count verified in component |
| FR-002: 100 rows                | T008, T013 | Row generation in MockDataService  |
| FR-003: Dropdown column         | T016, T036 | Status column configured           |
| FR-004: 5 options               | T029       | StatusOptions array defined        |
| FR-005: Click to open           | T030-T031  | ng-select click binding            |
| FR-006: Select value            | T033-T034  | onSelectionChange handler          |
| FR-007: Update cell             | T034       | params.setValue() call             |
| FR-008: Persist value           | T041-T042  | Data model update                  |
| FR-009: Usable when constrained | T016, T031 | 110px width + appendTo body        |
| FR-010: No clipping             | T031       | appendTo="body" config             |

### Success Criteria Coverage

| Criterion                      | Tasks      | Verification                |
| ------------------------------ | ---------- | --------------------------- |
| SC-001: Load <2s               | T057       | Performance test            |
| SC-002: 100×15 grid            | T008, T014 | Visual inspection           |
| SC-003: Dropdown <100ms        | T058       | Performance test            |
| SC-004: Options readable       | T031       | Manual test (appendTo body) |
| SC-005: 100% selection success | T033-T040  | Unit tests + manual         |
| SC-006: Persistence            | T041-T046  | Integration tests           |
| SC-007: Functional <150px      | T016, T047 | Edge case test              |

---

## Notes

- **No new dependencies**: All required packages already installed (✅
  constitution compliant)
- **Bundle impact**: Estimated <50KB (constitution requirement met)
- **Testing**: Unit tests included for service and components; manual testing
  required for visual/interaction validation
- **Performance**: OnPush change detection and lazy loading ensure performance
  targets are met
- **Architecture**: Follows smart/dumb component pattern and standalone
  component structure per constitution

**Ready for implementation**: ✅ All tasks defined, dependencies mapped, success
criteria established
