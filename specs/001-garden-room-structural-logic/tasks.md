# Tasks: Garden Room Structural Logic

**Input**: Design documents from `/specs/001-garden-room-structural-logic/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in the specification, therefore test tasks
are excluded.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths follow the structure defined in plan.md: `src/app/garden-room/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create garden-room feature directory structure at src/app/garden-room
      with subdirectories: components/, models/, services/
- [x] T002 [P] Create garden-room routing file at
      src/app/garden-room/garden-room.routes.ts
- [x] T003 [P] Register garden-room routes in src/app/app.routes.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can
be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Define BuildEnvelope interface in
      src/app/garden-room/models/build-envelope.model.ts
- [x] T005 [P] Define Wall interface in src/app/garden-room/models/wall.model.ts
- [x] T006 [P] Define Member interface in
      src/app/garden-room/models/member.model.ts
- [x] T007 [P] Define StudLayout interface in
      src/app/garden-room/models/stud-layout.model.ts
- [x] T008 [P] Define NogginLayout and NogginRow interfaces in
      src/app/garden-room/models/noggin-layout.model.ts
- [x] T009 [P] Define MaterialLibrary and SheetMaterial interfaces in
      src/app/garden-room/models/material-library.model.ts
- [x] T010 [P] Define CutRequirement and CutPlan interfaces in
      src/app/garden-room/models/cut-requirement.model.ts
- [x] T011 [P] Define HardwareRuleSet interface in
      src/app/garden-room/models/hardware-rule-set.model.ts
- [x] T012 [P] Define OutputBundle, BuyListItem, and HardwareItem interfaces in
      src/app/garden-room/models/output-bundle.model.ts
- [x] T013 [P] Define Project interface in
      src/app/garden-room/models/project.model.ts
- [x] T014 Create StructuralCalculationService skeleton in
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T015 [P] Create MaterialOptimizationService skeleton in
      src/app/garden-room/services/material-optimization.service.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Calculate compliant wall heights (Priority: P1) 🎯 MVP

**Goal**: Derive all wall heights from global height limit and roof fall so the
structure is compliant and the roof sits correctly.

**Independent Test**: Enter height limit, offsets, floor/roof thickness, and
span, then verify the calculated front/back and side wall stud heights match the
formula.

### Implementation for User Story 1

- [x] T016 [P] [US1] Create global-settings component at
      src/app/garden-room/components/global-settings/ with template, styles, and
      TypeScript
- [x] T017 [US1] Implement calculateMaxWallFrameHeight method in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T018 [US1] Add validation for positive wall frame height in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T019 [US1] Implement calculateBackWallHeight method with 1:40 fall in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T020 [US1] Implement calculateSideWallStudHeights method in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T021 [US1] Create @ngrx/signals store for build envelope state in
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T022 [US1] Wire global-settings component to use signals for reactive wall
      height derivation
- [x] T023 [US1] Add form validation and error display to global-settings
      component for zero/negative height scenarios

**Checkpoint**: At this point, User Story 1 should be fully functional and
testable independently - users can input global constraints and see derived wall
heights update in real-time.

---

## Phase 4: User Story 2 - Generate wall member layouts (Priority: P2)

**Goal**: Generate precise layout of studs, plates, and noggins so builders can
construct the frame without guesswork or conflicts.

**Independent Test**: Provide wall length, stud gap, and end zone offsets, then
verify stud positions, plate deductions, and noggin sizing/staggering.

### Implementation for User Story 2

- [x] T024 [P] [US2] Create wall-manager component at
      src/app/garden-room/components/wall-manager/ with template, styles, and
      TypeScript
- [x] T025 [US2] Implement placeStandardStuds method in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T026 [US2] Implement placeDecorativeStuds method in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T027 [US2] Implement resolveStudClashes method (decorative priority) in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T028 [US2] Implement adjustStudHeightsForPlates method in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T029 [US2] Implement calculateNogginLayout with staggering logic in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T030 [US2] Implement calculateSideWallTopPlateLength (hypotenuse) in
      StructuralCalculationService at
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T031 [US2] Create @ngrx/signals store for wall member state in
      src/app/garden-room/services/structural-calculation.service.ts
- [x] T032 [US2] Wire wall-manager component to display member positions and
      types reactively
- [x] T033 [P] [US2] Create wall-visualizer component at
      src/app/garden-room/components/wall-visualizer/ with SVG-based wall
      preview
- [x] T034 [US2] Bind wall-visualizer to signals for real-time member position
      updates

**Checkpoint**: At this point, User Stories 1 AND 2 should both work
independently - users can define walls and see precise member layouts with no
clashes.

---

## Phase 5: User Story 3 - Produce ordering and cut guidance (Priority: P3)

**Goal**: Generate optimized buy, cut, and hardware lists so buyers can order
the right materials and cut them efficiently.

**Independent Test**: Supply a cut list and stock lengths, then verify the buy
list, optimized cutting plan, sheet counts, and hardware totals.

### Implementation for User Story 3

- [ ] T035 [P] [US3] Create material-library component at
      src/app/garden-room/components/material-library/ with template, styles,
      and TypeScript
- [ ] T036 [P] [US3] Create extraction-engine component at
      src/app/garden-room/components/extraction-engine/ with template, styles,
      and TypeScript
- [ ] T037 [US3] Implement First-Fit Decreasing bin packing in
      MaterialOptimizationService at
      src/app/garden-room/services/material-optimization.service.ts
- [ ] T038 [US3] Implement generateCutPlan method in MaterialOptimizationService
      at src/app/garden-room/services/material-optimization.service.ts
- [ ] T039 [US3] Implement calculateSheetCounts method in
      MaterialOptimizationService at
      src/app/garden-room/services/material-optimization.service.ts
- [ ] T040 [US3] Implement generateBuyList method in MaterialOptimizationService
      at src/app/garden-room/services/material-optimization.service.ts
- [ ] T041 [US3] Implement calculateHardwareList method in
      MaterialOptimizationService at
      src/app/garden-room/services/material-optimization.service.ts
- [ ] T042 [US3] Create @ngrx/signals store for output bundle state in
      src/app/garden-room/services/material-optimization.service.ts
- [ ] T043 [US3] Wire extraction-engine component to display buy, cut, and
      hardware lists reactively
- [ ] T044 [US3] Add print styles in src/styles.scss for cut list printout with
      @media print

**Checkpoint**: All user stories should now be independently functional - users
can generate complete material ordering and cutting instructions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T045 [P] Create project-dashboard component at
      src/app/garden-room/components/project-dashboard/ as the parent container
- [ ] T046 Wire project-dashboard to orchestrate global-settings, wall-manager,
      material-library, and extraction-engine components
- [ ] T047 [P] Add unit conversion utilities (mm ↔ cm ↔ m) in
      src/app/garden-room/services/unit-conversion.service.ts
- [ ] T048 Add OnPush change detection strategy to all components
- [ ] T049 Add trackBy functions for \*ngFor in wall-manager and
      extraction-engine components
- [ ] T050 [P] Add edge case handling for extremely short spans in
      StructuralCalculationService
- [ ] T051 [P] Add edge case handling for insufficient stud gaps in
      StructuralCalculationService
- [ ] T052 [P] Add edge case handling for stock lengths shorter than required
      cuts in MaterialOptimizationService
- [ ] T053 Code review and refactoring for clean code standards compliance
- [ ] T054 Run quickstart.md validation scenarios
- [ ] T055 [P] Update documentation in
      specs/001-garden-room-structural-logic/quickstart.md with final routes and
      instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user
  stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No
  dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent
  (integrates with US1 heights but doesn't block if US1 incomplete)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent
  (uses member data from US2 but can be developed in parallel)

### Within Each User Story

- Models and services before components
- Service methods before component wiring
- Core implementation before visualization
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks (T004-T015) marked [P] can run in parallel (within
  Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if
  team capacity allows)
- Within User Story 2: T024 and T033 can run in parallel (different components)
- Within User Story 3: T035 and T036 can run in parallel (different components)
- Within Polish phase: T045, T047, T050, T051, T052, T055 can run in parallel
  (different files)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase, launch models and component together:
Task: "Create global-settings component at src/app/garden-room/components/global-settings/"
Task: "Implement calculateMaxWallFrameHeight method in StructuralCalculationService"
```

---

## Parallel Example: User Story 2

```bash
# Launch component and visualizer together:
Task: "Create wall-manager component at src/app/garden-room/components/wall-manager/"
Task: "Create wall-visualizer component at src/app/garden-room/components/wall-visualizer/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (12 tasks - CRITICAL)
3. Complete Phase 3: User Story 1 (8 tasks)
4. **STOP and VALIDATE**: Test User Story 1 independently - can users input
   constraints and see wall heights?
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (15 tasks)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - 8 tasks)
3. Add User Story 2 → Test independently → Deploy/Demo (11 tasks)
4. Add User Story 3 → Test independently → Deploy/Demo (10 tasks)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (15 tasks)
2. Once Foundational is done:
   - Developer A: User Story 1 (8 tasks)
   - Developer B: User Story 2 (11 tasks)
   - Developer C: User Story 3 (10 tasks)
3. Stories complete and integrate independently

---

## Task Summary

- **Total tasks**: 55
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 12 tasks
- **Phase 3 (User Story 1 - P1)**: 8 tasks
- **Phase 4 (User Story 2 - P2)**: 11 tasks
- **Phase 5 (User Story 3 - P3)**: 10 tasks
- **Phase 6 (Polish)**: 11 tasks

### Parallel opportunities identified: 28 tasks marked [P]

### Independent test criteria:

- **User Story 1**: Input global constraints → verify calculated wall heights
- **User Story 2**: Input wall dimensions and gaps → verify member positions and
  clash resolution
- **User Story 3**: Input material catalog → verify optimized buy/cut/hardware
  lists

### Suggested MVP scope:

- Setup + Foundational + User Story 1 (23 tasks total)
- Delivers: Real-time wall height calculation with validation

---

## Format Validation

✅ ALL tasks follow the checklist format:

- Checkbox: `- [ ]`
- Task ID: T001-T055
- [P] marker: Present on parallelizable tasks
- [Story] label: Present on all user story phase tasks (US1, US2, US3)
- Description: Includes exact file path

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break
  independence
