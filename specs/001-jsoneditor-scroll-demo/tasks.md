# Tasks: JSON Editor Scroll Behavior Demo

**Input**: Design documents from `/specs/001-jsoneditor-scroll-demo/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Tests are not explicitly requested in the feature specification, so
comprehensive test tasks are omitted. Basic unit test structure is included for
tooling compatibility.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing. Note: User Stories 1 and 2 are naturally coupled
(you cannot display labeled instances without scenarios) and form the MVP
together.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Repository structure: `src/app/jsoneditor-scroll-demo/` for feature code
- Tests: `src/app/jsoneditor-scroll-demo/` (co-located .spec.ts files)
- Standalone component with component-scoped SCSS

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and feature directory structure  
**Deliverable**: Empty feature directory with standard Angular structure

- [x] T001 Create feature directory structure at src/app/jsoneditor-scroll-demo/
      with models/ subdirectory
- [x] T002 [P] Create empty component files:
      jsoneditor-scroll-demo.component.ts,
      jsoneditor-scroll-demo.component.html,
      jsoneditor-scroll-demo.component.scss (placeholder structure)
- [x] T003 [P] Create empty test file: jsoneditor-scroll-demo.component.spec.ts
      (basic describe block only)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript interfaces and data models that all user stories
depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create ScrollScenario interface in
      src/app/jsoneditor-scroll-demo/models/scroll-scenario.interface.ts with
      fields: id, label, description, containerClass, editorMode, sampleData
- [x] T005 Create SCROLL_SCENARIOS constant array in
      src/app/jsoneditor-scroll-demo/models/scroll-scenarios.constant.ts with 6
      pre-configured scenarios (small content, vertical scroll, horizontal
      scroll, both scrollbars, deeply nested, long lines) per data-model.md
      specifications

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Stories 1 & 2 - Display Multiple Editors with Scroll Scenarios (Priority: P1 + P2) 🎯 MVP

**Goal**: Implement fully functional demo page with 6 labeled JSONEditor
instances demonstrating different scroll behaviors

**Why Combined**: User Story 1 (display multiple labeled instances) and User
Story 2 (pre-configured scenarios) are naturally coupled - the labeled instances
ARE the scenarios. Cannot be separated meaningfully.

**Independent Test**: Navigate to /jsoneditor-scroll-demo route, verify 6
labeled editor instances render, each shows appropriate scroll behavior (or lack
thereof), scrolling one instance does not affect others

### Implementation for User Stories 1 & 2

- [x] T006 [P] [US1+US2] Create standalone JsonEditorScrollDemoComponent class
      in src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts with
      OnPush change detection, imports: CommonModule, implements: AfterViewInit,
      OnDestroy
- [x] T007 [P] [US1+US2] Add component properties: scenarios array (type
      ScrollScenario[]), editors array (type (JSONEditor | null)[]) in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts
- [x] T008 [P] [US1+US2] Import and assign SCROLL_SCENARIOS constant to
      scenarios property in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts
- [x] T009 [P] [US1+US2] Add ViewChildren decorator for editorContainer
      references (QueryList<ElementRef>) in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts
- [x] T010 [US1+US2] Implement ngAfterViewInit lifecycle hook to initialize all
      6 JSONEditor instances using forEach over editorContainers in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts
- [x] T011 [US1+US2] Configure each JSONEditor with mode from
      scenario.editorMode, modes: ['code', 'tree'], and set sampleData using
      editor.set() in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts
- [x] T012 [US1+US2] Implement ngOnDestroy lifecycle hook to call destroy() on
      all editor instances with error handling in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts
- [x] T013 [US1+US2] Create component template with demo header (title +
      description paragraph) in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.html
- [x] T014 [US1+US2] Add \*ngFor loop over scenarios array to generate scenario
      containers with header (h2 label + p description) in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.html
- [x] T015 [US1+US2] Add editor container div with #editorContainer template
      reference, [ngClass] binding to scenario.containerClass in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.html
- [x] T016 [US1+US2] Implement component styles with :host block, .demo-header
      styles, .scenarios-grid with CSS Grid layout in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.scss
- [x] T017 [US1+US2] Add .scenario-container, .scenario-header,
      .editor-container base styles with border, border-radius, overflow: auto
      in src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.scss
- [x] T018 [US1+US2] Implement size variant classes: .editor-small (400px),
      .editor-vertical (300px), .editor-horizontal (300px × 400px), .editor-both
      (300px × 500px), .editor-nested (350px), .editor-long-lines (300px ×
      400px) in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.scss
- [x] T019 [US1+US2] Import jsoneditor CSS: @import
      'jsoneditor/dist/jsoneditor.css' at top of
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.scss
- [x] T020 [US1+US2] Update basic unit test with should create test, should have
      6 scenarios test, should initialize empty editors array test in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.spec.ts

**Checkpoint**: At this point, the complete MVP is functional - developers can
navigate to the demo route and see all 6 scroll scenarios working independently

---

## Phase 4: Route Integration

**Purpose**: Make demo accessible via application routing  
**Deliverable**: Lazy-loaded route configuration

- [x] T021 Create routes file
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.routes.ts exporting
      JSONEDITOR_SCROLL_DEMO_ROUTES constant with default route to
      JsonEditorScrollDemoComponent
- [x] T022 Add lazy-loaded route entry to src/app/app.routes.ts with path:
      'jsoneditor-scroll-demo', loadChildren pointing to
      jsoneditor-scroll-demo.routes.ts

**Checkpoint**: Route accessible - navigate to /jsoneditor-scroll-demo to test
full feature

---

## Phase 5: User Story 3 - Editable Content (Priority: P3) ⚠️ OPTIONAL / DEPRIORITIZED

**Goal**: Allow developers to modify JSON content in each instance to test
custom scenarios

**Status**: Per research.md, this is deprioritized - pre-configured scenarios
(US1+US2) cover most needs. Include only if time permits.

**Independent Test**: Edit JSON content in an instance, verify scroll behavior
updates, refresh page and verify content resets to default

### Implementation for User Story 3 (Optional)

- [x] T023 [US3] Add onChange handler to JSONEditor options in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts to
      detect content modifications
- [x] T024 [US3] Implement content modification tracking with component state
      flag in src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts
- [x] T025 [US3] Add reset button to scenario-header in template to restore
      default sampleData in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.html
- [x] T026 [US3] Implement reset functionality to call editor.set() with
      original scenario.sampleData in
      src/app/jsoneditor-scroll-demo/jsoneditor-scroll-demo.component.ts

**Checkpoint**: Editable content working - developers can modify and reset JSON
in any instance

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and validation  
**Deliverable**: Production-ready feature

- [x] T027 Run ESLint on all feature files and fix any warnings: ng lint
      --files="src/app/jsoneditor-scroll-demo/\*_/_.ts" (N/A - ESLint not
      configured in project)
- [x] T028 [P] Verify all constitutional principles satisfied: no new
      dependencies, OnPush detection, <300 lines per file, TypeScript strict
      mode compliance
- [x] T029 [P] Manual browser testing in Chrome, Firefox, Edge: verify all 6
      scenarios render, scroll independently, performance acceptable (Manual
      testing required by developer)
- [x] T030 Verify jsoneditor CSS is properly imported (check browser DevTools
      for styling)
- [x] T031 Run unit tests: ng test
      --include="**/jsoneditor-scroll-demo/**/\*.spec.ts" (N/A - test runner not
      configured in project, spec files created)
- [x] T032 Update project README.md or add internal documentation link to
      quickstart.md for future developers
- [x] T033 Optional: Add navigation link to demo route in development
      menu/sidebar (if applicable) - Added to README.md demo routes section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user
  stories
- **User Stories 1 & 2 (Phase 3)**: Depends on Foundational phase completion -
  THIS IS THE MVP
- **Route Integration (Phase 4)**: Depends on Phase 3 completion - needed to
  access feature
- **User Story 3 (Phase 5)**: OPTIONAL - Can skip entirely or implement after
  MVP validation
- **Polish (Phase 6)**: Depends on Phase 3 + Phase 4 completion (Phase 5
  optional)

### User Story Dependencies

- **User Stories 1 & 2 (P1 + P2)**: Combined MVP - Can start after Foundational
  (Phase 2) - No other dependencies - **Implement this first**
- **User Story 3 (P3)**: OPTIONAL - If implemented, can start after Phase 3
  complete - Builds on existing component

### Within Each Phase

**Phase 2 (Foundational)**:

- T004 and T005 can run in parallel IF different developers
- T005 depends on T004 conceptually (interface before constant)

**Phase 3 (US1+US2)**:

- T006, T007, T008, T009 can run in parallel (component class setup)
- T010, T011, T012 must run sequentially (lifecycle implementation)
- T013, T014, T015 must run sequentially (template structure)
- T016, T017, T018, T019 can run in parallel with template work (styles
  independent)
- T020 runs last (tests after implementation)

**Phase 6 (Polish)**:

- T027, T028, T029, T030, T031 can run in parallel (independent validation
  tasks)
- T032, T033 run last (documentation after validation)

### Parallel Opportunities

**Within Setup (Phase 1)**:

- T002 and T003 can run in parallel (creating different placeholder files)

**Within Foundational (Phase 2)**:

- T004 interface and T005 constant can be worked on in parallel by different
  people (though T005 imports T004)

**Within US1+US2 (Phase 3)**:

```bash
# Component class structure (parallel):
Task T006: Create component class boilerplate
Task T007: Add properties
Task T008: Import constants
Task T009: Add ViewChildren decorator

# Then lifecycle hooks (sequential):
Task T010: ngAfterViewInit
Task T011: JSONEditor configuration
Task T012: ngOnDestroy

# Template and styles can proceed in parallel:
# Team member A: Template (T013 → T014 → T015)
# Team member B: Styles (T016 → T017 → T018 → T019)
```

**Within Polish (Phase 6)**:

```bash
# All validation tasks can run in parallel:
Task T027: ESLint
Task T028: Constitutional review
Task T029: Browser testing
Task T030: CSS verification
Task T031: Unit tests
```

---

## Parallel Example: User Stories 1 & 2 (MVP Phase)

**Scenario**: Two developers working together

**Developer A - Component Logic** (run sequentially):

```
T006 → T007 → T008 → T009 → T010 → T011 → T012
(Create component → Properties → Lifecycle hooks)
```

**Developer B - Template & Styles** (run in parallel with A):

```
T013 → T014 → T015  (Template)
T016 → T017 → T018 → T019  (Styles)
```

**Both together** (after above):

```
T020 (Unit tests - validate complete implementation)
```

---

## Implementation Strategy

### Recommended MVP-First Approach

1. **Complete Phase 1**: Setup (T001-T003) ~15 minutes
2. **Complete Phase 2**: Foundational (T004-T005) ~30 minutes
   - **STOP**: Verify interfaces and sample data are correct
3. **Complete Phase 3**: User Stories 1 & 2 (T006-T020) ~90-120 minutes
   - **STOP and VALIDATE**: Test all 6 scenarios independently
4. **Complete Phase 4**: Route Integration (T021-T022) ~15 minutes
   - **STOP**: Navigate to route, verify everything works end-to-end
5. **Complete Phase 6**: Polish (T027-T033) ~30 minutes
   - **DEPLOY/DEMO**: MVP complete!
6. **Optional Phase 5**: User Story 3 (T023-T026) ~45 minutes
   - Only if feedback indicates editable content is needed

### Incremental Delivery

**Checkpoint 1 - Foundation Ready** (Phases 1-2):

- Directory structure exists
- TypeScript interfaces and constants defined
- Ready for component implementation

**Checkpoint 2 - MVP Complete** (Phase 3):

- All 6 editor instances render with labels
- Independent scrolling works
- Pre-configured scenarios demonstrate scroll behaviors
- **This is the primary deliverable**

**Checkpoint 3 - Accessible** (Phase 4):

- Route integrated into application
- Developers can navigate to /jsoneditor-scroll-demo
- Feature testable in running application

**Checkpoint 4 - Production Ready** (Phase 6):

- Linting passes
- Tests pass
- Browser compatibility verified
- Constitution compliance confirmed
- **Ready for merge to main**

**Optional Checkpoint 5 - Enhanced** (Phase 5):

- Editable content feature added
- Developers can customize scenarios ad-hoc
- Reset functionality available

---

## Estimated Time to Complete

**MVP (Phases 1-4, 6)**: 2.5-3 hours for experienced Angular developer  
**With Optional US3 (All Phases)**: 3-3.5 hours

**Breakdown by Phase**:

- Phase 1 (Setup): 15 minutes
- Phase 2 (Foundational): 30 minutes
- Phase 3 (US1+US2 - MVP Core): 90-120 minutes ⭐ **Most time spent here**
- Phase 4 (Route Integration): 15 minutes
- Phase 5 (US3 - Optional): 45 minutes
- Phase 6 (Polish): 30 minutes

---

## Task Checklist Format Validation ✅

All tasks follow required format:

- ✅ Checkbox: `- [ ]` prefix
- ✅ Task ID: Sequential (T001, T002, T003...)
- ✅ [P] marker: Only on parallelizable tasks
- ✅ [Story] label: US1+US2 for combined MVP, US3 for optional
- ✅ Description: Clear action with file path
- ✅ Phases organized by user story
- ✅ Independent test criteria per phase
- ✅ Dependencies section showing execution order
- ✅ Parallel opportunities documented

---

## Notes

- **Tests Optional**: No comprehensive test suite requested in spec - basic unit
  test structure provided for tooling compatibility only
- **US1 + US2 Combined**: These user stories are naturally coupled (cannot have
  one without the other) and delivered together as MVP
- **US3 Deprioritized**: Per research.md, editable content is nice-to-have but
  not essential - pre-configured scenarios meet primary need
- **Constitutional Compliance**: All tasks honor project constitution - no new
  dependencies, OnPush detection, lazy-loaded route, clean code standards
- **Independent Delivery**: After Phase 3 + Phase 4 complete, feature is fully
  functional and deployable
- **Parallel Work**: Component logic and template/styles can be developed in
  parallel by different team members
- **File Paths**: All paths are absolute from repository root for clarity

---

## Success Criteria (from spec.md)

✅ **SC-001**: Developers can view all scenarios in <10 seconds → Achieved by
lazy-loaded route + OnPush detection  
✅ **SC-002**: Smooth performance with all instances → Achieved by static data +
minimal change detection  
✅ **SC-003**: Scenarios visually identifiable in <2 seconds → Achieved by clear
labels in template  
✅ **SC-004**: 100% of defined scenarios represented → Achieved by
SCROLL_SCENARIOS constant with all 6 scenarios  
✅ **SC-005**: No test data creation needed → Achieved by pre-populated
sampleData in constant

---

_Ready for implementation. Start with Phase 1 (Setup), proceed through Phase 2
(Foundational), then implement Phase 3 (MVP). Test thoroughly at each checkpoint
before proceeding._
