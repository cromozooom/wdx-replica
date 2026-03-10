# Tasks: Intelligent Template Assistant

**Input**: Design documents from `/specs/001-template-assistant/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅,
contracts/ ✅, quickstart.md ✅

**Tests**: No test tasks included (not requested in specification)

**Organization**: Tasks grouped by user story to enable independent
implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Milkdown dependency installation

- [x] T001 Install Milkdown dependencies (core, preset-commonmark, preset-gfm,
      plugins) per quickstart.md Phase 1.1
- [x] T002 Create feature module directory structure at
      src/app/template-assistant/ per plan.md Project Structure
- [x] T003 [P] Create TypeScript model interfaces in
      src/app/template-assistant/models/template.model.ts
- [x] T004 [P] Create TypeScript model interfaces in
      src/app/template-assistant/models/data-field.model.ts
- [x] T005 [P] Create TypeScript model interfaces in
      src/app/template-assistant/models/customer-record.model.ts
- [x] T006 [P] Create TypeScript model interfaces in
      src/app/template-assistant/models/merged-document.model.ts
- [x] T007 [P] Create TypeScript model interfaces in
      src/app/template-assistant/models/field-format.model.ts
- [x] T008 Create model barrel export in
      src/app/template-assistant/models/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Milkdown pill plugin and infrastructure that ALL user stories
depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 [P] Create pill node schema with atomic property in
      src/app/template-assistant/plugins/pill/pill-node.ts
- [ ] T010 [P] Create pill input rule for trigger character `{{` in
      src/app/template-assistant/plugins/pill/pill-inputrule.ts
- [ ] T011 [P] Create pill command utilities (insert, delete) in
      src/app/template-assistant/plugins/pill/pill-command.ts
- [ ] T012 [P] Create pill markdown serialization in
      src/app/template-assistant/plugins/pill/pill-markdown.ts
- [ ] T013 Compose pill plugin exports in
      src/app/template-assistant/plugins/pill/index.ts
- [ ] T014 [P] Create TemplateStorageService for localStorage CRUD in
      src/app/template-assistant/services/template-storage.service.ts
- [ ] T015 [P] Create DataFieldRegistryService with 20-30 wealth management
      field definitions (Account Number, Balance, Portfolio Value, Investment
      Advisor, Client Since Date, Risk Profile, Annual Income, Net Worth,
      Contact Phone/Email, Address fields, Tax ID, etc.) in
      src/app/template-assistant/services/data-field-registry.service.ts
- [ ] T016 [P] Create TemplatePreviewService for template interpolation in
      src/app/template-assistant/services/template-preview.service.ts
- [ ] T017 [P] Create CustomerDataService that returns sample wealth management
      data from JSON file (MVP uses sample data only, AG-Grid integration
      deferred) in src/app/template-assistant/services/customer-data.service.ts
- [ ] T018 Create sample wealth management customer data JSON with 20-30 fields
      (Full Name, Date of Birth, Sort Code, Account Number, Balance, Portfolio
      Value, Advisor Name, Client Since, Risk Profile, Income, Net Worth,
      Contact details, Address, Tax ID, etc.) in
      src/assets/templates/sample-customer-data.json
- [ ] T019 Create feature routing configuration in
      src/app/template-assistant/template-assistant.routes.ts
- [ ] T020 Register lazy-loaded route in src/app/app.routes.ts for
      /template-assistant path

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Create Document with Data Field Insertion (Priority: P1) 🎯 MVP

**Goal**: Enable analysts to create templates by typing text and inserting data
field pills via trigger characters

**Independent Test**: Create new document, type "Dear " + trigger character `[`,
select "Full Name" field, verify pill inserted with visual formatting. Template
can be saved and contains both static text and field placeholders.

### Implementation for User Story 1

- [ ] T021 [P] [US1] Create TemplateEditorComponent with Milkdown initialization
      in
      src/app/template-assistant/components/template-editor/template-editor.component.ts
- [ ] T022 [P] [US1] Create TemplateEditorComponent template with editor
      container in
      src/app/template-assistant/components/template-editor/template-editor.component.html
- [ ] T023 [P] [US1] Create TemplateEditorComponent styles with Milkdown theme
      in
      src/app/template-assistant/components/template-editor/template-editor.component.scss
- [ ] T024 [US1] Implement Milkdown editor initialization with
      NgZone.runOutsideAngular() per quickstart.md Phase 5
- [ ] T025 [US1] Integrate pill plugin with trigger character `{{` detection
      into editor configuration
- [ ] T026 [US1] Implement pill insertion handler that shows field selector menu
      when trigger typed
- [ ] T027 [P] [US1] Create DataFieldSelectorComponent with searchable field
      list in
      src/app/template-assistant/components/data-field-selector/data-field-selector.component.ts
- [ ] T028 [P] [US1] Create DataFieldSelectorComponent template with dropdown
      menu in
      src/app/template-assistant/components/data-field-selector/data-field-selector.component.html
- [ ] T029 [P] [US1] Create DataFieldSelectorComponent styles in
      src/app/template-assistant/components/data-field-selector/data-field-selector.component.scss
- [ ] T030 [US1] Wire field selector to editor trigger events with @Input
      availableFields and @Output fieldSelected
- [ ] T031 [US1] Implement pill visual rendering with background color and
      border per FR-006 and FR-023
- [ ] T032 [US1] Add markdown serialization to convert pills to {{field_id}}
      syntax for storage
- [ ] T033 [US1] Implement contentChange event emitter with 300ms debounce per
      contracts
- [ ] T034 [US1] Add programmatic focus(), insertPill(), getContent(),
      setContent() methods per contracts

**Checkpoint**: At this point, analysts can create templates with text + data
field pills using trigger characters. Core MVP functionality complete.

---

## Phase 4: User Story 2 - Protected Data Field Tags (Priority: P2)

**Goal**: Ensure data field pills behave as atomic objects that cannot be
partially edited or corrupted

**Independent Test**: Insert pill, try to click inside it, press backspace
adjacent to it - verify entire pill deleted as single unit, no partial editing
allowed. Document integrity maintained.

### Implementation for User Story 2

- [ ] T035 [US2] Configure pill node atom property to true in pill-node.ts
      schema per FR-007
- [ ] T036 [US2] Implement atomic deletion behavior in pill-command.ts for
      backspace/delete keys per FR-008 and FR-020
- [ ] T037 [US2] Add selection behavior that highlights entire pill on click per
      Acceptance Scenario 2
- [ ] T038 [US2] Prevent cursor positioning inside pill (treat as single object)
      per FR-007
- [ ] T039 [US2] Add keyboard handling to prevent typing inside pills per
      Acceptance Scenario 4
- [ ] T040 [US2] Verify regular text can be typed before/after pills without
      affecting integrity per FR-009

**Checkpoint**: Pills are now protected atomic objects - partial deletion and
corruption prevented (SC-005, SC-008)

---

## Phase 5: User Story 4 - Advanced Pill Interactions (Priority: P2-Enhanced)

**Goal**: Add intelligent pill behaviors for quick field swapping (arrow keys,
click-to-edit) and clear visual distinction

**Independent Test**: Navigate with arrow keys across pill boundary → pill
highlights. Click pill → field selector menu appears. Verify visual distinction
(background color, border). Swap field in <3 seconds.

### Implementation for User Story 4

- [ ] T041 [P] [US4] Implement arrow key navigation handler in pill-command.ts
      to detect pill boundary crossing and add visual highlight (no auto-menu)
      per FR-021
- [ ] T042 [US4] Add visual highlight state to pill when cursor adjacent (CSS
      class toggle) per Acceptance Scenario 2
- [ ] T043 [US4] Configure Variable Selector menu to appear on pill click per
      FR-022
- [ ] T044 [US4] Update pill click handler to trigger field selector with
      current pill selected per Acceptance Scenario 3
- [ ] T045 [US4] Enable field search and replacement when pill clicked
      (click-to-edit pattern) per FR-022
- [ ] T046 [P] [US4] Enhance pill styling with distinct background color
      (#E3F2FD) and border in template-editor.component.scss per FR-023
- [ ] T047 [US4] Add hover state styling to pills for better affordance per
      Acceptance Scenario 4
- [ ] T048 [US4] Prevent paste trigger characters from auto-opening menu
      (literal text insertion) per FR-024 and Edge Cases

**Checkpoint**: Advanced pill interactions complete - quick field swapping
enabled (SC-009: <3 seconds), visual distinction clear

---

## Phase 6: User Story 3 - Live Preview Validation (Priority: P3)

**Goal**: Display real-time preview with customer data merged into template for
validation before sending

**Independent Test**: Create template with pills, verify preview pane shows
template with sample data (e.g., "Mr. Adrian Sterling") replacing pills. Change
template → preview updates within <50ms.

### Implementation for User Story 3

- [ ] T049 [P] [US3] Create TemplatePreviewComponent with HTML output display in
      src/app/template-assistant/components/template-preview/template-preview.component.ts
- [ ] T050 [P] [US3] Create TemplatePreviewComponent template with preview
      container in
      src/app/template-assistant/components/template-preview/template-preview.component.html
- [ ] T051 [P] [US3] Create TemplatePreviewComponent styles with email-like
      formatting in
      src/app/template-assistant/components/template-preview/template-preview.component.scss
- [ ] T052 [US3] Implement preview interpolation logic in
      TemplatePreviewService.interpolate() per contracts
- [ ] T053 [US3] Wire editor contentChange events to trigger preview updates
      with ChangeDetectorRef.markForCheck()
- [ ] T054 [US3] Load sample customer data (Adrian Sterling) from
      sample-customer-data.json for preview
- [ ] T055 [US3] Implement field value replacement ({{field_id}} → actual value)
      per FR-012
- [ ] T056 [US3] Add "(Not Available)" placeholder for missing field values per
      FR-013 and Edge Cases
- [ ] T057 [US3] Implement natural text wrapping for long customer values per
      FR-025 and Edge Cases
- [ ] T058 [US3] Optimize preview updates to <50ms interpolation time per
      Performance Goals
- [ ] T059 [US3] Add OnPush change detection strategy to
      TemplatePreviewComponent per plan.md Principle IV

**Checkpoint**: Live preview functional - analysts can validate templates with
merged data before sending (SC-006)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Template persistence, auto-save, manager UI, and documentation

- [ ] T060 [P] [Polish] Create TemplateManagerComponent for CRUD operations in
      src/app/template-assistant/components/template-manager/template-manager.component.ts
- [ ] T061 [P] [Polish] Create TemplateManagerComponent template with template
      list in
      src/app/template-assistant/components/template-manager/template-manager.component.html
- [ ] T062 [P] [Polish] Create TemplateManagerComponent styles in
      src/app/template-assistant/components/template-manager/template-manager.component.scss
- [ ] T063 [Polish] Implement manual Save button with name prompt dialog per
      FR-027 and clarifications
- [ ] T064 [Polish] Implement auto-save draft to localStorage every 30 seconds
      per FR-028
- [ ] T065 [Polish] Implement Load Template from localStorage list per FR-017
- [ ] T066 [Polish] Implement Delete Template from localStorage with
      confirmation
- [ ] T067 [P] [Polish] Implement Download Template to file system
      (.wdx-template.json) per FR-015 and data-model.md
- [ ] T068 [P] [Polish] Implement Upload Template from file system per FR-016
- [ ] T069 [Polish] Create TemplateAssistantComponent container to orchestrate
      all child components in
      src/app/template-assistant/template-assistant.component.ts
- [ ] T070 [Polish] Create TemplateAssistantComponent template with layout grid
      in src/app/template-assistant/template-assistant.component.html
- [ ] T071 [Polish] Create TemplateAssistantComponent styles with responsive
      layout in src/app/template-assistant/template-assistant.component.scss
- [ ] T072 [Polish] Implement @ngrx/signals state management for current
      template and customer selection
- [ ] T073 [Polish] Wire AG-Grid customer row selection to CustomerDataService
      per contracts
- [ ] T074 [Polish] Implement HTML email export as plain unstyled HTML (no
      inline styles, rely on email client defaults) with natural text wrapping
      for long content per FR-026
- [ ] T075 [Polish] Implement hardcoded field format defaults (dates: "10 March
      2026", currency: "$1,234.56", phone: "(123) 456-7890") without
      configuration UI per FR-018 and clarifications
- [ ] T076 [Polish] Implement full undo/redo with Cmd/Ctrl+Z via Milkdown
      history plugin per FR-019
- [ ] T077 [P] [Polish] Add editor component unit tests in
      src/app/template-assistant/components/template-editor/template-editor.component.spec.ts
- [ ] T078 [P] [Polish] Add storage service unit tests in
      src/app/template-assistant/services/template-storage.service.spec.ts
- [ ] T079 [P] [Polish] Add preview service unit tests in
      src/app/template-assistant/services/template-preview.service.spec.ts
- [ ] T080 [Polish] Verify bundle size stays within 115 KB for lazy-loaded
      module per plan.md
- [ ] T081 [Polish] Run quickstart.md validation end-to-end
- [ ] T082 [Polish] Update component documentation with usage examples
- [ ] T083 [Polish] Update README.md with feature overview and screenshots

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (models + Milkdown
  deps) - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel if staffed
  - Or sequentially in priority order: US1 (P1) → US2 (P2) → US4 (P2-Enhanced) →
    US3 (P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No
  dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1
  pill behavior but independently testable
- **User Story 4 (P2-Enhanced)**: Can start after Foundational (Phase 2) -
  Enhances US1/US2 interactions but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Reads from US1
  editor but independently testable with sample data

### Within Each User Story

- Models before services (T003-T008 before T014-T017)
- Pill plugin components in any order (T009-T012 all parallel)
- Plugin composition after components (T013 after T009-T012)
- Services in parallel (T014-T017 all parallel)
- Component files in parallel (TS, HTML, SCSS all parallel within same
  component)
- Component logic after component files complete
- Integration after core implementation

### Parallel Opportunities

**Phase 1 Setup:**

- T003-T007 (all model interfaces) can run in parallel

**Phase 2 Foundational:**

- T009-T012 (pill plugin components) can run in parallel
- T014-T017 (all services) can run in parallel

**Phase 3 User Story 1:**

- T021-T023 (TemplateEditorComponent files) can run in parallel
- T027-T029 (DataFieldSelectorComponent files) can run in parallel
- Component implementation groups can run in parallel by different developers

**Phase 4 User Story 2:**

- All tasks sequential (modify existing pill plugin)

**Phase 5 User Story 4:**

- T041-T042 can run together (arrow key logic + highlight styling)
- T046-T047 can run in parallel (styling tasks)

**Phase 6 User Story 3:**

- T049-T051 (TemplatePreviewComponent files) can run in parallel

**Phase 7 Polish:**

- T060-T062 (TemplateManagerComponent files) can run in parallel
- T067-T068 (download/upload) can run in parallel
- T077-T079 (all unit tests) can run in parallel
- T082-T083 (documentation) can run in parallel

### Cross-Story Parallel Work

If team has 3+ developers:

1. Complete Phase 1 + 2 together (foundation)
2. Once foundational complete:
   - **Developer A**: User Story 1 (T021-T034)
   - **Developer B**: User Story 2 (T035-T040) - can start immediately after
     Phase 2
   - **Developer C**: User Story 4 (T041-T048) - can start immediately after
     Phase 2
   - **Developer D**: User Story 3 (T049-T059) - can start immediately after
     Phase 2
3. Stories complete independently, then integrate in Polish phase

---

## Parallel Example: User Story 1

```bash
# Launch all component file creation together:
Task: "Create TemplateEditorComponent TS in template-editor.component.ts"
Task: "Create TemplateEditorComponent HTML in template-editor.component.html"
Task: "Create TemplateEditorComponent SCSS in template-editor.component.scss"

# Meanwhile, in parallel:
Task: "Create DataFieldSelectorComponent TS in data-field-selector.component.ts"
Task: "Create DataFieldSelectorComponent HTML in data-field-selector.component.html"
Task: "Create DataFieldSelectorComponent SCSS in data-field-selector.component.scss"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008) → ~2 hours
2. Complete Phase 2: Foundational (T009-T020) → ~1-2 days (pill plugin is core
   complexity)
3. Complete Phase 3: User Story 1 (T021-T034) → ~2-3 days
4. **STOP and VALIDATE**: Test US1 independently
   - Create template with trigger characters
   - Insert multiple data field pills
   - Save to localStorage
   - Verify pills render correctly
5. Deploy/demo MVP: Basic template editor with pill insertion ✅

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → ~2-3 days
   - Milkdown installed
   - Pill plugin working
   - Services ready
2. **MVP Release** (+ User Story 1) → +2-3 days = **~5-6 days total**
   - Template creation with pills
   - Trigger character menu
   - localStorage persistence
   - **VALUE**: Analysts can create reusable templates
3. **Integrity Release** (+ User Story 2) → +1 day = **~6-7 days total**
   - Atomic deletion
   - Protected pills
   - **VALUE**: Zero corrupted templates (SC-005, SC-008)
4. **Enhanced UX Release** (+ User Story 4) → +2 days = **~8-9 days total**
   - Arrow key navigation
   - Click-to-edit
   - Visual distinction
   - **VALUE**: <3 second field swapping (SC-009)
5. **Validation Release** (+ User Story 3) → +1-2 days = **~10-11 days total**
   - Live preview with merged data
   - **VALUE**: Confidence in output (SC-006)
6. **Complete Release** (+ Polish Phase 7) → +2-3 days = **~12-14 days total**
   - Template manager UI
   - Auto-save
   - Download/upload
   - Full feature set complete

### Parallel Team Strategy (3 developers)

**Week 1:**

- Days 1-2: All devs complete Phase 1 + 2 together (foundation)
- Days 3-5: Parallel user story development:
  - Dev A: User Story 1 (P1) - MVP critical path
  - Dev B: User Story 2 (P2) - Can work independently on pill plugin
    enhancements
  - Dev C: User Story 4 (P2-Enhanced) - Can work independently on interaction
    patterns

**Week 2:**

- Days 1-2:
  - Dev A: User Story 3 (P3) - Preview component
  - Dev B + C: Polish phase template manager (T060-T066)
- Days 3-4: All devs on Polish phase integration (T069-T076)
- Day 5: Testing, docs, validation (T077-T083)

**Timeline**: ~10 working days with 3 developers (vs. 12-14 days solo)

---

## Notes

- **[P] tasks** = different files, no blocking dependencies, can parallelize
- **[Story] label** = maps task to specific user story for traceability and
  independent testing
- **Milkdown pill plugin** (Phase 2) is foundation for ALL user stories -
  highest priority
- **MVP = User Story 1** alone delivers core value (template creation with
  pills)
- Each user story should be independently completable and testable without
  others
- Stop at any checkpoint to validate story independently before proceeding
- Commit after each task or logical group (e.g., after component file trio:
  TS+HTML+SCSS)
- Bundle size monitoring throughout (target: 115 KB lazy-loaded)
- Performance targets: <50ms preview, 60fps typing, 1000+ AG-Grid rows zero lag

---

## Task Count Summary

- **Phase 1 (Setup)**: 8 tasks (1-2 hours)
- **Phase 2 (Foundational)**: 12 tasks (1-2 days) - CRITICAL PATH
- **Phase 3 (User Story 1)**: 14 tasks (2-3 days) - MVP
- **Phase 4 (User Story 2)**: 6 tasks (1 day)
- **Phase 5 (User Story 4)**: 8 tasks (2 days)
- **Phase 6 (User Story 3)**: 11 tasks (1-2 days)
- **Phase 7 (Polish)**: 24 tasks (2-3 days)

**Total**: 83 tasks

**Estimated Timeline**:

- Solo developer: 12-14 days
- 2 developers: 8-10 days
- 3 developers: 7-9 days

**MVP (Phase 1+2+3 only)**: 34 tasks, ~5-6 days solo
