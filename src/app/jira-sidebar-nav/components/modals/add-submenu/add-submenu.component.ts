import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
} from "@angular/forms";
import { NgbActiveOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { MenuItem } from "../../../models/menu-item.interface";
import { IconPickerComponent } from "../../icon-picker/icon-picker.component.js";

/**
 * Modal component for creating multi-level menu hierarchies.
 * Allows users to define parent > child > grandchild structure in one operation.
 *
 * Usage:
 * - Pass parentItem to attach the new hierarchy under
 * - User can add multiple levels with label + icon
 * - Returns nested MenuItem structure on save
 *
 * @component AddSubmenuComponent
 * @standalone
 */
@Component({
  selector: "app-add-submenu",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconPickerComponent],
  templateUrl: "./add-submenu.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSubmenuComponent implements OnInit {
  /**
   * Parent menu item to attach new hierarchy under (null for root level).
   */
  @Input() parentItem: MenuItem | null = null;

  /**
   * Reactive form with FormArray for multiple levels.
   */
  readonly form: FormGroup;

  /**
   * Offcanvas instance for closing/dismissing.
   */
  private readonly activeOffcanvas = inject(NgbActiveOffcanvas);

  /**
   * Form builder injection.
   */
  private readonly fb = inject(FormBuilder);

  constructor() {
    // Initialize form with FormArray for levels
    this.form = this.fb.group({
      levels: this.fb.array([this.createLevelFormGroup()]),
      contentConfig: [""],
    });
  }

  /**
   * Initialize component after inputs are set.
   */
  ngOnInit(): void {
    // If parent has contentConfig, pre-populate it for transfer
    if (this.parentItem?.contentConfig) {
      console.log(
        "[AddSubmenu] Parent has contentConfig:",
        this.parentItem.contentConfig,
      );
      const contentConfigJson = JSON.stringify(
        this.parentItem.contentConfig,
        null,
        2,
      );
      this.form.patchValue({ contentConfig: contentConfigJson });
      console.log("[AddSubmenu] Form patched with:", contentConfigJson);
    } else {
      console.log("[AddSubmenu] No parent contentConfig found");
    }
  }

  /**
   * Get levels FormArray.
   */
  get levels(): FormArray {
    return this.form.get("levels") as FormArray;
  }

  /**
   * Create a new FormGroup for a level with label and icon.
   */
  private createLevelFormGroup(): FormGroup {
    return this.fb.group({
      label: ["", [Validators.required, Validators.minLength(1)]],
      icon: [""],
    });
  }

  /**
   * Add another level to the hierarchy (T060).
   */
  addLevel(): void {
    this.levels.push(this.createLevelFormGroup());
  }

  /**
   * Remove a level from the hierarchy (T060).
   */
  removeLevel(index: number): void {
    if (this.levels.length > 1) {
      this.levels.removeAt(index);
    }
  }

  /**
   * Handle icon selection for a specific level.
   */
  onIconChange(index: number, iconClass: string): void {
    const level = this.levels.at(index);
    level.patchValue({ icon: iconClass });
  }

  /**
   * Save form and close modal with nested structure (T061).
   */
  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validate contentConfig JSON if present
    if (this.contentConfigError) {
      return;
    }

    const levelsData = this.levels.value;
    const contentConfigValue = this.form.get("contentConfig")?.value;

    // Parse contentConfig if present
    let contentConfig = undefined;
    if (contentConfigValue?.trim()) {
      try {
        contentConfig = JSON.parse(contentConfigValue);
      } catch (e) {
        return; // Should not happen due to validation
      }
    }

    // Build nested MenuItem structure
    const hierarchy = this.buildNestedStructure(levelsData, contentConfig);

    this.activeOffcanvas.close(hierarchy);
  }

  /**
   * Build nested MenuItem structure from form array (T061).
   *
   * @param levelsData - Array of level data from form
   * @param contentConfig - Optional content configuration for the leaf node
   * @returns Root MenuItem with nested children
   */
  private buildNestedStructure(
    levelsData: Array<{ label: string; icon: string }>,
    contentConfig?: any,
  ): MenuItem {
    // Build from bottom up (reverse order)
    let currentItem: MenuItem | undefined;

    for (let i = levelsData.length - 1; i >= 0; i--) {
      const levelData = levelsData[i];
      const newItem: MenuItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: levelData.label.trim(),
        icon: levelData.icon || undefined,
        order: 0,
        expanded: false,
      };

      // If this is the last item (leaf) and contentConfig is provided, add it
      if (i === levelsData.length - 1 && contentConfig) {
        newItem.contentConfig = contentConfig;
      }

      // If this is not the last item, add previous item as child
      if (currentItem) {
        newItem.children = [currentItem];
      }

      currentItem = newItem;
    }

    return currentItem!;
  }

  /**
   * Cancel and dismiss modal.
   */
  onCancel(): void {
    this.activeOffcanvas.dismiss("cancel");
  }

  /**
   * Get label error message for a specific level.
   */
  getLabelError(index: number): string | null {
    const control = this.levels.at(index).get("label");
    if (control?.hasError("required") && control.touched) {
      return "Label is required";
    }
    if (control?.hasError("minlength") && control.touched) {
      return "Label must not be empty";
    }
    return null;
  }

  /**
   * Check if form is valid.
   */
  get isValid(): boolean {
    return this.form.valid && !this.contentConfigError;
  }

  /**
   * Get maximum number of levels allowed.
   */
  get maxLevels(): number {
    return 5; // Maximum depth is 5 levels (FR-033)
  }

  /**
   * Check if can add more levels.
   */
  get canAddLevel(): boolean {
    return this.levels.length < this.maxLevels;
  }

  /**
   * Get contentConfig validation error.
   */
  get contentConfigError(): string | null {
    const control = this.form.get("contentConfig");
    const value = control?.value;

    if (!value || !value.trim()) {
      return null; // Empty is valid
    }

    try {
      JSON.parse(value);
      return null;
    } catch (e) {
      return "Invalid JSON format";
    }
  }

  /**
   * Check if should show contentConfig field.
   * Shows when parent has contentConfig to transfer.
   */
  get showContentConfig(): boolean {
    return !!this.parentItem?.contentConfig;
  }
}
