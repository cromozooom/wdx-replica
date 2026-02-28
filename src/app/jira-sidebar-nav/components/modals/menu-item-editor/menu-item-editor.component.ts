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
  FormGroup,
  Validators,
} from "@angular/forms";
import { NgbActiveOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { MenuItem } from "../../../models/menu-item.interface";
import { IconPickerComponent } from "../../icon-picker/icon-picker.component.js";

/**
 * Modal component for creating and editing menu items.
 * Provides a form with label and icon inputs.
 *
 * Usage:
 * - Create new item: Pass undefined or empty menuItem
 * - Edit existing: Pass populated menuItem
 *
 * @component MenuItemEditorComponent
 * @standalone
 */
@Component({
  selector: "app-menu-item-editor",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconPickerComponent],
  templateUrl: "./menu-item-editor.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemEditorComponent implements OnInit {
  /**
   * Menu item to edit. Undefined for new item creation.
   */
  @Input() menuItem?: MenuItem;

  /**
   * Parent menu item when adding a child. Used for content config transfer.
   */
  @Input() parentItem?: MenuItem;

  /**
   * Reactive form for menu item editing.
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
    // Default content configuration for new items
    const defaultContentConfig = {
      componentType: "widget",
      settings: {
        widgetName: "New Widget",
        apiEndpoint: "/api/example",
        refreshInterval: 30000,
      },
    };

    // Initialize form with validators
    this.form = this.fb.group({
      label: ["", [Validators.required, Validators.minLength(1)]],
      icon: [""],
      contentConfig: [JSON.stringify(defaultContentConfig, null, 2)],
    });
  }

  ngOnInit(): void {
    // Populate form if editing existing item
    if (this.menuItem) {
      this.form.patchValue({
        label: this.menuItem.label,
        icon: this.menuItem.icon || "",
        contentConfig: this.menuItem.contentConfig
          ? JSON.stringify(this.menuItem.contentConfig, null, 2)
          : this.form.get("contentConfig")?.value,
      });
    } else {
      // Check if parent has contentConfig to transfer
      if (this.parentItem?.contentConfig) {
        console.log(
          "[MenuItemEditor] Parent has contentConfig, transferring:",
          this.parentItem.contentConfig,
        );
        this.form.patchValue({
          contentConfig: JSON.stringify(this.parentItem.contentConfig, null, 2),
        });
      }

      // For new items, update widgetName to match label when it changes
      this.form.get("label")?.valueChanges.subscribe((label) => {
        try {
          const config = JSON.parse(
            this.form.get("contentConfig")?.value || "{}",
          );
          if (config.settings) {
            config.settings.widgetName = label || "New Widget";
            this.form.patchValue(
              { contentConfig: JSON.stringify(config, null, 2) },
              { emitEvent: false },
            );
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      });
    }
  }

  /**
   * Handle icon selection from IconPickerComponent.
   */
  onIconChange(iconClass: string): void {
    this.form.patchValue({ icon: iconClass });
  }

  /**
   * Save form and close modal with result.
   */
  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validate JSON before saving
    if (this.contentConfigError) {
      return;
    }

    const formValue = this.form.value;
    const result: Partial<MenuItem> = {
      label: formValue.label.trim(),
      icon: formValue.icon || undefined,
    };

    // Parse and include contentConfig
    try {
      const contentConfig = JSON.parse(formValue.contentConfig);
      result.contentConfig = contentConfig;
      console.log("[MODAL] Saving contentConfig:", contentConfig);
    } catch (e) {
      // If invalid JSON, don't include contentConfig
      console.error("Invalid contentConfig JSON:", e);
    }

    // Include ID if editing existing item
    if (this.menuItem) {
      result.id = this.menuItem.id;
    }

    console.log("[MODAL] Final result:", result);
    this.activeOffcanvas.close(result);
  }

  /**
   * Cancel editing and dismiss modal.
   */
  onCancel(): void {
    this.activeOffcanvas.dismiss("cancel");
  }

  /**
   * Get label validation error message.
   */
  get labelError(): string | null {
    const control = this.form.get("label");
    if (control?.hasError("required") && control.touched) {
      return "Label is required";
    }
    if (control?.hasError("minlength") && control.touched) {
      return "Label must not be empty";
    }
    return null;
  }

  /**
   * Get contentConfig validation error message.
   */
  get contentConfigError(): string | null {
    const control = this.form.get("contentConfig");
    if (!control?.value) {
      return null;
    }
    try {
      JSON.parse(control.value);
      return null;
    } catch (e) {
      return "Invalid JSON format";
    }
  }

  /**
   * Check if form is valid.
   */
  get isValid(): boolean {
    return this.form.valid && this.contentConfigError === null;
  }
}
