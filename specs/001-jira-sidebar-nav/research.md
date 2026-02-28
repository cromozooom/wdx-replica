# Research: Adaptive Hierarchical Navigation Sidebar

**Feature**: 001-jira-sidebar-nav  
**Date**: February 27, 2026  
**Phase**: 0 - Research & Technology Selection

## Research Overview

This document consolidates research findings on implementing a Jira-style
hierarchical navigation sidebar with state management, drag-and-drop, and
auto-hide behavior using the existing technology stack.

## 1. Angular CDK Tree for Hierarchical Menus

### Decision: Use Material Tree with Bootstrap Styling

**Rationale**: The project already has @angular/material 19.2.10 installed
(constitutional principle: avoid new dependencies). Material Tree provides
robust accessibility and ARIA attributes while Bootstrap maintains visual
consistency with existing UI.

### Current State

- **No existing tree components** in codebase
- **Existing patterns**: ag-Grid with expandable groups, recursive data
  structures in utils
- **Related usage**: Angular CDK Drag-Drop already used in spx-tools component

### Implementation Pattern

**Core Setup:**

```typescript
import { NestedTreeControl } from "@angular/cdk/tree";
import { MatTreeNestedDataSource, MatTreeModule } from "@angular/material/tree";

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  routerLink?: string;
  children?: MenuItem[];
}

treeControl = new NestedTreeControl<MenuItem>((node) => node.children);
dataSource = new MatTreeNestedDataSource<MenuItem>();
```

**Expansion State Management:**

- Store expanded node IDs in `Set<string>` for O(1) lookup
- Persist to localStorage on expansion changes
- Restore state on component initialization
- Use `treeControl.isExpanded(node)` for UI state

**Indentation Strategy:**

- Use 24px per level (Material design standard)
- Apply via dynamic padding: `[style.padding-left.px]="node.level * 24"`
- Maximum depth: 5 levels (per spec SC-007)

### Best Practices

- Use Material Tree for structure and accessibility
- Style with Bootstrap utilities for consistency
- FontAwesome icons for visual hierarchy
- OnPush change detection for performance

---

## 2. Drag-and-Drop for Menu Reordering

### Decision: Extend Existing CDK Drag-Drop Pattern

**Rationale**: Project already uses `@angular/cdk/drag-drop` in spx-tools
component. Extend this pattern for hierarchical structures with parent-child
validation.

### Current Implementation (Flat Lists)

```typescript
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// Template
<div cdkDropList (cdkDropListDropped)="drop($event)">
  <div *ngFor="let item of items" cdkDrag>{{ item.label }}</div>
</div>

// Handler
drop(event: CdkDragDrop<MenuItem[]>): void {
  moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  this.cdr.markForCheck(); // OnPush strategy
}
```

### Extension for Hierarchical Structures

**New Requirements (FR-016 to FR-019):**

1. Reorder items within same level
2. Move items to different hierarchy levels (sibling vs child)
3. Visual feedback during drag (drop targets, placeholders)
4. Prevent circular references (FR-019)

**Implementation Strategy:**

- Use `cdkDropListConnectedTo` for cross-level dropping
- Custom drop predicate to validate parent-child relationships
- Recursive traversal to detect circular references
- Visual placeholders with `.cdk-drag-placeholder` styling

**Circular Reference Detection:**

```typescript
canDropAsChild(draggedNode: MenuItem, targetNode: MenuItem): boolean {
  return !this.isDescendant(targetNode, draggedNode);
}

private isDescendant(node: MenuItem, potentialAncestor: MenuItem): boolean {
  if (!node.children) return false;
  for (const child of node.children) {
    if (child.id === potentialAncestor.id) return true;
    if (this.isDescendant(child, potentialAncestor)) return true;
  }
  return false;
}
```

**Visual Feedback:**

- Drag preview opacity: 0.8
- Box shadow on preview for elevation
- Transition timing: 250ms cubic-bezier
- Drop zone highlight with border color changes

---

## 3. LocalStorage Persistence

### Decision: Direct localStorage with Angular Signals + Effect

**Rationale**: Existing pattern in widget-form-history component demonstrates
simple, effective approach using signals for reactive synchronization. Aligns
with Angular 19 signal-based architecture.

### Current Pattern (Recommended)

```typescript
import { signal, effect } from '@angular/core';

state = signal<{
  menuStructure: MenuItem[];
  expandedNodeIds: string[];
  sidebarLocked: boolean;
}>({
  menuStructure: [],
  expandedNodeIds: [],
  sidebarLocked: false,
});

constructor() {
  // Load from localStorage on init
  const savedMenu = localStorage.getItem('nav-menu-structure');
  if (savedMenu) {
    try {
      const parsed = JSON.parse(savedMenu);
      this.state.update(s => ({ ...s, menuStructure: parsed }));
    } catch (error) {
      console.error('Failed to parse menu structure:', error);
    }
  }

  // Auto-save on state changes
  effect(() => {
    const { menuStructure, expandedNodeIds, sidebarLocked } = this.state();
    localStorage.setItem('nav-menu-structure', JSON.stringify(menuStructure));
    localStorage.setItem('nav-expanded-nodes', JSON.stringify(expandedNodeIds));
    localStorage.setItem('nav-sidebar-locked', JSON.stringify(sidebarLocked));
  });
}
```

### Storage Keys

- `nav-menu-structure`: Full menu hierarchy (FR-027, FR-028)
- `nav-expanded-nodes`: Array of expanded node IDs (FR-003)
- `nav-sidebar-locked`: Boolean for lock state (FR-010, FR-011)

### Error Handling

- Try-catch for JSON parsing
- Fallback to default mock data if localStorage empty
- Validate structure after parsing (ensure required fields exist)

### Alternative Considered: IndexedDB with Service Layer

- **Rejected**: Overkill for simple hierarchical data
- **Usage context**: Only for complex/large data (seen in
  basket-storage.service)
- **Menu data**: Typically <1MB, well within localStorage limits (5-10MB)

---

## 4. Hover Behavior with Auto-Hide Timer

### Decision: RxJS fromEvent + timer for Declarative Approach

**Rationale**: While the codebase shows `debounceTime()` for search inputs and
native setTimeout for manual delays, a hover-based auto-hide requires more
sophisticated state management. Using RxJS provides cleaner cancellation and
composition.

### Current Patterns in Codebase

1. **debounceTime()** - Search inputs, form changes (300ms, 200ms delays)
2. **setTimeout/clearTimeout** - Manual debouncing in editor components
3. **D3 native events** - Immediate hover effects without timers

### Recommended Pattern (Not Currently Used)

```typescript
import { fromEvent, timer, merge, NEVER } from 'rxjs';
import { switchMap, takeUntil, mapTo } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

private setupAutoHide(): void {
  const sidebarElement = this.elementRef.nativeElement.querySelector('.sidebar');
  const triggerElement = this.elementRef.nativeElement.querySelector('.sidebar-trigger');

  const mouseEnter$ = merge(
    fromEvent(sidebarElement, 'mouseenter'),
    fromEvent(triggerElement, 'mouseenter')
  );

  const mouseLeave$ = merge(
    fromEvent(sidebarElement, 'mouseleave'),
    fromEvent(triggerElement, 'mouseleave')
  );

  mouseEnter$
    .pipe(
      switchMap(() => mouseLeave$.pipe(
        switchMap(() => timer(3000)), // 3 second delay (FR-008)
        takeUntil(mouseEnter$)         // Cancel if re-entering
      )),
      takeUntilDestroyed()
    )
    .subscribe(() => {
      if (!this.state().sidebarLocked) {
        this.collapseSidebar();
      }
    });
}
```

### Timer Configuration (from Spec)

- **Auto-hide delay**: 3000ms (FR-008, SC-002)
- **Tolerance**: ±500ms acceptable (SC-002)
- **Cancellation**: Moving mouse into sidebar before timer expires (FR-009)
- **Locked state**: Timers ignored completely (FR-011)

### Edge Case Handling

- Rapid mouse movements in/out: `switchMap` cancels previous timers
- Lock state check before collapsing
- Component cleanup with `takeUntilDestroyed()`

### Alternative: Native setTimeout (Simpler but Less Composable)

```typescript
private autoHideTimer: any;

@HostListener('mouseenter')
onMouseEnter(): void {
  if (this.autoHideTimer) {
    clearTimeout(this.autoHideTimer);
  }
  this.expandSidebar();
}

@HostListener('mouseleave')
onMouseLeave(): void {
  if (!this.state().sidebarLocked) {
    this.autoHideTimer = setTimeout(() => {
      this.collapseSidebar();
    }, 3000);
  }
}
```

**Recommendation**: Use RxJS approach for better testability and composition,
despite codebase not currently using this pattern.

---

## 5. NgbModal for Edit Dialogs

### Decision: Component-Based Modals (Existing Pattern)

**Rationale**: Codebase extensively uses component-based modals with
NgbActiveModal. This is the established pattern in configuration-manager and
other modules.

### Standard Modal Structure

**Opening Modal:**

```typescript
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

modalService = inject(NgbModal);

openEditDialog(menuItem: MenuItem): void {
  const modalRef = this.modalService.open(MenuItemEditorComponent, {
    size: 'md',
    backdrop: 'static',
    keyboard: false
  });

  modalRef.componentInstance.menuItem = menuItem;

  modalRef.result.then(
    (updatedItem: MenuItem) => {
      this.updateMenuItem(updatedItem);
    },
    () => {
      // Dismissed - no action
    }
  );
}
```

**Modal Component Template:**

```html
<div class="modal-header">
  <h3 class="modal-title h5">Edit Menu Item</h3>
  <button
    type="button"
    class="btn-close"
    (click)="activeModal.dismiss()"
  ></button>
</div>

<div class="modal-body p-4">
  <form [formGroup]="menuItemForm">
    <!-- Form fields -->
  </form>
</div>

<div class="modal-footer">
  <button class="btn btn-secondary" (click)="activeModal.dismiss()">
    Cancel
  </button>
  <button
    class="btn btn-primary"
    [disabled]="!menuItemForm.valid"
    (click)="onSave()"
  >
    Save
  </button>
</div>
```

**Modal Component Class:**

```typescript
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

activeModal = inject(NgbActiveModal);
menuItem!: MenuItem; // Passed from parent

onSave(): void {
  if (this.menuItemForm.valid) {
    this.activeModal.close(this.menuItemForm.value);
  }
}
```

### Modal Types Needed (FR-021, FR-023, FR-024)

1. **Edit Modal**: Label + Icon picker
2. **Delete Confirmation**: Choose cascade vs promote for parent items
3. **Add Submenu Modal**: Multi-level form with FormArray

### Confirmation Dialog Pattern

**Current**: Browser `confirm()` used **Recommendation**: Create reusable
confirmation modal component

```typescript
openDeleteConfirmation(menuItem: MenuItem): void {
  const modalRef = this.modalService.open(ConfirmationModalComponent, {
    size: 'sm',
    backdrop: 'static'
  });

  modalRef.componentInstance.title = 'Delete Menu Item';
  modalRef.componentInstance.message = menuItem.children?.length
    ? 'This item has children. How would you like to proceed?'
    : `Are you sure you want to delete "${menuItem.label}"?`;
  modalRef.componentInstance.options = menuItem.children?.length
    ? ['Delete All (Cascade)', 'Promote Children', 'Cancel']
    : ['Delete', 'Cancel'];

  modalRef.result.then((choice: string) => {
    if (choice === 'Delete All (Cascade)') {
      this.deleteMenuItem(menuItem, true);
    } else if (choice === 'Promote Children') {
      this.deleteMenuItem(menuItem, false);
    }
  });
}
```

---

## 6. Icon Picker Implementation

### Decision: Create Custom Icon Picker Component using ng-select

**Rationale**: No existing icon picker in codebase. Use established `ng-select`
library (already used extensively) with custom template for icon preview.

### Current State

- **FontAwesome 6.7.2 Free** loaded via CDN
- **Available styles**: fas (solid), far (regular), fab (brands)
- **Angular FontAwesome packages** installed but unused (can remove per
  constitution)
- **Usage pattern**: Direct CSS classes `<i class="fas fa-icon-name"></i>`

### Icon Set Definition

```typescript
export const FONT_AWESOME_ICONS = [
  // Navigation
  { id: "fas fa-home", label: "Home", category: "navigation" },
  { id: "fas fa-compass", label: "Compass", category: "navigation" },
  { id: "fas fa-bars", label: "Menu", category: "navigation" },
  // Actions
  { id: "fas fa-plus", label: "Plus", category: "actions" },
  { id: "fas fa-edit", label: "Edit", category: "actions" },
  { id: "fas fa-trash", label: "Trash", category: "actions" },
  // Status
  { id: "fas fa-check", label: "Check", category: "status" },
  { id: "fas fa-times", label: "Times", category: "status" },
  // ... (expand to ~100-200 common icons)
];
```

### ng-select Custom Template

```html
<ng-select
  [(ngModel)]="selectedIcon"
  [items]="icons"
  bindLabel="label"
  bindValue="id"
  placeholder="Select an icon"
  [searchable]="true"
>
  <!-- Custom option template with icon preview -->
  <ng-template ng-option-tmp let-item="item">
    <div class="d-flex align-items-center">
      <i [class]="item.id" class="me-2" style="width: 20px;"></i>
      <span>{{ item.label }}</span>
    </div>
  </ng-template>

  <!-- Custom label template -->
  <ng-template ng-label-tmp let-item="item">
    <div class="d-flex align-items-center">
      <i [class]="item.id" class="me-2"></i>
      <span>{{ item.label }}</span>
    </div>
  </ng-template>
</ng-select>
```

### Implementation Notes

- Built-in search filters icons by label
- Visual preview in dropdown and selected state
- Reusable component: `IconPickerComponent`
- Input: `@Input() selectedIcon: string`
- Output: `@Output() iconChange: EventEmitter<string>`

### Alternative: Grid-Based Picker

- **Considered**: Modal with icon grid (more visual)
- **Rejected**: More complex UX, ng-select simpler and consistent with existing
  patterns
- **Future enhancement**: Could add grid view as an option

---

## 7. Performance Considerations

### Bundle Size Impact (Constitution Principle IV)

**New Dependencies**: None (using existing)  
**Component Size Target**: <300 lines per component (constitution)  
**Lazy Loading**: Not required (navigation is core feature, always loaded)

### Change Detection Strategy

**Recommendation**: OnPush (per constitution)

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Justification**:

- Menu structure changes infrequently
- State managed via signals (auto-tracks changes)
- Drag-drop requires explicit `markForCheck()` (existing pattern)

### Animation Performance (SC-005)

**Target**: <300ms transitions

- CSS transitions over JavaScript animations
- `transform` and `opacity` only (GPU accelerated)
- No layout-thrashing properties (width changes via transform: scaleX)

```scss
.sidebar {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform; // GPU hint

  &.collapsed {
    transform: translateX(calc(-280px + 20px));
  }
}
```

### Memory Management

**Observables**: Use `takeUntilDestroyed()` (Angular 16+ pattern)  
**Event Listeners**: RxJS `fromEvent()` with proper takeUntil  
**LocalStorage**: Signals + effect (auto-cleanup on destroy)

---

## 8. Component Architecture

### Smart/Dumb Separation (Constitution Principle III)

**Smart Container:**

- `JiraSidebarContainerComponent`
- Manages state (signals)
- Handles localStorage sync
- Coordinates modals
- Processes drag-drop logic

**Dumb Presentational:**

- `SidebarMenuComponent` - Renders tree structure
- `MenuItemComponent` - Individual menu item display
- `SidebarToggleComponent` - Lock/unlock button
- `IconPickerComponent` - Icon selection UI
- `MenuItemEditorComponent` - Edit modal content

### File Structure

```
src/app/jira-sidebar-nav/
├── jira-sidebar-nav.component.ts          # Smart container
├── jira-sidebar-nav.component.html
├── jira-sidebar-nav.component.scss
├── jira-sidebar-nav.routes.ts
├── components/
│   ├── sidebar-menu/
│   │   ├── sidebar-menu.component.ts       # Dumb
│   │   ├── sidebar-menu.component.html
│   │   └── sidebar-menu.component.scss
│   ├── menu-item/
│   │   ├── menu-item.component.ts          # Dumb
│   │   └── menu-item.component.html
│   ├── sidebar-toggle/
│   │   └── sidebar-toggle.component.ts     # Dumb
│   ├── icon-picker/
│   │   └── icon-picker.component.ts        # Reusable
│   └── modals/
│       ├── menu-item-editor/
│       │   ├── menu-item-editor.component.ts
│       │   └── menu-item-editor.component.html
│       ├── delete-confirmation/
│       │   └── delete-confirmation.component.ts
│       └── add-submenu/
│           ├── add-submenu.component.ts
│           └── add-submenu.component.html
├── models/
│   ├── menu-item.interface.ts
│   ├── sidebar-state.interface.ts
│   └── menu-structure.interface.ts
├── services/
│   ├── menu-data.service.ts                # CRUD operations
│   └── menu-validation.service.ts          # Circular ref checks
└── utils/
    ├── menu-tree.utils.ts                  # Tree traversal helpers
    └── font-awesome-icons.const.ts         # Icon definitions
```

---

## 9. Testing Strategy

### Unit Tests (Karma + Jasmine)

**Core Logic:**

- Menu tree traversal (circular reference detection)
- LocalStorage sync (mock localStorage)
- Drag-drop validation (can drop where?)
- State management (signals)

**Component Tests:**

- Menu item rendering
- Expansion/collapse behavior
- Modal open/close
- Icon picker selection

**Mock Data:**

```typescript
export const MOCK_MENU: MenuItem[] = [
  {
    id: "1",
    label: "Dashboard",
    icon: "fas fa-dashboard",
    children: [
      {
        id: "1-1",
        label: "Analytics",
        icon: "fas fa-chart-line",
        children: [],
      },
      { id: "1-2", label: "Reports", icon: "fas fa-file", children: [] },
    ],
  },
  // ... 3-level deep example
];
```

### Integration Tests

- Full drag-drop flow
- Edit → Save → Persist → Reload
- Auto-hide timer behavior
- Lock/unlock state persistence

---

## 10. Accessibility (Not Explicitly in Spec but Required by Code Quality Gates)

### ARIA Attributes (Material Tree Provides)

- `role="tree"` on container
- `role="treeitem"` on nodes
- `aria-expanded` for parent nodes
- `aria-level` for nesting depth
- `aria-selected` for active item

### Keyboard Navigation

- Arrow keys for navigation
- Enter/Space for expand/collapse
- Tab for focus management
- Escape to close modals

### Screen Reader Support

- Meaningful labels for icon-only buttons
- Announce drag-drop state changes
- Modal title announcements

---

## Decision Summary

| Aspect           | Decision                                  | Rationale                                 |
| ---------------- | ----------------------------------------- | ----------------------------------------- |
| Tree Component   | Angular Material Tree + Bootstrap styling | Already installed, provides accessibility |
| Drag-Drop        | Extend existing CDK Drag-Drop pattern     | Consistent with spx-tools implementation  |
| State Management | Angular Signals + effect()                | Modern Angular 19 pattern, reactive       |
| Persistence      | Direct localStorage with signals          | Matches existing widget pattern           |
| Hover Behavior   | RxJS fromEvent + timer                    | Better composition than setTimeout        |
| Modals           | NgbModal component-based                  | Established pattern in codebase           |
| Icon Picker      | Custom ng-select with template            | Reuses existing library, simple UX        |
| Change Detection | OnPush                                    | Performance best practice                 |
| Architecture     | Smart/Dumb components                     | Constitution requirement                  |

## Open Questions / Future Enhancements

1. **Accessibility testing**: Need to validate screen reader support
2. **Icon set size**: Currently ~50-100 icons, could expand to full FA catalog
3. **Animation preferences**: Could add `prefers-reduced-motion` support
4. **Multi-level drag-drop**: Complex interaction, may need iteration
5. **Undo/redo**: Not in spec but could enhance edit mode UX
