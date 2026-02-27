# Tasks: Adaptive Hierarchical Navigation Sidebar

**Input**: Design documents from `/specs/001-jira-sidebar-nav/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/,
quickstart.md

**Tests**: No explicit test requirements found in specification. Test tasks are
NOT included in this task list.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to repository root: `src/app/jira-sidebar-nav/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic directory structure

- [x] T001 Create feature module directory structure:
      src/app/jira-sidebar-nav/{components,models,services,utils}
- [x] T002 [P] Create component subdirectories:
      components/{sidebar-menu,menu-item,sidebar-toggle,icon-picker,modals/{menu-item-editor,delete-confirmation,add-submenu}}
- [x] T003 [P] Create model interface files:
      models/{menu-item,sidebar-state,menu-structure,drag-drop,icon-definition}.interface.ts
      and models/index.ts barrel export
- [x] T004 [P] Create FontAwesome icons constants in
      utils/font-awesome-icons.const.ts with 50-100 common icons (fas fa-home,
      fas fa-compass, etc.)
- [x] T005 Add lazy-loaded route for jira-sidebar-nav in src/app/app.routes.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can
be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Implement MenuItem interface in models/menu-item.interface.ts
      (id, label, icon, routerLink, children, expanded, order, metadata)
- [x] T007 [P] Implement SidebarState interface in
      models/sidebar-state.interface.ts (visibilityMode enum, isLocked,
      isEditMode, currentWidth, activeItemId, expandedNodeIds)
- [x] T008 [P] Implement MenuStructure interface in
      models/menu-structure.interface.ts (rootItems, itemsById Map, maxDepth,
      totalItemCount)
- [x] T009 [P] Implement DragDropContext interface in
      models/drag-drop.interface.ts (draggedItem, targetParent, dropType enum,
      isValid)
- [x] T010 [P] Implement IconDefinition interface in
      models/icon-definition.interface.ts (id, label, category, cssClass)
- [x] T011 Create MenuLocalStorage utility class in utils/menu-local-storage.ts
      with methods: saveMenuStructure(), loadMenuStructure(),
      saveExpandedNodes(), loadExpandedNodes(), saveSidebarLocked(),
      loadSidebarLocked()
- [x] T012 Create MenuTreeUtils utility class in utils/menu-tree.utils.ts with
      methods: buildItemsMap(), calculateMaxDepth(), validateStructure(),
      findItemById(), getAllDescendants()
- [x] T013 Create mock data service in services/menu-mock-data.service.ts with
      default 3-level menu structure (Dashboard > Analytics/Reports, Projects >
      Active/Archived, Settings)
- [x] T014 Implement MenuDataService in services/menu-data.service.ts with
      signal-based state, localStorage sync via effect(), CRUD methods (addItem,
      updateItem, deleteItem, moveItem)
- [x] T080 [P] Enhance MenuTreeUtils.validateStructure() in
      utils/menu-tree.utils.ts to enforce maximum depth of 5 levels (FR-033),
      throw error if depth exceeded
- [x] T081 [P] Add localStorage error handling in utils/menu-local-storage.ts:
      wrap all save operations in try-catch for QuotaExceededError, emit error
      event or return false on failure (FR-032)

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Basic Navigation and Menu Interaction (Priority: P1) 🎯 MVP

**Goal**: Users can navigate through hierarchical menu, expand/collapse items,
lock sidebar visible, and experience auto-hide behavior

**Independent Test**: Load application, hover over 20px strip to reveal sidebar,
expand/collapse menu items, click to navigate, lock sidebar to keep visible,
verify auto-hide after 3 seconds when unlocked

### Implementation for User Story 1

- [x] T015 [P] [US1] Create JiraSidebarContainerComponent in
      jira-sidebar-nav.component.ts (standalone, OnPush) with signal-based state
      management
- [x] T016 [P] [US1] Create SidebarMenuComponent in
      components/sidebar-menu/sidebar-menu.component.ts (standalone, OnPush)
      with Material Tree imports
- [x] T017 [P] [US1] Create MenuItemComponent in
      components/menu-item/menu-item.component.ts (standalone, OnPush) for
      individual item rendering
- [x] T018 [P] [US1] Create SidebarToggleComponent in
      components/sidebar-toggle/sidebar-toggle.component.ts (standalone, OnPush)
      for lock/unlock button
- [x] T019 [US1] Implement JiraSidebarContainerComponent state initialization:
      load from localStorage via MenuDataService, fallback to mock data,
      initialize signals (menuItems, isLocked, currentWidth, activeItemId)
- [x] T020 [US1] Implement computed signals in JiraSidebarContainerComponent:
      menuItems, isLocked, isEditMode, currentWidth, expandedNodeIds
- [x] T021 [US1] Implement toggleLock() method in JiraSidebarContainerComponent:
      toggle state.isLocked, save to localStorage, mark for check
- [x] T022 [US1] Implement expandSidebar() and collapseSidebar() methods in
      JiraSidebarContainerComponent: transition between Hidden (20px) and
      Temporary Visible (280px) states
- [x] T023 [US1] Setup Material Tree in SidebarMenuComponent: configure
      NestedTreeControl with node.children accessor, MatTreeNestedDataSource
      with menuItems input
- [x] T024 [US1] Implement expansion state management in SidebarMenuComponent:
      use expandedNodeIds input Set, emit nodeToggled events with itemId and
      expanded boolean
- [x] T025 [US1] Implement active item highlighting in MenuItemComponent: accept
      activeItemId input, apply active CSS class conditionally, use
      router.isActive for route matching
- [x] T026 [US1] Implement auto-hide timer with RxJS in
      JiraSidebarContainerComponent: fromEvent for mouseenter/mouseleave on
      sidebar and trigger elements, timer(3000), switchMap for cancellation,
      takeUntilDestroyed()
- [x] T027 [US1] Create JiraSidebarContainerComponent template in
      jira-sidebar-nav.component.html: sidebar container with width binding,
      sidebar-toggle component, sidebar-menu component with event bindings
- [x] T028 [US1] Create SidebarMenuComponent template in
      components/sidebar-menu/sidebar-menu.component.html: mat-tree with
      mat-nested-tree-node, expansion icons, indentation with padding-left
      binding (level \* 24px)
- [x] T029 [US1] Create MenuItemComponent template in
      components/menu-item/menu-item.component.html: icon element with dynamic
      class binding, label text, active state styling
- [x] T030 [US1] Create SidebarToggleComponent template in
      components/sidebar-toggle/sidebar-toggle.component.html: lock/unlock icon
      button, tooltip, click handler
- [x] T031 [US1] Implement SCSS for JiraSidebarContainerComponent in
      jira-sidebar-nav.component.scss: sidebar positioning (fixed left), width
      transitions (300ms cubic-bezier), transform for collapse/expand, z-index
      layering
- [x] T032 [US1] Implement SCSS for SidebarMenuComponent in
      components/sidebar-menu/sidebar-menu.component.scss: tree node styling,
      indentation, expansion icons, hover states, active item highlighting
- [x] T033 [US1] Integrate localStorage sync in JiraSidebarContainerComponent:
      effect() to save expandedNodeIds and isLocked on state changes, load on
      ngOnInit
- [x] T034 [US1] Wire up navigation in MenuItemComponent: accept routerLink
      input, use routerLink directive, emit itemClicked event for container to
      handle
- [x] T035 [US1] Implement OnPush change detection optimization: inject
      ChangeDetectorRef, call markForCheck() after manual state updates, use
      async pipe for observables
- [x] T082 [US1] Implement label truncation in MenuItemComponent template and
      SCSS: max-width on label element, text-overflow: ellipsis, white-space:
      nowrap, title attribute binding for tooltip showing full text (FR-031)
- [x] T083 [US1] Add error notification component or service integration in
      JiraSidebarContainerComponent to display localStorage quota warnings from
      MenuDataService (FR-032)

**Checkpoint**: At this point, User Story 1 (MVP) should be fully functional -
users can navigate, expand/collapse, lock sidebar, experience auto-hide

---

## Phase 4: User Story 2 - Menu Structure Management (Priority: P2)

**Goal**: Administrators can add, edit, delete, and reorder menu items through
edit mode with modals and drag-drop

**Independent Test**: Toggle edit mode, create new menu item with icon picker,
edit existing item, delete item (test both cascade and promote options),
drag-drop items to reorder and change hierarchy

### Implementation for User Story 2

- [x] T036 [P] [US2] Create IconPickerComponent in
      components/icon-picker/icon-picker.component.ts (standalone, OnPush,
      reusable) with ng-select integration
- [x] T037 [P] [US2] Create MenuItemEditorComponent in
      components/modals/menu-item-editor/menu-item-editor.component.ts
      (standalone, OnPush) with NgbActiveModal
- [x] T038 [P] [US2] Create DeleteConfirmationComponent in
      components/modals/delete-confirmation/delete-confirmation.component.ts
      (standalone, OnPush) with NgbActiveModal
- [x] T039 [P] [US2] Implement MenuValidationService in
      services/menu-validation.service.ts with methods:
      wouldCreateCircularReference(), validateDrop(), isDescendant()
- [x] T040 [US2] Implement edit mode toggle in JiraSidebarContainerComponent:
      toggleEditMode() method, check authorization (placeholder for future),
      update state.isEditMode signal
- [x] T041 [US2] Implement IconPickerComponent template in
      components/icon-picker/icon-picker.component.html: ng-select with custom
      option templates showing icon + label, search enabled, bindLabel="label",
      bindValue="id"
- [x] T042 [US2] Implement IconPickerComponent logic: accept selectedIcon input,
      emit iconChange output, load FONT_AWESOME_ICONS constant, handle selection
- [x] T043 [US2] Create MenuItemEditorComponent template in
      components/modals/menu-item-editor/menu-item-editor.component.html: modal
      header/body/footer, ReactiveForm with label FormControl, icon-picker
      component, validation messages
- [x] T084 [US2] Add icon format validation in IconPickerComponent and
      MenuItemEditorComponent: validate selected icon matches pattern
      `/^fa[srlab] fa-[a-z0-9-]+$/`, display validation error if invalid
      (FR-034)
- [x] T044 [US2] Implement MenuItemEditorComponent logic: accept menuItem input,
      create FormGroup with label and icon controls, Validators.required for
      label, onSave() to close modal with form value, onCancel() to dismiss
- [x] T045 [US2] Create DeleteConfirmationComponent template in
      components/modals/delete-confirmation/delete-confirmation.component.html:
      modal with message, radio buttons for cascade vs promote (if children
      exist), confirm/cancel buttons
- [x] T046 [US2] Implement DeleteConfirmationComponent logic: accept menuItem
      input, show different UI if children exist, onConfirm() to close with
      choice (cascade/promote/simple), onCancel() to dismiss
- [x] T047 [US2] Add openEditDialog() method in JiraSidebarContainerComponent:
      inject NgbModal, open MenuItemEditorComponent, pass menuItem, handle
      result promise to update via MenuDataService.updateItem()
- [x] T048 [US2] Add openDeleteDialog() method in JiraSidebarContainerComponent:
      inject NgbModal, open DeleteConfirmationComponent, pass menuItem, handle
      result to call MenuDataService.deleteItem() with cascade flag
- [x] T049 [US2] Add createMenuItem() method in JiraSidebarContainerComponent:
      inject NgbModal, open MenuItemEditorComponent with empty item, handle
      result to call MenuDataService.addItem()
- [x] T050 [US2] Implement circular reference detection in
      MenuValidationService: isDescendant() recursive traversal,
      wouldCreateCircularReference() check before drop
- [x] T051 [US2] Implement drag-drop in SidebarMenuComponent: add CdkDragDrop
      imports from @angular/cdk/drag-drop, cdkDropList directive, cdkDrag
      directive on tree nodes
- [x] T052 [US2] Implement drop handler in SidebarMenuComponent: onDrop() method
      with CdkDragDrop event, create DragDropContext object, validate with
      MenuValidationService, emit itemDropped event
- [x] T053 [US2] Implement drop validation and visual feedback in
      SidebarMenuComponent: cdkDropListEnterPredicate to check circular refs,
      custom placeholder with .cdk-drag-placeholder class, drop zone
      highlighting
- [x] T054 [US2] Wire edit mode UI in SidebarMenuComponent template:
      conditionally show Edit/Delete buttons when isEditMode input is true, emit
      editRequested and deleteRequested events with MenuItem
- [x] T055 [US2] Handle drag-drop event in JiraSidebarContainerComponent: listen
      to itemDropped output, call MenuDataService.moveItem() with
      DragDropContext, update tree structure, save to localStorage
- [x] T056 [US2] Add edit mode toggle button in JiraSidebarContainerComponent
      template: button to call toggleEditMode(), icon to show edit/view state,
      admin-only visibility (placeholder check)
- [x] T057 [US2] Implement SCSS for drag-drop in
      components/sidebar-menu/sidebar-menu.component.scss: .cdk-drag-preview
      styling (opacity, shadow), .cdk-drag-placeholder styling (dashed border),
      .cdk-drop-list-dragging cursor

**Checkpoint**: At this point, User Stories 1 AND 2 should both work
independently - basic navigation + full menu management

---

## Phase 5: User Story 3 - Hierarchical Menu Creation (Priority: P3)

**Goal**: Administrators can create multi-level menu hierarchies in a single
modal operation

**Independent Test**: Click "Add Submenu" in edit mode, fill in multiple levels
of menu items (parent > child > grandchild), save, verify entire hierarchy
created and attached correctly

### Implementation for User Story 3

- [x] T058 [P] [US3] Create AddSubmenuComponent in
      components/modals/add-submenu/add-submenu.component.ts (standalone,
      OnPush) with NgbActiveModal and ReactiveFormsModule
- [x] T059 [US3] Create AddSubmenuComponent template in
      components/modals/add-submenu/add-submenu.component.html: modal with
      FormArray for levels, each level has label + icon-picker, "Add another
      level" button, save/cancel
- [x] T060 [US3] Implement AddSubmenuComponent logic: accept parentItem input,
      create FormArray with FormGroup per level (label + icon controls),
      addLevel() method to push new FormGroup, removeLevel() method
- [x] T061 [US3] Implement onSave() in AddSubmenuComponent: validate FormArray,
      build nested MenuItem structure from form values, generate unique IDs,
      close modal with result
- [x] T062 [US3] Add openAddSubmenuDialog() method in
      JiraSidebarContainerComponent: inject NgbModal, open AddSubmenuComponent,
      pass parentItem, handle result to call MenuDataService.addSubmenu() with
      nested structure
- [x] T063 [US3] Implement addSubmenu() method in MenuDataService: accept
      parentItem and nested children, recursively add to tree structure, update
      itemsById map, save to localStorage
- [x] T064 [US3] Wire "Add Submenu" button in SidebarMenuComponent template:
      show button when isEditMode is true, emit addSubmenuRequested event with
      parent MenuItem
- [x] T065 [US3] Handle addSubmenuRequested event in
      JiraSidebarContainerComponent: listen to output, call
      openAddSubmenuDialog() with emitted MenuItem

**Checkpoint**: All three user stories (P1, P2, P3) should now be independently
functional

---

## Phase 6: User Story 4 - Responsive Sidebar Behavior (Priority: P2)

**Goal**: Refine sidebar responsiveness with smooth animations, timer precision,
and state transition polish

**Independent Test**: Verify auto-hide timing is within ±500ms tolerance, test
rapid mouse movements in/out of trigger area, verify animations complete within
300ms, test window resize behavior

**Note**: Most functionality already implemented in User Story 1. This phase
adds polish and validation.

### Implementation for User Story 4

- [ ] T066 [US4] Refine CSS animations in jira-sidebar-nav.component.scss:
      verify transition duration is 300ms, use cubic-bezier(0.4, 0, 0.2, 1) for
      smooth easing, add will-change: transform for GPU acceleration
- [ ] T067 [US4] Optimize auto-hide timer precision in
      JiraSidebarContainerComponent: verify timer(3000) RxJS operator accuracy,
      add window.setTimeout fallback if needed, test rapid enter/leave
      cancellation
- [ ] T068 [US4] Add responsive width handling in
      jira-sidebar-nav.component.scss: media query for narrow viewports
      (<768px), adjust sidebar width if needed, handle collapsed state on mobile
- [ ] T069 [US4] Add visual transition indicators in
      jira-sidebar-nav.component.html: optional loading spinner or transition
      state class during width changes (if transitions feel laggy)
- [ ] T070 [US4] Validate performance against SC-002 (3s ±0.5s auto-hide): add
      console.time/timeEnd or performance.now() measurements in development
      mode, verify timer accuracy

**Checkpoint**: Sidebar behavior should feel polished, smooth, and responsive
across all scenarios

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T071 [P] Add comprehensive JSDoc comments to all public methods in
      services (MenuDataService, MenuValidationService) and components
- [ ] T072 [P] Verify TypeScript strict mode compliance: check for any `any`
      types, ensure all interfaces are properly typed, validate null/undefined
      handling
- [ ] T073 [P] Performance optimization: verify OnPush change detection on all
      components, add trackBy functions to \*ngFor directives in tree rendering,
      check for unnecessary re-renders
- [ ] T074 [P] Accessibility validation: verify ARIA attributes from Material
      Tree (role="tree", aria-expanded, aria-level), test keyboard navigation
      (arrow keys, enter, escape), check focus management in modals
- [ ] T075 Code cleanup: remove console.log statements, remove unused imports,
      format with Prettier, run ESLint with zero warnings
- [ ] T076 Validate against Success Criteria: SC-001 (navigation <3s), SC-002
      (auto-hide 3s ±0.5s), SC-003 (timer cancellation 100%), SC-005 (<300ms
      transitions), SC-006 (localStorage persistence), SC-007 (50+ items, 5
      levels), SC-010 (edit ops <2s)
- [ ] T077 Run quickstart.md validation: follow quickstart guide step-by-step on
      clean branch, verify all commands work, confirm 4-hour MVP timeline is
      achievable
- [ ] T078 Update README or feature documentation: add usage examples,
      configuration options, troubleshooting section, link to spec.md and
      contracts
- [ ] T079 Security review placeholder: verify edit mode authorization
      integration points, sanitize user input in modals (label text), validate
      localStorage data before loading

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all
  user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - MVP
  deliverable
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - Can run in
  parallel with US1 but relies on US1 for container/menu components
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) and User Story 2
  (Phase 4) for modal patterns
- **User Story 4 (Phase 6)**: Depends on User Story 1 (Phase 3) completion -
  refinement of US1
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2) → BLOCKS ALL
    ↓
    ├─→ User Story 1 (P1) → MVP standalone ✅
    ├─→ User Story 2 (P2) → Builds on US1 container/menu
    ├─→ User Story 3 (P3) → Builds on US2 modals
    └─→ User Story 4 (P2) → Refines US1
```

**Recommended Order**: Phase 1 → Phase 2 → Phase 3 (MVP!) → Phase 4 → Phase 6 →
Phase 5 → Phase 7

### Within Each User Story

- **Models before services** (T006-T010 before T014)
- **Utils before services** (T011-T012 before T014)
- **Components in parallel** (T015-T018 all parallel)
- **Logic before templates** (component .ts before .html)
- **Templates before styles** (.html before .scss)
- **Core features before integrations** (state management before drag-drop)

### Parallel Opportunities

**Phase 1 (Setup)**: T002, T003, T004 can run in parallel

**Phase 2 (Foundational)**: T006-T010 (all model interfaces) can run in parallel

**Phase 3 (US1 Implementation)**:

- T015-T018 (component file creation) can run in parallel
- T027-T030 (template creation) can run after respective components, in parallel
  with each other
- T031-T032 (SCSS creation) can run after templates, in parallel

**Phase 4 (US2 Implementation)**:

- T036-T038 (new component creation) can run in parallel
- T041-T046 (template + logic for modals) can run in parallel after T036-T038

**Phase 5 (US3 Implementation)**:

- T058-T059 (component + template) can run in parallel

**Phase 7 (Polish)**:

- T071-T074 (docs, types, perf, a11y) can all run in parallel

---

## Parallel Example: User Story 1

```bash
# After Phase 2 complete, launch US1 component files in parallel:
Task T015: "Create JiraSidebarContainerComponent in jira-sidebar-nav.component.ts"
Task T016: "Create SidebarMenuComponent in components/sidebar-menu/sidebar-menu.component.ts"
Task T017: "Create MenuItemComponent in components/menu-item/menu-item.component.ts"
Task T018: "Create SidebarToggleComponent in components/sidebar-toggle/sidebar-toggle.component.ts"

# After component logic complete, launch templates in parallel:
Task T027: "Create JiraSidebarContainerComponent template"
Task T028: "Create SidebarMenuComponent template"
Task T029: "Create MenuItemComponent template"
Task T030: "Create SidebarToggleComponent template"
```

---

## Parallel Example: User Story 2

```bash
# Launch modal components in parallel:
Task T036: "Create IconPickerComponent"
Task T037: "Create MenuItemEditorComponent"
Task T038: "Create DeleteConfirmationComponent"
Task T039: "Implement MenuValidationService"

# Launch modal templates + logic in parallel:
Task T041: "Implement IconPickerComponent template"
Task T042: "Implement IconPickerComponent logic"
Task T043: "Create MenuItemEditorComponent template"
Task T044: "Implement MenuItemEditorComponent logic"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - Recommended for Demo

1. ✅ Complete Phase 1: Setup (T001-T005) - ~15 minutes
2. ✅ Complete Phase 2: Foundational (T006-T014) - ~30 minutes - **CRITICAL
   CHECKPOINT**
3. ✅ Complete Phase 3: User Story 1 (T015-T035) - ~2.5 hours
4. **STOP and VALIDATE**: Test US1 independently against acceptance scenarios
5. Deploy/demo MVP: Basic navigation with auto-hide and lock functionality ✅

**Total MVP Time**: ~4 hours (matches quickstart.md estimate)

### Incremental Delivery

1. **Sprint 1**: Setup + Foundational + US1 → **MVP DEMO** (Basic navigation)
2. **Sprint 2**: US2 → **DEMO** (Add menu management capabilities)
3. **Sprint 3**: US4 → **DEMO** (Polish responsive behavior)
4. **Sprint 4**: US3 + Polish → **FINAL RELEASE** (Bulk creation +
   production-ready)

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

- **Developer A**: User Story 1 (T015-T035) - Core navigation MVP
- **Developer B**: User Story 2 (T036-T057) - Menu management (depends on A's
  container component being created)
- **Developer C**: User Story 4 (T066-T070) - Responsive polish (depends on A's
  timer implementation)

Then converge on User Story 3 and Polish together.

---

## Task Summary

- **Total Tasks**: 84
- **Setup Phase**: 5 tasks (~15 min)
- **Foundational Phase**: 11 tasks (~35 min) - **BLOCKS ALL STORIES**
- **User Story 1 (P1 - MVP)**: 23 tasks (~2.75 hours)
- **User Story 2 (P2)**: 23 tasks (~3 hours)
- **User Story 3 (P3)**: 8 tasks (~1 hour)
- **User Story 4 (P2)**: 5 tasks (~45 min)
- **Polish Phase**: 9 tasks (~1.5 hours)

**Estimated Total Time**: ~10 hours for complete feature (all 4 user stories +
polish)

**MVP Time** (Setup + Foundational + US1): ~4.25 hours ✅

---

## Notes

- **[P] marker** indicates tasks that can run in parallel (different files, no
  dependencies)
- **[Story] label** maps each task to its user story for traceability and
  independent testing
- Each user story phase is independently completable and testable
- Stop at any checkpoint to validate story functionality before proceeding
- Commit after each task or logical grouping (e.g., after all models, after each
  component)
- **No tests included**: Specification does not request TDD approach or explicit
  test coverage
- Follow constitution principles: OnPush change detection, no new dependencies,
  max 300 lines per component, TypeScript strict mode
