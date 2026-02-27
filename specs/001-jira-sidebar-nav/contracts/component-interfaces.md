# Component Interfaces: Adaptive Hierarchical Navigation Sidebar

**Feature**: 001-jira-sidebar-nav  
**Date**: February 27, 2026  
**Type**: Internal API Contracts

## Overview

This document defines the public APIs and input/output contracts for all
components in the Jira-style navigation sidebar feature. These interfaces ensure
clean component boundaries and facilitate testing.

---

## 1. JiraSidebarContainerComponent (Smart)

**Responsibility**: Main container component managing state, localStorage sync,
and coordination.

### Component Signature

```typescript
@Component({
  selector: 'app-jira-sidebar-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JiraSidebarContainerComponent implements OnInit, OnDestroy
```

### State (Signals)

```typescript
// Internal state (not exposed)
private state = signal<{
  menuStructure: MenuStructure;
  sidebarState: SidebarState;
}>({
  menuStructure: /* default */,
  sidebarState: /* default */
});

// Computed signals (exposed to template)
protected readonly menuItems = computed(() => this.state().menuStructure.rootItems);
protected readonly isLocked = computed(() => this.state().sidebarState.isLocked);
protected readonly isEditMode = computed(() => this.state().sidebarState.isEditMode);
protected readonly currentWidth = computed(() => this.state().sidebarState.currentWidth);
protected readonly activeItemId = computed(() => this.state().sidebarState.activeItemId);
```

### Public Methods

```typescript
/**
 * Toggle sidebar lock state.
 * Switches between locked visible and temporary visible modes.
 */
public toggleLock(): void;

/**
 * Toggle edit mode (admin only).
 * Shows/hides drag handles and action buttons.
 * @throws Error if user lacks permissions
 */
public toggleEditMode(): void;

/**
 * Expand the sidebar (hover trigger).
 * Transitions from hidden to temporary visible.
 */
public expandSidebar(): void;

/**
 * Collapse the sidebar (timer trigger).
 * Only if not locked.
 */
public collapseSidebar(): void;

/**
 * Reset menu structure to default mock data.
 * Clears localStorage and reloads defaults.
 */
public resetToDefaults(): void;
```

### Events (Outputs)

```typescript
// None - container manages all state internally
```

---

## 2. SidebarMenuComponent (Dumb)

**Responsibility**: Renders the tree structure of menu items using Angular
Material Tree.

### Component Signature

```typescript
@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarMenuComponent implements OnInit
```

### Inputs

```typescript
/**
 * Menu items to display (root level).
 * Changes trigger tree data source update.
 */
@Input({ required: true })
menuItems!: MenuItem[];

/**
 * Set of expanded node IDs for restoring state.
 */
@Input({ required: true })
expandedNodeIds!: Set<string>;

/**
 * ID of currently active menu item (highlighted).
 */
@Input()
activeItemId: string | null = null;

/**
 * Whether edit mode is active (shows action buttons).
 */
@Input()
isEditMode: boolean = false;

/**
 * Whether drag-drop is enabled (edit mode only).
 */
@Input()
isDragDropEnabled: boolean = false;
```

### Outputs

```typescript
/**
 * Emitted when user clicks a menu item.
 * @param MenuItem - The clicked item
 */
@Output()
itemClicked = new EventEmitter<MenuItem>();

/**
 * Emitted when user expands/collapses a node.
 * @param { itemId: string, expanded: boolean }
 */
@Output()
nodeToggled = new EventEmitter<{ itemId: string; expanded: boolean }>();

/**
 * Emitted when user clicks edit button (edit mode).
 * @param MenuItem - The item to edit
 */
@Output()
editRequested = new EventEmitter<MenuItem>();

/**
 * Emitted when user clicks delete button (edit mode).
 * @param MenuItem - The item to delete
 */
@Output()
deleteRequested = new EventEmitter<MenuItem>();

/**
 * Emitted when user clicks add submenu button (edit mode).
 * @param MenuItem - The parent item
 */
@Output()
addSubmenuRequested = new EventEmitter<MenuItem>();

/**
 * Emitted when user completes drag-drop operation.
 * @param DragDropContext - Complete drop context
 */
@Output()
itemDropped = new EventEmitter<DragDropContext>();
```

### Public Methods

```typescript
/**
 * Programmatically expand a node by ID.
 */
public expandNode(itemId: string): void;

/**
 * Programmatically collapse a node by ID.
 */
public collapseNode(itemId: string): void;

/**
 * Collapse all expanded nodes.
 */
public collapseAll(): void;

/**
 * Expand all nodes up to a given depth.
 */
public expandToDepth(depth: number): void;
```

---

## 3. MenuItemComponent (Dumb)

**Responsibility**: Renders individual menu item with icon, label, and
conditional action buttons.

### Component Signature

```typescript
@Component({
  selector: 'app-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItemComponent
```

### Inputs

```typescript
/**
 * The menu item data to display.
 */
@Input({ required: true })
item!: MenuItem;

/**
 * Nesting level for indentation calculation (0-based).
 */
@Input({ required: true })
level!: number;

/**
 * Whether this item is currently active/selected.
 */
@Input()
isActive: boolean = false;

/**
 * Whether edit mode buttons should be shown.
 */
@Input()
isEditMode: boolean = false;

/**
 * Whether this item has children (affects expand icon).
 */
@Input()
hasChildren: boolean = false;

/**
 * Whether this item is currently expanded (if has children).
 */
@Input()
isExpanded: boolean = false;
```

### Outputs

```typescript
/**
 * Emitted when the item is clicked (navigation).
 */
@Output()
itemClick = new EventEmitter<MenuItem>();

/**
 * Emitted when expand/collapse icon is clicked.
 */
@Output()
toggleExpand = new EventEmitter<MenuItem>();

/**
 * Emitted when edit button is clicked (edit mode).
 */
@Output()
editClick = new EventEmitter<MenuItem>();

/**
 * Emitted when delete button is clicked (edit mode).
 */
@Output()
deleteClick = new EventEmitter<MenuItem>();

/**
 * Emitted when add submenu button is clicked (edit mode).
 */
@Output()
addSubmenuClick = new EventEmitter<MenuItem>();
```

### Computed Properties

```typescript
/**
 * Calculate left padding based on nesting level.
 * Formula: level * 24px + base padding
 */
get paddingLeft(): string;

/**
 * Get appropriate expand icon based on state.
 * Returns 'expand_more' or 'chevron_right'
 */
get expandIcon(): string;
```

---

## 4. SidebarToggleComponent (Dumb)

**Responsibility**: Lock/unlock toggle button in sidebar header.

### Component Signature

```typescript
@Component({
  selector: 'app-sidebar-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarToggleComponent
```

### Inputs

```typescript
/**
 * Whether sidebar is currently locked.
 */
@Input({ required: true })
isLocked!: boolean;

/**
 * Optional custom tooltip text.
 */
@Input()
tooltip?: string;
```

### Outputs

```typescript
/**
 * Emitted when toggle button is clicked.
 * @param boolean - New lock state (true = lock, false = unlock)
 */
@Output()
lockToggled = new EventEmitter<boolean>();
```

### Public Methods

```typescript
/**
 * Get localized tooltip text based on current state.
 */
public getTooltipText(): string;

/**
 * Get appropriate icon based on lock state.
 */
public getIcon(): string; // 'lock' or 'lock_open'
```

---

## 5. IconPickerComponent (Reusable)

**Responsibility**: Icon selection dropdown with visual preview.

### Component Signature

```typescript
@Component({
  selector: 'app-icon-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconPickerComponent implements OnInit
```

### Inputs

```typescript
/**
 * Currently selected icon CSS class.
 * Example: "fas fa-home"
 */
@Input()
selectedIcon: string | null = null;

/**
 * Placeholder text when no icon selected.
 */
@Input()
placeholder: string = 'Select an icon';

/**
 * Whether picker is disabled.
 */
@Input()
disabled: boolean = false;

/**
 * Filter icons by category (optional).
 */
@Input()
filterCategory?: IconCategory;

/**
 * Custom icon list (overrides default).
 */
@Input()
customIcons?: IconDefinition[];
```

### Outputs

```typescript
/**
 * Emitted when icon selection changes.
 * @param string | null - Selected icon CSS class
 */
@Output()
iconChange = new EventEmitter<string | null>();

/**
 * Emitted when dropdown opens.
 */
@Output()
dropdownOpened = new EventEmitter<void>();

/**
 * Emitted when dropdown closes.
 */
@Output()
dropdownClosed = new EventEmitter<void>();
```

### Public Methods

```typescript
/**
 * Programmatically open the dropdown.
 */
public open(): void;

/**
 * Programmatically close the dropdown.
 */
public close(): void;

/**
 * Clear the current selection.
 */
public clear(): void;

/**
 * Get icon definitions filtered by search term.
 */
public getFilteredIcons(searchTerm: string): IconDefinition[];
```

---

## 6. MenuItemEditorComponent (Modal)

**Responsibility**: Modal form for editing menu item label and icon.

### Component Signature

```typescript
@Component({
  selector: 'app-menu-item-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItemEditorComponent implements OnInit
```

### Injectable Properties (Set by Parent)

```typescript
/**
 * Menu item to edit (passed via modalRef.componentInstance).
 * If null, modal is in "create" mode.
 */
public menuItem?: MenuItem;

/**
 * Whether this is a new item (vs editing existing).
 * Determines modal title and button text.
 */
public isNewItem: boolean = false;
```

### Form Structure

```typescript
// Reactive form
menuItemForm = new FormGroup({
  label: new FormControl<string>("", {
    validators: [Validators.required, Validators.minLength(1)],
    nonNullable: true,
  }),
  icon: new FormControl<string | null>(null),
  routerLink: new FormControl<string | null>(null),
});
```

### Public Methods

```typescript
/**
 * Initialize form with menu item data.
 */
ngOnInit(): void;

/**
 * Save changes and close modal with result.
 * Validates form before closing.
 */
public onSave(): void;

/**
 * Cancel editing and dismiss modal.
 */
public onCancel(): void;

/**
 * Get validation error message for a form field.
 */
public getErrorMessage(fieldName: string): string;
```

### Modal Result

```typescript
/**
 * Data returned on successful save.
 */
export interface MenuItemEditorResult {
  /**
   * Updated/created menu item data.
   */
  label: string;
  icon: string | null;
  routerLink: string | null;
}
```

---

## 7. DeleteConfirmationComponent (Modal)

**Responsibility**: Confirmation modal for delete operations with parent item
handling.

### Component Signature

```typescript
@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteConfirmationComponent
```

### Injectable Properties

```typescript
/**
 * Item to delete (passed via modalRef.componentInstance).
 */
public menuItem!: MenuItem;

/**
 * Whether this is a parent item with children.
 * Determines which options to show.
 */
public hasChildren: boolean = false;

/**
 * Number of children (for display in message).
 */
public childCount?: number;
```

### Public Methods

```typescript
/**
 * User chose to cascade delete (remove all children).
 */
public onCascadeDelete(): void; // closes with { action: 'cascade' }

/**
 * User chose to promote children (move to parent's level).
 */
public onPromoteChildren(): void; // closes with { action: 'promote' }

/**
 * User chose to delete (simple case, no children).
 */
public onDelete(): void; // closes with { action: 'delete' }

/**
 * User cancelled the operation.
 */
public onCancel(): void; // dismisses modal
```

### Modal Result

```typescript
/**
 * Data returned on confirmation.
 */
export interface DeleteConfirmationResult {
  /**
   * Action chosen by user.
   */
  action: "delete" | "cascade" | "promote";

  /**
   * The menu item being deleted.
   */
  menuItem: MenuItem;
}
```

---

## 8. AddSubmenuComponent (Modal)

**Responsibility**: Modal for creating multi-level menu hierarchies in one
operation.

### Component Signature

```typescript
@Component({
  selector: 'app-add-submenu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSubmenuComponent implements OnInit
```

### Injectable Properties

```typescript
/**
 * Parent menu item (passed via modalRef.componentInstance).
 * New items will be added as children of this item.
 */
public parentItem!: MenuItem;
```

### Form Structure

```typescript
/**
 * FormArray for multi-level item creation.
 * Each FormGroup represents one level in hierarchy.
 */
submenuForm = new FormGroup({
  items: new FormArray<
    FormGroup<{
      label: FormControl<string>;
      icon: FormControl<string | null>;
      routerLink: FormControl<string | null>;
      level: FormControl<number>;
    }>
  >([]),
});
```

### Public Methods

```typescript
/**
 * Initialize form with first empty item.
 */
ngOnInit(): void;

/**
 * Add another level to the form (creates child of previous item).
 */
public addLevel(): void;

/**
 * Remove a level from the form.
 * @param index - Index in FormArray to remove
 */
public removeLevel(index: number): void;

/**
 * Save the entire hierarchy and close modal.
 * Validates all form groups before closing.
 */
public onSave(): void;

/**
 * Cancel without saving.
 */
public onCancel(): void;

/**
 * Get the form group at a specific index.
 */
public getItemFormGroup(index: number): FormGroup;

/**
 * Check if a level can be removed (min 1 item required).
 */
public canRemoveLevel(index: number): boolean;
```

### Modal Result

```typescript
/**
 * Data returned on successful save.
 */
export interface AddSubmenuResult {
  /**
   * Array of menu items to add, in hierarchy order.
   * First item is direct child of parentItem.
   * Subsequent items are nested children.
   */
  items: Array<{
    label: string;
    icon: string | null;
    routerLink: string | null;
    level: number; // 0 = direct child, 1 = grandchild, etc.
  }>;

  /**
   * Parent item ID (for validation).
   */
  parentId: string;
}
```

---

## 9. Service Interfaces

### MenuDataService

```typescript
@Injectable({ providedIn: "root" })
export class MenuDataService {
  /**
   * Load menu structure from localStorage or defaults.
   */
  public loadMenuStructure(): MenuStructure;

  /**
   * Save menu structure to localStorage.
   */
  public saveMenuStructure(structure: MenuStructure): void;

  /**
   * Add a new menu item.
   * @param item - Item to add
   * @param parentId - Parent item ID (null for root level)
   */
  public addMenuItem(item: MenuItem, parentId: string | null): void;

  /**
   * Update an existing menu item.
   */
  public updateMenuItem(itemId: string, updates: Partial<MenuItem>): void;

  /**
   * Delete a menu item.
   * @param itemId - ID of item to delete
   * @param cascadeDelete - If true, delete children; if false, promote children
   */
  public deleteMenuItem(itemId: string, cascadeDelete: boolean): void;

  /**
   * Reorder items via drag-drop.
   */
  public reorderItems(context: DragDropContext): DragDropValidation;

  /**
   * Get menu item by ID.
   */
  public getItemById(itemId: string): MenuItem | null;

  /**
   * Get parent of a menu item.
   */
  public getParentItem(itemId: string): MenuItem | null;
}
```

### MenuValidationService

```typescript
@Injectable({ providedIn: "root" })
export class MenuValidationService {
  /**
   * Check if dropping an item would create circular reference.
   */
  public wouldCreateCircularReference(
    draggedItem: MenuItem,
    targetParent: MenuItem | null,
  ): boolean;

  /**
   * Check if dropping would exceed maximum depth.
   */
  public wouldExceedMaxDepth(
    draggedItem: MenuItem,
    targetParent: MenuItem | null,
    currentStructure: MenuStructure,
  ): boolean;

  /**
   * Validate a complete drag-drop operation.
   */
  public validateDrop(context: DragDropContext): DragDropValidation;

  /**
   * Validate menu item data before save.
   */
  public validateMenuItem(item: Partial<MenuItem>): ValidationResult;
}
```

---

## Testing Contracts

### Mock Data Providers

```typescript
/**
 * Provides mock menu structures for testing.
 */
export class MenuMockDataService {
  /**
   * Simple flat menu (no nesting).
   */
  public static getFlatMenu(): MenuItem[];

  /**
   * 3-level hierarchical menu.
   */
  public static getHierarchicalMenu(): MenuItem[];

  /**
   * Maximum depth menu (5 levels).
   */
  public static getMaxDepthMenu(): MenuItem[];

  /**
   * Large menu (50+ items).
   */
  public static getLargeMenu(): MenuItem[];
}
```

### Test Utilities

```typescript
/**
 * Component testing utilities.
 */
export class MenuTestUtils {
  /**
   * Find menu item by label in rendered template.
   */
  public static findItemByLabel(
    fixture: ComponentFixture<any>,
    label: string,
  ): DebugElement | null;

  /**
   * Simulate drag-drop operation.
   */
  public static simulateDragDrop(
    fixture: ComponentFixture<any>,
    draggedItemId: string,
    targetItemId: string,
  ): void;

  /**
   * Trigger hover behavior (mouseenter/mouseleave).
   */
  public static simulateHover(
    fixture: ComponentFixture<any>,
    element: DebugElement,
    duration: number,
  ): Promise<void>;
}
```

---

## Component Communication Flow

```
User Action
    ↓
MenuItemComponent (emits event)
    ↓
SidebarMenuComponent (handles, emits higher-level event)
    ↓
JiraSidebarContainerComponent (updates state)
    ↓
State Change (signals)
    ↓
Template Updates (via computed signals)
    ↓
Child Components Re-render (OnPush)
```

## Error Handling

All components should:

- Emit typed errors through dedicated error outputs
- Log errors to console in development mode
- Show user-friendly error messages via toast/snackbar
- Gracefully degrade functionality when errors occur

## Accessibility Requirements

All components must:

- Support keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Provide ARIA labels for icon-only buttons
- Announce state changes to screen readers
- Maintain focus management in modals
- Support high contrast mode
