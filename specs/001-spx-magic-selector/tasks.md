# Tasks: SPX Magic Selector

**Input**: Design documents from `/specs/001-spx-magic-selector/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Tests are not explicitly requested in the feature specification, so
test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Repository structure: `src/app/spx-magic-selector/` for feature code
- Tests: `src/app/spx-magic-selector/` (co-located .spec.ts files)
- Standalone components with Bootstrap-only styling (empty SCSS files)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure  
**Deliverable**: Feature directory structure and configuration

- [x] T001 Create feature directory structure at src/app/spx-magic-selector/
      with components/, models/, services/ subdirectories
- [x] T002 Create empty SCSS files for tooling compatibility (all styling uses
      Bootstrap classes): spx-magic-selector.component.scss,
      preview-container.component.scss, discovery-modal.component.scss,
      inspector-panel.component.scss

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can
be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Create SelectionItem interface in
      src/app/spx-magic-selector/models/selection-item.interface.ts
- [x] T004 [P] Create Query interface in
      src/app/spx-magic-selector/models/query.interface.ts
- [x] T005 [P] Create QueryParameters interface in
      src/app/spx-magic-selector/models/query-parameters.interface.ts
- [x] T006 [P] Create FlatSelectionRow interface in
      src/app/spx-magic-selector/models/flat-selection-row.interface.ts
- [x] T007 [P] Create PreviewRecord interface in
      src/app/spx-magic-selector/models/preview-record.interface.ts
- [x] T008 [P] Create DomainSchema interface in
      src/app/spx-magic-selector/models/domain-schema.interface.ts
- [x] T009 [P] Create SelectionChangeEvent interface in
      src/app/spx-magic-selector/models/selection-change-event.interface.ts
- [x] T010 Implement SelectionDataService in
      src/app/spx-magic-selector/services/selection-data.service.ts with mock
      data for CRM and Document Management domains
- [x] T011 Create mock data constants for sample forms/documents in
      src/app/spx-magic-selector/services/mock-data.constants.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Basic Selector Interaction (Priority: P1) 🎯 MVP

**Goal**: Implement searchable ng-select dropdown with form/document selection
capability

**Independent Test**: User can open dropdown, search for forms/documents, select
an item, and clear selection

### Implementation for User Story 1

- [x] T012 [P] [US1] Create standalone SpxMagicSelectorComponent in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts with
      OnPush change detection
- [x] T013 [US1] Implement component template in
      src/app/spx-magic-selector/components/spx-magic-selector.component.html
      using ng-select with Bootstrap classes
- [x] T014 [US1] Implement ControlValueAccessor interface for Angular Forms
      integration in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [x] T015 [US1] Add searchable dropdown functionality with debounced filtering
      (300ms) in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [x] T016 [US1] Implement selection state management with BehaviorSubject in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [x] T017 [US1] Add clear selection functionality to
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [x] T018 [US1] Implement selectionChange event emitter in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [x] T019 [US1] Add "No results found" message handling for empty search
      results in
      src/app/spx-magic-selector/components/spx-magic-selector.component.html
- [x] T020 [US1] Create unit test specification in
      src/app/spx-magic-selector/components/spx-magic-selector.component.spec.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - users
can select forms/documents via dropdown

---

## Phase 4: User Story 2 - Contextual Preview Display (Priority: P2)

**Goal**: Add preview container showing entity mapping, query description, and
live record count

**Independent Test**: After making a selection, preview container displays
entity type, query info, and record count badge

### Implementation for User Story 2

- [x] T021 [P] [US2] Create standalone PreviewContainerComponent in
      src/app/spx-magic-selector/components/preview-container/preview-container.component.ts
      with OnPush change detection
- [x] T022 [US2] Implement preview template in
      src/app/spx-magic-selector/components/preview-container/preview-container.component.html
      using Bootstrap card and badge components
- [x] T023 [US2] Add component inputs for selectedItem and selectedQuery in
      src/app/spx-magic-selector/components/preview-container/preview-container.component.ts
- [x] T024 [P] [US2] Implement QueryExecutorService in
      src/app/spx-magic-selector/services/query-executor.service.ts for record
      count calculations
- [x] T025 [US2] Add getRecordCount method with exact counts for <1000 records
      and approximate (±10%) for larger datasets in
      src/app/spx-magic-selector/services/query-executor.service.ts
- [x] T026 [US2] Integrate PreviewContainerComponent into
      SpxMagicSelectorComponent template below the ng-select in
      src/app/spx-magic-selector/components/spx-magic-selector.component.html
- [x] T027 [US2] Implement automatic preview update on selection change in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [x] T028 [US2] Add loading state indicator for record count calculation in
      src/app/spx-magic-selector/components/preview-container/preview-container.component.ts
- [x] T029 [US2] Implement cached data with warning banner for network failures
      in
      src/app/spx-magic-selector/components/preview-container/preview-container.component.html
- [x] T030 [US2] Add retry mechanism for failed record count requests in
      src/app/spx-magic-selector/components/preview-container/preview-container.component.ts
- [x] T031 [US2] Create unit test specification in
      src/app/spx-magic-selector/components/preview-container/preview-container.component.spec.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work
independently - selections show contextual preview

---

## Phase 5: User Story 3 - Advanced Discovery Modal (Priority: P3)

**Goal**: Implement full-screen modal with ag-grid displaying all
form-entity-query combinations

**Independent Test**: User clicks advanced lookup trigger, browses grid of all
options, selects a row, and confirms selection

### Implementation for User Story 3

- [x] T032 [P] [US3] Create standalone DiscoveryModalComponent in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.ts
      with OnPush change detection
- [x] T033 [US3] Implement modal template using Angular Material Dialog with
      full-screen configuration in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.html
- [x] T034 [US3] Add ag-grid integration with Bootstrap theme classes in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.html
- [x] T035 [US3] Implement data flattening service method to convert
      SelectionItem[] to FlatSelectionRow[] in
      src/app/spx-magic-selector/services/selection-data.service.ts
- [x] T036 [US3] Configure ag-grid column definitions (sourceName, entityName,
      queryName, queryDescription, estimatedRecords) in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.ts
- [x] T037 [US3] Implement radio-button style row selection (single selection
      mode) in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.ts
- [x] T038 [US3] Add advanced lookup trigger button with icon to
      src/app/spx-magic-selector/components/spx-magic-selector.component.html
      using Bootstrap button classes
- [x] T039 [US3] Implement modal open/close logic in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
      using Angular Material Dialog service
- [x] T040 [US3] Add modal confirmation handler to update main selector in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [x] T041 [US3] Implement cancel/close behavior to discard changes and retain
      previous selection in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.ts
- [x] T042 [US3] Add virtual scrolling support for >100 grid rows in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.ts
- [x] T043 [US3] Create unit test specification in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.spec.ts

**Checkpoint**: All core user stories (1-3) should now work together - basic
selection, preview, and advanced discovery functional

---

## Phase 6: User Story 4 - Live Data Inspection (Priority: P4)

**Goal**: Add inspector panel showing query parameters and data preview when
grid row selected

**Independent Test**: Click grid row, verify inspector panel shows query details
and first 5 sample records

### Implementation for User Story 4

- [x] T044 [P] [US4] Create standalone InspectorPanelComponent in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.ts
      with OnPush change detection
- [x] T045 [US4] Implement inspector template in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.html
      using Bootstrap card layout
- [x] T046 [US4] Add component inputs for inspectedRow and previewData in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.ts
- [x] T047 [US4] Implement query parameters display in human-readable format in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.html
- [x] T048 [P] [US4] Add getPreviewData method to QueryExecutorService in
      src/app/spx-magic-selector/services/query-executor.service.ts returning
      first 5 records
- [x] T049 [US4] Integrate InspectorPanelComponent into DiscoveryModalComponent
      layout as side panel in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.html
- [x] T050 [US4] Implement onRowClicked handler to update inspector panel in
      src/app/spx-magic-selector/components/discovery-modal/discovery-modal.component.ts
- [x] T051 [US4] Add loading state for preview data fetch in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.ts
- [x] T052 [US4] Handle zero results case with "No records match this query"
      message in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.html
- [x] T053 [US4] Handle large result sets (>10,000) with "Showing 5 of 10,000+
      records" notification in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.html
- [x] T054 [US4] Implement data preview table with Bootstrap table classes in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.html
- [x] T055 [US4] Create unit test specification in
      src/app/spx-magic-selector/components/discovery-modal/inspector-panel/inspector-panel.component.spec.ts

**Checkpoint**: All user stories should now be independently functional with
complete data inspection capability

---

## Phase 7: Domain Switching & Cross-Cutting Concerns

**Purpose**: Domain management, error handling, and polish features

**Deliverables**: Multi-domain support, comprehensive error handling,
performance optimizations

- [ ] T056 [P] Implement DomainSwitcherService in
      src/app/spx-magic-selector/services/domain-switcher.service.ts
- [ ] T057 Add getCurrentDomain and switchDomain methods in
      src/app/spx-magic-selector/services/domain-switcher.service.ts
- [ ] T058 Integrate domain switching into SpxMagicSelectorComponent with
      domainId input property in
      src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [ ] T059 Add "No matching queries found" message handling for domain switches
      in src/app/spx-magic-selector/components/spx-magic-selector.component.html
- [ ] T060 [P] Implement error handling service with retry logic in
      src/app/spx-magic-selector/services/error-handler.service.ts
- [ ] T061 Add global error handlers for network failures across all components
      in src/app/spx-magic-selector/components/spx-magic-selector.component.ts
- [ ] T062 Implement takeUntil pattern for proper observable cleanup in all
      components (spx-magic-selector.component.ts,
      preview-container.component.ts, discovery-modal.component.ts,
      inspector-panel.component.ts)
- [ ] T063 Add trackBy functions for \*ngFor optimizations in all component
      templates
- [ ] T064 [P] Create service unit test specification in
      src/app/spx-magic-selector/services/selection-data.service.spec.ts
- [ ] T065 [P] Create service unit test specification in
      src/app/spx-magic-selector/services/query-executor.service.spec.ts
- [ ] T066 [P] Create service unit test specification in
      src/app/spx-magic-selector/services/domain-switcher.service.spec.ts
- [ ] T067 Add accessibility attributes (ARIA labels, roles) to all interactive
      elements across all component templates
- [ ] T068 Implement keyboard navigation support for dropdown and grid in
      spx-magic-selector.component.ts and discovery-modal.component.ts
- [ ] T069 Add form validation integration example in
      src/app/spx-magic-selector/examples/ (if examples directory needed)
- [ ] T070 Verify bundle size impact is <500KB and optimize if needed using
      webpack-bundle-analyzer

**Checkpoint**: Feature is production-ready with error handling, performance
optimization, and accessibility compliance

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Start with User Story 1 only** for quickest value delivery:

- Tasks T001-T020 constitute a working MVP
- Delivers core selection functionality
- Can be deployed independently

### Recommended Implementation Order

1. **Phase 1-2** (Setup & Foundation): T001-T011
2. **Phase 3** (User Story 1 - MVP): T012-T020
3. **Phase 4** (User Story 2): T021-T031
4. **Phase 5** (User Story 3): T032-T043
5. **Phase 6** (User Story 4): T044-T055
6. **Phase 7** (Polish): T056-T070

### Parallel Execution Opportunities

**Foundation Phase** (can execute simultaneously):

- T003-T009: All interface definitions (different files)
- T010-T011: Service implementation and mock data

**User Story 1** (parallel opportunities):

- T012-T013: Component class and template (co-developed)
- T020: Unit tests (can write while implementing)

**User Story 2** (parallel opportunities):

- T021-T022: PreviewContainer class and template
- T024-T025: QueryExecutorService (independent from component work)
- T031: Unit tests

**User Story 3** (parallel opportunities):

- T032-T034: DiscoveryModal structure and template
- T035: Data flattening service method (independent)

**User Story 4** (parallel opportunities):

- T044-T045: InspectorPanel class and template
- T048: QueryExecutorService extension (independent from component)

**Polish Phase** (parallel opportunities):

- T056-T057: DomainSwitcherService (independent)
- T060: Error handling service (independent)
- T064-T066: All service tests (different files)

---

## Dependencies

### Story Dependencies

- **User Story 2** requires User Story 1 completion (preview depends on
  selection mechanism)
- **User Story 3** requires User Story 1 completion (modal updates main
  selector)
- **User Story 4** requires User Story 3 completion (inspector is part of modal)
- **Phase 7** can run after any user story is complete (cross-cutting concerns)

### Task Dependencies Within Stories

- **US1**: T014-T018 depend on T012-T013 (component structure must exist)
- **US2**: T026-T027 depend on T021-T023 (component must be created first)
- **US3**: T036-T041 depend on T032-T034 (modal structure must exist)
- **US4**: T049-T053 depend on T044-T046 (inspector component must exist)

---

## Validation Checklist

After each user story phase, verify:

### User Story 1 (Basic Selector)

- [ ] Dropdown opens and displays forms/documents
- [ ] Search filtering works with debouncing
- [ ] Selection updates component state
- [ ] Clear selection resets to empty state
- [ ] ControlValueAccessor works with Angular Forms

### User Story 2 (Preview Display)

- [ ] Preview container appears after selection
- [ ] Entity mapping displays correctly
- [ ] Query description is human-readable
- [ ] Record count updates within 3 seconds
- [ ] Exact counts for <1000 records, approximate for larger

### User Story 3 (Discovery Modal)

- [ ] Advanced trigger opens full-screen modal
- [ ] Grid displays flattened form-query combinations
- [ ] Radio-button selection works correctly
- [ ] Confirm updates main selector
- [ ] Cancel discards changes and retains previous selection

### User Story 4 (Data Inspection)

- [ ] Inspector panel appears on row click
- [ ] Query parameters display in readable format
- [ ] First 5 preview records shown
- [ ] Zero results handled gracefully
- [ ] Large datasets show notification

### Cross-Cutting (Phase 7)

- [ ] Domain switching works without errors
- [ ] Network failures show cached data + retry
- [ ] No memory leaks (observables cleaned up)
- [ ] Accessibility compliance verified
- [ ] Bundle size under 500KB threshold

---

## Notes

- **Bootstrap-Only Styling**: All SCSS files are empty placeholders. All styling
  must use Bootstrap utility classes in templates.
- **OnPush Change Detection**: All components use
  `ChangeDetectionStrategy.OnPush` for performance.
- **Standalone Components**: All components are standalone (Angular 19+
  pattern).
- **No New Dependencies**: Feature uses only existing approved dependencies
  (ng-select, ag-grid-enterprise, Angular Material).
- **Performance Targets**: <1s selection, <2s preview loading, <3s record
  counts.
- **Test Strategy**: Unit tests created for all components and services,
  integration tests not included in initial scope.

**Total Tasks**: 70 **Parallelizable Tasks**: 20 (marked with [P]) **Estimated
MVP**: 20 tasks (T001-T020)
