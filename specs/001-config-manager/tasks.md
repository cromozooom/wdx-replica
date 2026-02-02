---
description: "Task list for Configuration Manager implementation"
---

# Tasks: Configuration Manager

**Input**: Design documents from `/specs/001-config-manager/`  
**Prerequisites**: plan.md (complete), spec.md (complete), research.md
(complete), data-model.md (complete), quickstart.md (complete)

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create feature module directory structure at
      src/app/configuration-manager/
- [x] T002 [P] Create routing configuration in
      src/app/configuration-manager/configuration-manager.routes.ts
- [x] T003 [P] Create default configuration templates in
      src/assets/configuration-templates/ (6 template files)
- [x] T004 [P] Add lazy route to main app routes in src/app/app.routes.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can
be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Models & Types

- [x] T005 [P] Create ConfigurationType enum in
      src/app/configuration-manager/models/configuration-type.enum.ts
- [x] T006 [P] Create UpdateEntry interface in
      src/app/configuration-manager/models/update-entry.model.ts
- [x] T007 [P] Create Configuration interface in
      src/app/configuration-manager/models/configuration.model.ts
- [x] T008 [P] Create ExportPackage interface in
      src/app/configuration-manager/models/export-package.model.ts

### Utilities

- [x] T009 [P] Implement version validator utility in
      src/app/configuration-manager/utils/version-validator.ts
- [x] T010 [P] Implement Jira ticket validator utility in
      src/app/configuration-manager/utils/jira-validator.ts
- [x] T011 [P] Implement semantic version comparator in
      src/app/configuration-manager/utils/semantic-version-comparator.ts

### Core Services (Foundation)

- [x] T012 Implement IndexedDB storage service in
      src/app/configuration-manager/services/configuration-storage.service.ts
- [x] T013 Implement configuration validator service in
      src/app/configuration-manager/services/configuration-validator.service.ts
- [x] T014 [P] Implement team member service in
      src/app/configuration-manager/services/team-member.service.ts
- [x] T014a [P] Implement toast notification service using
      @ng-bootstrap/ng-bootstrap in
      src/app/configuration-manager/services/notification.service.ts
- [x] T015 Implement configuration service (CRUD operations) in
      src/app/configuration-manager/services/configuration.service.ts

### State Management

- [x] T016 Create configuration store with @ngrx/signals in
      src/app/configuration-manager/store/configuration.store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Create and Edit Configuration (Priority: P1) 🎯 MVP

**Goal**: Users can create, edit, and save configurations using appropriate
editors based on type

**Independent Test**: User navigates to configuration manager, clicks "New
Configuration", selects type, enters metadata, edits content in JSON/Ace editor,
saves, and sees configuration in grid after browser refresh.

### Components for User Story 1

- [X] T017 [P] [US1] Create main container component in
      src/app/configuration-manager/configuration-manager.component.ts (smart
      component with routing)
- [X] T018 [P] [US1] Create configuration metadata form component in
      src/app/configuration-manager/components/configuration-metadata-form/configuration-metadata-form.component.ts
      (dumb)
- [X] T019 [P] [US1] Create JSON editor wrapper component in
      src/app/configuration-manager/components/json-editor/json-editor.component.ts
      (dumb)
- [X] T020 [P] [US1] Create Ace editor wrapper component in
      src/app/configuration-manager/components/ace-editor/ace-editor.component.ts
      (dumb)

### Editor Orchestration

- [X] T021 [US1] Create configuration editor component in
      src/app/configuration-manager/components/configuration-editor/configuration-editor.component.ts
      (smart - orchestrates editors and form)
- [X] T022 [US1] Implement editor modal integration using ng-bootstrap in
      configuration-editor.component.ts
- [X] T023 [US1] Add editor type switching logic (JSON vs FetchXML vs text) in
      configuration-editor.component.ts

### Templates & Styling

- [X] T024 [P] [US1] Create metadata form template in
      src/app/configuration-manager/components/configuration-metadata-form/configuration-metadata-form.component.html
- [X] T025 [P] [US1] Create JSON editor template in
      src/app/configuration-manager/components/json-editor/json-editor.component.html
- [X] T026 [P] [US1] Create Ace editor template in
      src/app/configuration-manager/components/ace-editor/ace-editor.component.html
- [X] T027 [P] [US1] Create editor component template in
      src/app/configuration-manager/components/configuration-editor/configuration-editor.component.html
- [X] T028 [P] [US1] Style metadata form component in
      src/app/configuration-manager/components/configuration-metadata-form/configuration-metadata-form.component.scss
- [X] T029 [P] [US1] Style JSON editor component in
      src/app/configuration-manager/components/json-editor/json-editor.component.scss
- [X] T030 [P] [US1] Style Ace editor component in
      src/app/configuration-manager/components/ace-editor/ace-editor.component.scss
- [X] T031 [P] [US1] Style editor component in
      src/app/configuration-manager/components/configuration-editor/configuration-editor.component.scss

### Integration & Validation

- [X] T032 [US1] Implement configuration creation workflow in
      configuration-manager.component.ts
- [X] T033 [US1] Implement configuration save logic with validation in
      configuration.service.ts
- [X] T034 [US1] Add ID auto-generation in configuration.service.ts
- [X] T035 [US1] Add timestamp management (createdDate, lastModifiedDate) in
      configuration.service.ts
- [X] T036 [US1] Implement JSON validation in configuration-validator.service.ts
- [X] T037 [US1] Implement FetchXML validation using DOMParser in
      configuration-validator.service.ts

### Main Container

- [X] T038 [US1] Create main container template in
      src/app/configuration-manager/configuration-manager.component.html
- [X] T039 [US1] Style main container in
      src/app/configuration-manager/configuration-manager.component.scss

**Checkpoint**: User Story 1 complete - users can create, edit, and save
configurations independently

---

## Phase 4: User Story 2 - Track Configuration Versions and Updates (Priority: P1) 🎯 MVP

**Goal**: Users can document changes to configurations with update history
including Jira references, comments, dates, and authors

**Independent Test**: User edits existing configuration, adds update entry with
Jira ticket or markdown comment, date, and author from dropdown. Update history
saves and displays chronologically.

### Components for User Story 2

- [X] T040 [P] [US2] Create update history component in
      src/app/configuration-manager/components/update-history/update-history.component.ts
      (dumb - displays update list)
- [X] T041 [P] [US2] Create update history template in
      src/app/configuration-manager/components/update-history/update-history.component.html
- [X] T042 [P] [US2] Style update history component in
      src/app/configuration-manager/components/update-history/update-history.component.scss

### Update Entry Management

- [X] T043 [US2] Add update entry form to metadata form component in
      configuration-metadata-form.component.ts
- [X] T044 [US2] Implement update entry validation (Jira OR comment required) in
      configuration-validator.service.ts
- [X] T045 [US2] Add update entry to metadata form template in
      configuration-metadata-form.component.html
- [X] T046 [US2] Integrate team member dropdown in update entry form using
      team-member.service.ts

### Markdown Support

- [X] T047 [P] [US2] Add ngx-markdown rendering for comments in
      update-history.component.html
- [X] T048 [P] [US2] Configure markdown sanitization in
      update-history.component.ts

### Update Logic

- [X] T049 [US2] Implement update array management in configuration.service.ts
- [X] T050 [US2] Add update sorting (most recent first) in
      update-history.component.ts
- [X] T051 [US2] Update save logic to append new UpdateEntry on edit in
      configuration.service.ts

**Checkpoint**: User Story 2 complete - configuration change tracking is fully
functional

---

## Phase 5: User Story 3 - View and Filter Configurations in Grid (Priority: P2)

**Goal**: Users can view all configurations in AG-Grid with filter, search, and
sort capabilities

**Independent Test**: User views all configurations in AG-Grid Enterprise,
filters by type, searches by name, sorts by version, and double-clicks to open
editor.

### Grid Component

- [X] T052 [P] [US3] Create configuration grid component in
      src/app/configuration-manager/components/configuration-grid/configuration-grid.component.ts
      (dumb)
- [X] T053 [P] [US3] Create grid template in
      src/app/configuration-manager/components/configuration-grid/configuration-grid.component.html
- [X] T054 [P] [US3] Style grid component in
      src/app/configuration-manager/components/configuration-grid/configuration-grid.component.scss

### AG-Grid Configuration

- [X] T055 [US3] Define column definitions with proper types in
      configuration-grid.component.ts
- [X] T056 [US3] Implement semantic version comparator for version column in
      configuration-grid.component.ts
- [X] T057 [US3] Configure AG-Grid options (row selection, virtual scrolling,
      row buffer) in configuration-grid.component.ts
- [X] T058 [US3] Implement getRowId for stable row identity in
      configuration-grid.component.ts

### Filtering & Search

- [X] T059 [US3] Add type filter dropdown to grid in
      configuration-grid.component.html
- [X] T060 [US3] Add search input box to grid in
      configuration-grid.component.html
- [X] T061 [US3] Implement filter logic in configuration.store.ts (filterType
      computed signal)
- [X] T062 [US3] Implement search logic in configuration.store.ts (searchTerm
      computed signal)
- [X] T063 [US3] Wire filter/search to store actions in
      configuration-manager.component.ts

### Grid Integration

- [X] T064 [US3] Integrate grid component into main container template in
      configuration-manager.component.html
- [X] T065 [US3] Implement row double-click handler to open editor in
      configuration-manager.component.ts
- [X] T066 [US3] Add loading state indicator to grid in
      configuration-grid.component.html
- [X] T067 [US3] Implement error handling for grid data loading in
      configuration-manager.component.ts

**Checkpoint**: User Story 3 complete - grid display with full
filter/search/sort capabilities functional

---

## Phase 6: User Story 4 - Export Configurations as ZIP (Priority: P2)

**Goal**: Users can export single or multiple configurations as ZIP archive for
backup and sharing

**Independent Test**: User selects configurations via checkboxes, clicks
"Export", and receives ZIP download with structured files (metadata.json + value
files).

### Export Service

- [ ] T068 [P] [US4] Create export service in
      src/app/configuration-manager/services/configuration-export.service.ts
- [ ] T069 [US4] Implement ZIP structure generation using jszip in
      configuration-export.service.ts
- [ ] T070 [US4] Implement metadata file creation in
      configuration-export.service.ts
- [ ] T071 [US4] Implement value file creation with correct extension
      (.json/.xml) in configuration-export.service.ts
- [ ] T072 [US4] Implement manifest.json generation in
      configuration-export.service.ts
- [ ] T073 [US4] Implement file download using file-saver in
      configuration-export.service.ts

### Grid Selection

- [ ] T074 [US4] Add checkbox column to grid for row selection in
      configuration-grid.component.ts
- [ ] T075 [US4] Implement selection state management in configuration.store.ts
      (selectedIds)
- [ ] T076 [US4] Add selection change handler in configuration-grid.component.ts

### Export UI

- [ ] T077 [US4] Add "Export Selected" button to main container in
      configuration-manager.component.html
- [ ] T078 [US4] Add "Export All" button to main container in
      configuration-manager.component.html
- [ ] T079 [US4] Implement export button click handlers in
      configuration-manager.component.ts
- [ ] T080 [US4] Add validation for empty selection in
      configuration-manager.component.ts
- [ ] T081 [US4] Add loading indicators for all async operations (save, export,
      import) in respective component templates

**Checkpoint**: User Story 4 complete - export functionality fully operational

---

## Phase 7: User Story 5 - Import Configurations with Conflict Detection (Priority: P3)

**Goal**: Users can import ZIP archive with conflict detection and resolution
options (overwrite, keep existing, import as new)

**Independent Test**: User uploads ZIP, sees conflict detection report for
matching IDs, views side-by-side comparison, and chooses resolution for each
conflict.

### Import Service

- [ ] T082 [P] [US5] Create import service in
      src/app/configuration-manager/services/configuration-import.service.ts
- [ ] T083 [US5] Implement ZIP file parsing using jszip in
      configuration-import.service.ts
- [ ] T084 [US5] Implement configuration deserialization from ZIP structure in
      configuration-import.service.ts
- [ ] T085 [US5] Implement conflict detection by ID in
      configuration-import.service.ts
- [ ] T086 [US5] Implement difference finder (metadata + content) in
      configuration-import.service.ts

### Import Wizard Component

- [ ] T087 [P] [US5] Create import wizard component in
      src/app/configuration-manager/components/import-wizard/import-wizard.component.ts
      (smart)
- [ ] T088 [P] [US5] Create import wizard template in
      src/app/configuration-manager/components/import-wizard/import-wizard.component.html
- [ ] T089 [P] [US5] Style import wizard in
      src/app/configuration-manager/components/import-wizard/import-wizard.component.scss

### Import Wizard State

- [ ] T090 [US5] Create import wizard store in
      src/app/configuration-manager/store/import-wizard.store.ts
- [ ] T091 [US5] Add file upload step to wizard in import-wizard.component.html
- [ ] T092 [US5] Add conflict review step to wizard in
      import-wizard.component.html
- [ ] T093 [US5] Add completion step to wizard in import-wizard.component.html

### Conflict Comparison Component

- [ ] T094 [P] [US5] Create conflict comparison component in
      src/app/configuration-manager/components/conflict-comparison/conflict-comparison.component.ts
      (dumb)
- [ ] T095 [P] [US5] Create side-by-side comparison template in
      src/app/configuration-manager/components/conflict-comparison/conflict-comparison.component.html
- [ ] T096 [P] [US5] Style comparison component in
      src/app/configuration-manager/components/conflict-comparison/conflict-comparison.component.scss

### Diff Highlighting

- [ ] T097 [US5] Implement metadata diff highlighting in
      conflict-comparison.component.ts
- [ ] T098 [US5] Implement content diff highlighting in
      conflict-comparison.component.ts
- [ ] T099 [US5] Add resolution buttons (Overwrite, Keep, Import as New) to
      comparison template

### Import Logic

- [ ] T100 [US5] Implement ZIP validation (structure, file size limits) in
      configuration-import.service.ts
- [ ] T101 [US5] Implement resolution application logic in
      configuration-import.service.ts
- [ ] T102 [US5] Implement "Import as New" with new ID generation in
      configuration-import.service.ts
- [ ] T103 [US5] Add error handling for invalid ZIP structure in
      import-wizard.component.ts

### Import UI Integration

- [ ] T104 [US5] Add "Import" button to main container in
      configuration-manager.component.html
- [ ] T105 [US5] Implement import modal launch using ng-bootstrap in
      configuration-manager.component.ts
- [ ] T106 [US5] Implement drag-and-drop file upload in
      import-wizard.component.ts
- [ ] T107 [US5] Add import success/error notifications using
      notification.service.ts in import-wizard.component.ts

**Checkpoint**: User Story 5 complete - full import workflow with conflict
detection operational

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, accessibility, error handling, and final
integration

### Performance Optimization

- [ ] T108 [P] Implement lazy loading for jsoneditor library in
      json-editor.component.ts
- [ ] T109 [P] Implement lazy loading for ace-builds library in
      ace-editor.component.ts
- [ ] T110 [P] Add OnPush change detection to all components
- [ ] T111 [P] Add trackBy functions to all \*ngFor loops in templates
- [ ] T112 [P] Implement debounce (300ms) for search input in
      configuration-manager.component.ts
- [ ] T113 [P] Add memory cleanup in ngOnDestroy for all components (dispose
      editors, clear large data)

### Error Handling

- [ ] T114 [P] Add error boundary handling in configuration-manager.component.ts
- [ ] T115 [P] Implement user-friendly error messages using
      notification.service.ts for all validation failures
- [ ] T116 [P] Add error recovery options for failed operations
- [ ] T117 [P] Implement logging for critical errors

### Accessibility

- [ ] T118 [P] Add ARIA labels to all interactive elements
- [ ] T119 [P] Ensure keyboard navigation works for all workflows
- [ ] T120 [P] Add focus management for modals and editors
- [ ] T121 [P] Test with screen readers and fix issues

### Final Integration

- [ ] T122 Wire all components together in main container template
- [ ] T123 Test complete CRUD workflow end-to-end
- [ ] T124 Test export/import workflow with conflict resolution
- [ ] T125 Verify bundle size is <100KB (gzipped) for feature module
- [ ] T126 Run linter and fix all warnings (zero tolerance)
- [ ] T127 Update documentation with any implementation notes

---

## Task Summary

**Total Tasks**: 127

### By Phase:

- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 12 tasks (BLOCKING)
- Phase 3 (US1 - Create/Edit): 23 tasks
- Phase 4 (US2 - Version Tracking): 12 tasks
- Phase 5 (US3 - Grid Display): 16 tasks
- Phase 6 (US4 - Export): 14 tasks
- Phase 7 (US5 - Import): 26 tasks
- Phase 8 (Polish): 20 tasks

### By User Story:

- US1 (P1): 23 tasks - **MVP CRITICAL**
- US2 (P1): 12 tasks - **MVP CRITICAL**
- US3 (P2): 16 tasks
- US4 (P2): 14 tasks
- US5 (P3): 26 tasks

### Parallelization Opportunities:

- **58 tasks marked [P]** can be executed in parallel
- Setup phase: All 3 tasks can run in parallel
- Foundational: 8 out of 12 tasks can run in parallel
- Within each user story: Multiple component/template/style tasks can run in
  parallel

### MVP Scope (Recommended):

- **Phase 1**: Setup (4 tasks)
- **Phase 2**: Foundational (12 tasks) - MUST complete
- **Phase 3**: User Story 1 (23 tasks) - Create/Edit configurations
- **Phase 4**: User Story 2 (12 tasks) - Version tracking
- **Total MVP**: 51 tasks

This provides a fully functional configuration manager with create, edit, save,
version tracking, and persistence. Grid display, export, and import can be added
incrementally after MVP.

---

## Dependencies & Sequencing

### Critical Path:

1. Phase 1 (Setup) → Phase 2 (Foundational) **MUST** complete first
2. After Phase 2: User stories can be implemented in parallel or sequentially by
   priority
3. Phase 8 (Polish) should be done incrementally throughout and finalized at end

### Story Dependencies:

- **US1** (Create/Edit): No dependencies on other stories
- **US2** (Version Tracking): Requires US1 (needs editor component)
- **US3** (Grid Display): Independent, can be parallel with US1/US2
- **US4** (Export): Requires US3 (needs grid selection) OR US1 (can export from
  editor)
- **US5** (Import): Requires US1 (needs editor for viewing), US3 (needs grid for
  display)

### Recommended Implementation Order:

1. **Phase 1 + Phase 2** (foundational - 16 tasks)
2. **Phase 3** (US1 - 23 tasks) - Core functionality
3. **Phase 4** (US2 - 12 tasks) - Completes MVP
4. **Phase 5** (US3 - 16 tasks) - Enhanced UX
5. **Phase 6** (US4 - 14 tasks) - Backup capability
6. **Phase 7** (US5 - 26 tasks) - Full collaboration
7. **Phase 8** (Polish - 20 tasks) - Final refinement

---

## Validation Checklist

- [x] All tasks follow format:
      `- [ ] [ID] [P?] [Story?] Description with file path`
- [x] All user stories from spec.md have corresponding task phases
- [x] All entities from data-model.md have creation tasks
- [x] All services from plan.md have implementation tasks
- [x] All components from plan.md have creation tasks
- [x] Foundational phase clearly marked as BLOCKING
- [x] Independent test criteria mapped to phase checkpoints
- [x] MVP scope clearly defined (US1 + US2 = 51 tasks)
- [x] Parallelization opportunities identified ([P] markers)
- [x] Dependencies and sequencing documented
- [x] Constitutional compliance considered (OnPush, standalone, bundle size)

**Status**: ✅ **READY FOR IMPLEMENTATION**
