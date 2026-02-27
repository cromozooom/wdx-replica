# Quickstart Guide: Adaptive Hierarchical Navigation Sidebar

**Feature**: 001-jira-sidebar-nav  
**Date**: February 27, 2026  
**Audience**: Developers implementing this feature

## Purpose

This guide provides step-by-step instructions for implementing the Jira-style
hierarchical navigation sidebar. Follow these steps in order to build a working
MVP that meets all P1 requirements.

---

## Prerequisites

✅ Angular 19.2+ installed  
✅ Node.js and npm configured  
✅ Existing dependencies (Material, ng-bootstrap, ng-select) available  
✅ Read [spec.md](../spec.md) for functional requirements  
✅ Read [data-model.md](data-model.md) for data structures  
✅ Read [contracts/component-interfaces.md](contracts/component-interfaces.md)
for APIs

---

## Phase 1: Project Setup (15 minutes)

### 1.1 Create Feature Module Structure

```bash
# From repository root
mkdir -p src/app/jira-sidebar-nav
mkdir -p src/app/jira-sidebar-nav/components/{sidebar-menu,menu-item,sidebar-toggle,icon-picker,modals}
mkdir -p src/app/jira-sidebar-nav/models
mkdir -p src/app/jira-sidebar-nav/services
mkdir -p src/app/jira-sidebar-nav/utils
```

### 1.2 Create Model Files

Create interfaces from [data-model.md](data-model.md):

```bash
# models/
touch src/app/jira-sidebar-nav/models/menu-item.interface.ts
touch src/app/jira-sidebar-nav/models/sidebar-state.interface.ts
touch src/app/jira-sidebar-nav/models/menu-structure.interface.ts
touch src/app/jira-sidebar-nav/models/drag-drop.interface.ts
touch src/app/jira-sidebar-nav/models/icon-definition.interface.ts
touch src/app/jira-sidebar-nav/models/index.ts  # barrel export
```

**Tip**: Copy interface definitions directly from data-model.md into these
files.

### 1.3 Create Constants File

```bash
touch src/app/jira-sidebar-nav/utils/font-awesome-icons.const.ts
```

Define ~50-100 commonly used icons (see research.md section 6).

### 1.4 Update Routes

Add lazy-loaded route in `app.routes.ts`:

```typescript
{
  path: 'jira-sidebar-nav',
  loadComponent: () =>
    import('./jira-sidebar-nav/jira-sidebar-nav.component').then(
      m => m.JiraSidebarContainerComponent
    ),
}
```

---

## Phase 2: Data Layer (30 minutes)

### 2.1 Create LocalStorage Utility

File: `utils/menu-local-storage.ts`

Implement `MenuLocalStorage` class from data-model.md with methods:

- `saveMenuStructure()`
- `loadMenuStructure()`
- `saveExpandedNodes()`
- `loadExpandedNodes()`
- `saveSidebarLocked()`
- `loadSidebarLocked()`

### 2.2 Create Mock Data Service

File: `services/menu-mock-data.service.ts`

```typescript
@Injectable({ providedIn: "root" })
export class MenuMockDataService {
  getDefaultMenu(): MenuItem[] {
    return [
      {
        id: "1",
        label: "Dashboard",
        icon: "fas fa-tachometer-alt",
        routerLink: "/dashboard",
        expanded: false,
        order: 0,
        children: [
          {
            id: "1-1",
            label: "Analytics",
            icon: "fas fa-chart-line",
            routerLink: "/dashboard/analytics",
            order: 0,
          },
          {
            id: "1-2",
            label: "Reports",
            icon: "fas fa-file-alt",
            routerLink: "/dashboard/reports",
            order: 1,
          },
        ],
      },
      // Add 8-10 more root items with 2-3 levels of nesting
    ];
  }
}
```

**Acceptance Criteria**: Mock data has at least 3 levels of nesting, 15+ total
items.

### 2.3 Create Menu Data Service

File: `services/menu-data.service.ts`

Implement core CRUD operations:

- `loadMenuStructure()` - loads from localStorage or fallback to mock
- `saveMenuStructure()` - saves to localStorage
- `addMenuItem(item, parentId)`
- `updateMenuItem(itemId, updates)`
- `deleteMenuItem(itemId, cascadeDelete)`
- `getItemById(itemId)`

**Tip**: Use signals for reactive state:

```typescript
private menuState = signal<MenuStructure>(this.loadInitialState());
public readonly menuStructure = this.menuState.asReadonly();

constructor() {
  // Auto-save on changes
  effect(() => {
    const structure = this.menuState();
    MenuLocalStorage.saveMenuStructure(structure.rootItems);
  });
}
```

### 2.4 Create Validation Service

File: `services/menu-validation.service.ts`

Implement (initially stub methods, expand during drag-drop phase):

- `wouldCreateCircularReference(draggedItem, targetParent)`
- `wouldExceedMaxDepth(draggedItem, targetParent)`
- `validateDrop(context)`
- `validateMenuItem(item)`

---

## Phase 3: Container Component (45 minutes)

### 3.1 Generate Container Component

```bash
ng generate component jira-sidebar-nav/jira-sidebar-nav --standalone --skip-tests=false
```

Rename to `JiraSidebarContainerComponent`.

### 3.2 Setup State Management

```typescript
import { signal, computed, effect } from "@angular/core";

export class JiraSidebarContainerComponent implements OnInit {
  private menuDataService = inject(MenuDataService);

  // State
  private state = signal<{
    menuStructure: MenuStructure;
    sidebarState: SidebarState;
  }>({
    menuStructure: this.menuDataService.loadMenuStructure(),
    sidebarState: {
      visibilityMode: SidebarVisibilityMode.HIDDEN,
      isLocked: MenuLocalStorage.loadSidebarLocked(),
      isEditMode: false,
      currentWidth: 20,
      expandedNodeIds: new Set(MenuLocalStorage.loadExpandedNodes()),
      activeItemId: null,
      autoHideTimerActive: false,
    },
  });

  // Computed signals
  protected readonly menuItems = computed(
    () => this.state().menuStructure.rootItems,
  );
  protected readonly isLocked = computed(
    () => this.state().sidebarState.isLocked,
  );
  protected readonly currentWidth = computed(
    () => this.state().sidebarState.currentWidth,
  );

  constructor() {
    // Auto-save lock state
    effect(() => {
      const isLocked = this.state().sidebarState.isLocked;
      MenuLocalStorage.saveSidebarLocked(isLocked);
    });

    // Auto-save expanded nodes
    effect(() => {
      const expandedIds = Array.from(this.state().sidebarState.expandedNodeIds);
      MenuLocalStorage.saveExpandedNodes(expandedIds);
    });
  }
}
```

### 3.3 Basic Template

```html
<div class="sidebar-container d-flex flex-column vh-100">
  <!-- Header -->
  <div
    class="sidebar-header d-flex align-items-center justify-content-between p-3"
  >
    <h5 class="mb-0">Navigation</h5>
    <app-sidebar-toggle
      [isLocked]="isLocked()"
      (lockToggled)="toggleLock()"
    ></app-sidebar-toggle>
  </div>

  <!-- Sidebar -->
  <aside
    class="sidebar position-relative h-100"
    [style.width.px]="currentWidth()"
    (mouseenter)="onMouseEnter()"
    (mouseleave)="onMouseLeave()"
  >
    <app-sidebar-menu
      [menuItems]="menuItems()"
      [expandedNodeIds]="state().sidebarState.expandedNodeIds"
      [activeItemId]="state().sidebarState.activeItemId"
      [isEditMode]="state().sidebarState.isEditMode"
      (itemClicked)="onItemClick($event)"
      (nodeToggled)="onNodeToggle($event)"
    ></app-sidebar-menu>
  </aside>

  <!-- Main Content Slot -->
  <main class="flex-grow-1 overflow-auto">
    <router-outlet></router-outlet>
  </main>
</div>
```

### 3.4 Basic Styling (SCSS)

```scss
.sidebar-container {
  display: flex;
  flex-direction: row;
}

.sidebar {
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
  overflow: hidden;

  &.collapsed {
    width: 20px !important;
  }

  &.visible {
    width: 280px !important;
  }
}
```

**Checkpoint**: Container renders with basic layout, lock button visible.

---

## Phase 4: Sidebar Toggle Component (20 minutes)

### 4.1 Generate Component

```bash
ng generate component jira-sidebar-nav/components/sidebar-toggle --standalone --inline-template --inline-style
```

### 4.2 Implement

See
[contracts/component-interfaces.md](contracts/component-interfaces.md#4-sidebartogglecomponent-dumb)
for full contract.

```typescript
@Component({
  selector: "app-sidebar-toggle",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <button
      mat-icon-button
      [attr.aria-label]="getTooltipText()"
      [title]="getTooltipText()"
      (click)="onToggle()"
    >
      <mat-icon>{{ getIcon() }}</mat-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarToggleComponent {
  @Input({ required: true }) isLocked!: boolean;
  @Output() lockToggled = new EventEmitter<boolean>();

  onToggle(): void {
    this.lockToggled.emit(!this.isLocked);
  }

  getIcon(): string {
    return this.isLocked ? "lock" : "lock_open";
  }

  getTooltipText(): string {
    return this.isLocked ? "Unlock sidebar" : "Lock sidebar";
  }
}
```

**Test**: Click button → event emitted → container toggles lock state.

---

## Phase 5: Tree Menu Component (60 minutes)

### 5.1 Generate Component

```bash
ng generate component jira-sidebar-nav/components/sidebar-menu --standalone --skip-tests=false
```

### 5.2 Setup Material Tree

```typescript
import { NestedTreeControl } from "@angular/cdk/tree";
import { MatTreeNestedDataSource, MatTreeModule } from "@angular/material/tree";

export class SidebarMenuComponent implements OnInit, OnChanges {
  @Input({ required: true }) menuItems!: MenuItem[];
  @Input({ required: true }) expandedNodeIds!: Set<string>;
  @Input() activeItemId: string | null = null;
  @Input() isEditMode: boolean = false;

  @Output() itemClicked = new EventEmitter<MenuItem>();
  @Output() nodeToggled = new EventEmitter<{
    itemId: string;
    expanded: boolean;
  }>();

  treeControl = new NestedTreeControl<MenuItem>((node) => node.children);
  dataSource = new MatTreeNestedDataSource<MenuItem>();

  ngOnInit(): void {
    this.dataSource.data = this.menuItems;
    this.restoreExpansionState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["menuItems"]) {
      this.dataSource.data = this.menuItems;
    }
    if (changes["expandedNodeIds"]) {
      this.restoreExpansionState();
    }
  }

  private restoreExpansionState(): void {
    this.expandedNodeIds.forEach((id) => {
      const node = this.findNodeById(this.dataSource.data, id);
      if (node) {
        this.treeControl.expand(node);
      }
    });
  }

  private findNodeById(nodes: MenuItem[], id: string): MenuItem | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  hasChild = (_: number, node: MenuItem) =>
    !!node.children && node.children.length > 0;

  onNodeClick(node: MenuItem): void {
    this.itemClicked.emit(node);
  }

  onToggleNode(node: MenuItem): void {
    this.treeControl.toggle(node);
    this.nodeToggled.emit({
      itemId: node.id,
      expanded: this.treeControl.isExpanded(node),
    });
  }
}
```

### 5.3 Tree Template

```html
<mat-tree
  [dataSource]="dataSource"
  [treeControl]="treeControl"
  class="nav-tree"
>
  <!-- Branch node -->
  <mat-tree-node
    *matTreeNodeDef="let node; when: hasChild"
    matTreeNodePadding
    [style.padding-left.px]="(treeControl.getLevel(node) || 0) * 24"
    [class.active]="node.id === activeItemId"
  >
    <button
      mat-icon-button
      matTreeNodeToggle
      (click)="onToggleNode(node)"
      class="expand-button"
    >
      <mat-icon>
        {{ treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
      </mat-icon>
    </button>

    <div class="node-content" (click)="onNodeClick(node)">
      <i *ngIf="node.icon" [class]="node.icon" class="me-2"></i>
      <span>{{ node.label }}</span>
    </div>
  </mat-tree-node>

  <!-- Leaf node -->
  <mat-tree-node
    *matTreeNodeDef="let node"
    matTreeNodePadding
    [style.padding-left.px]="((treeControl.getLevel(node) || 0) * 24) + 40"
    [class.active]="node.id === activeItemId"
  >
    <div class="node-content" (click)="onNodeClick(node)">
      <i *ngIf="node.icon" [class]="node.icon" class="me-2"></i>
      <span>{{ node.label }}</span>
    </div>
  </mat-tree-node>
</mat-tree>
```

### 5.4 Styling

```scss
.nav-tree {
  .mat-tree-node {
    min-height: 40px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    &.active {
      background-color: rgba(25, 118, 210, 0.12);
      font-weight: 500;
      border-left: 3px solid #1976d2;
    }
  }

  .node-content {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 8px;
  }

  .expand-button {
    width: 40px;
    height: 40px;
  }
}
```

**Test**: Menu renders with 3 levels, expand/collapse works, clicking navigates.

---

## Phase 6: Auto-Hide Behavior (30 minutes)

### 6.1 Add RxJS Hover Logic to Container

```typescript
import { fromEvent, timer, merge } from "rxjs";
import { switchMap, takeUntil } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export class JiraSidebarContainerComponent {
  private sidebarElement!: HTMLElement;
  private destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.sidebarElement = document.querySelector(".sidebar") as HTMLElement;
    this.setupAutoHide();
  }

  private setupAutoHide(): void {
    const mouseEnter$ = fromEvent(this.sidebarElement, "mouseenter");
    const mouseLeave$ = fromEvent(this.sidebarElement, "mouseleave");

    mouseEnter$
      .pipe(
        tap(() => this.expandSidebar()),
        switchMap(() =>
          mouseLeave$.pipe(
            switchMap(() => timer(3000)),
            takeUntil(mouseEnter$),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!this.isLocked()) {
          this.collapseSidebar();
        }
      });
  }

  expandSidebar(): void {
    this.state.update((s) => ({
      ...s,
      sidebarState: {
        ...s.sidebarState,
        visibilityMode: SidebarVisibilityMode.TEMPORARY_VISIBLE,
        currentWidth: 280,
      },
    }));
  }

  collapseSidebar(): void {
    this.state.update((s) => ({
      ...s,
      sidebarState: {
        ...s.sidebarState,
        visibilityMode: SidebarVisibilityMode.HIDDEN,
        currentWidth: 20,
      },
    }));
  }

  toggleLock(): void {
    const newLockState = !this.isLocked();
    this.state.update((s) => ({
      ...s,
      sidebarState: {
        ...s.sidebarState,
        isLocked: newLockState,
        visibilityMode: newLockState
          ? SidebarVisibilityMode.LOCKED_VISIBLE
          : SidebarVisibilityMode.TEMPORARY_VISIBLE,
        currentWidth: newLockState ? 280 : s.sidebarState.currentWidth,
      },
    }));
  }
}
```

**Test**:

- Hover → sidebar expands to 280px
- Wait 3s → collapses to 20px
- Re-enter within 3s → timer cancelled, stays open
- Lock → stays open, ignores timer

**Acceptance**: SC-002 ✓ (3s ±0.5s), SC-003 ✓ (cancel works 100%)

---

## Phase 7: Icon Picker Component (45 minutes)

### 7.1 Generate Component

```bash
ng generate component jira-sidebar-nav/components/icon-picker --standalone
```

### 7.2 Implement ng-select with Custom Template

```typescript
import { NgSelectModule } from "@ng-select/ng-select";
import { FONT_AWESOME_ICONS } from "../../utils/font-awesome-icons.const";

@Component({
  selector: "app-icon-picker",
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule],
  templateUrl: "./icon-picker.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPickerComponent {
  @Input() selectedIcon: string | null = null;
  @Input() placeholder = "Select an icon";
  @Input() disabled = false;
  @Output() iconChange = new EventEmitter<string | null>();

  protected readonly icons = FONT_AWESOME_ICONS;

  onIconChange(icon: IconDefinition | null): void {
    this.iconChange.emit(icon?.id ?? null);
  }
}
```

### 7.3 Template with Icon Preview

```html
<ng-select
  [(ngModel)]="selectedIcon"
  [items]="icons"
  bindLabel="label"
  bindValue="id"
  [placeholder]="placeholder"
  [disabled]="disabled"
  [searchable]="true"
  (change)="onIconChange($event)"
>
  <ng-template ng-option-tmp let-item="item">
    <div class="d-flex align-items-center">
      <i
        [class]="item.id"
        class="me-2"
        style="width: 20px; text-align: center;"
      ></i>
      <span>{{ item.label }}</span>
    </div>
  </ng-template>

  <ng-template ng-label-tmp let-item="item">
    <div class="d-flex align-items-center">
      <i [class]="item.id" class="me-2"></i>
      <span>{{ item.label }}</span>
    </div>
  </ng-template>
</ng-select>
```

**Test**: Dropdown shows ~50+ icons with visual previews, search filters
correctly.

---

## Phase 8: MVP Complete - P1 Requirements Met

At this point, you have:

✅ **FR-001 - FR-005**: Hierarchical menu with 3+ levels, expand/collapse,
navigation  
✅ **FR-006 - FR-012**: Three visibility states, auto-hide (3s), lock/unlock  
✅ **SC-001**: Navigate in <3s  
✅ **SC-002**: Auto-hide within 3s ±0.5s  
✅ **SC-003**: Cancel auto-hide 100% reliable  
✅ **SC-005**: Transitions <300ms  
✅ **SC-006**: LocalStorage persistence  
✅ **SC-007**: Handles 3-5 levels, 50+ items  
✅ **SC-008**: Active item visually distinct

---

## Phase 9: Edit Mode (P2) - Optional Next Step

### Steps to Add:

1. Create MenuItemEditorComponent modal
2. Create DeleteConfirmationComponent modal
3. Add edit mode toggle button to header
4. Add action buttons (Edit/Delete/Add Submenu) to MenuItemComponent
5. Implement CRUD operations in MenuDataService
6. Wire up modal opening from action button clicks

See
[contracts/component-interfaces.md](contracts/component-interfaces.md#6-menuitededitorcomponent-modal)
for modal contracts.

---

## Phase 10: Drag-Drop (P2) - After Edit Mode

### Steps to Add:

1. Add `DragDropModule` to SidebarMenuComponent imports
2. Add `cdkDropList` and `cdkDrag` directives to template
3. Implement `(cdkDropListDropped)` handler
4. Add circular reference validation
5. Add visual feedback styling

See [research.md](research.md#2-drag-and-drop-for-menu-reordering) for
implementation patterns.

---

## Testing Checklist

### Unit Tests

- [ ] MenuDataService CRUD operations
- [ ] MenuValidationService circular reference detection
- [ ] MenuLocalStorage save/load
- [ ] TreeControl expansion/collapse
- [ ] Signal-based state updates

### Integration Tests

- [ ] P1 User Story 1 acceptance scenarios (6 total)
- [ ] Auto-hide timer behavior
- [ ] Lock/unlock persistence
- [ ] Router navigation on item click
- [ ] LocalStorage persistence across page reload

### Manual Testing

- [ ] Hover reveal works smoothly
- [ ] 3-second delay accurate
- [ ] Lock button toggles correctly
- [ ] Menu items clickable
- [ ] Expand/collapse animates properly
- [ ] Active item highlighted correctly

---

## Troubleshooting

### Sidebar doesn't expand on hover

- Check that `.sidebar` element has correct class
- Verify `fromEvent` selectors match actual DOM elements
- Check console for RxJS errors

### Menu items don't render

- Verify mock data has correct structure (see data-model.md)
- Check `menuItems` input binding in template
- Look for errors in Material Tree setup

### LocalStorage not persisting

- Check browser dev tools → Application → LocalStorage
- Verify `effect()` is running (add console.log)
- Ensure JSON.stringify doesn't error on circular refs

### Transitions feel laggy

- Check CSS transition timing (should be 300ms)
- Verify `will-change: width` is set
- Use Chrome DevTools Performance tab to profile

---

## Next Steps After MVP

1. **Add Edit Mode** (P2 requirements)
2. **Implement Drag-Drop** (FR-016 - FR-019)
3. **Create Add Submenu Modal** (P3 requirement)
4. **Write comprehensive tests** (unit + integration)
5. **Accessibility audit** (keyboard nav, ARIA, screen reader)
6. **Performance optimization** (if >50 items)
7. **CSS polish** (animations, responsive behavior)

---

## Resources

- **Spec**: [spec.md](../spec.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **Contracts**:
  [contracts/component-interfaces.md](contracts/component-interfaces.md)
- **Angular Material Tree**: https://material.angular.io/components/tree
- **ng-select**: https://github.com/ng-select/ng-select
- **FontAwesome Icons**: https://fontawesome.com/icons

---

## Estimated Timeline

| Phase            | Duration     | Cumulative       |
| ---------------- | ------------ | ---------------- |
| Setup            | 15 min       | 15 min           |
| Data Layer       | 30 min       | 45 min           |
| Container        | 45 min       | 1h 30m           |
| Toggle Component | 20 min       | 1h 50m           |
| Tree Menu        | 60 min       | 2h 50m           |
| Auto-Hide        | 30 min       | 3h 20m           |
| Icon Picker      | 45 min       | 4h 5m            |
| **MVP Complete** | **~4 hours** | **P1 Done**      |
| Edit Mode        | 2-3 hours    | P2 progress      |
| Drag-Drop        | 2-3 hours    | P2 complete      |
| Testing          | 2-3 hours    | Production-ready |

**Total for full feature**: ~12-15 hours for experienced Angular developer
