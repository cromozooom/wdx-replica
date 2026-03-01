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
import { NgbActiveOffcanvas, NgbModal } from "@ng-bootstrap/ng-bootstrap";
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
  styleUrl: "./menu-item-editor.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemEditorComponent implements OnInit {
  /**
   * Menu item to edit. Undefined for new item creation.
   */
  @Input() menuItem?: MenuItem;

  /**
   * Reactive form for menu item editing.
   */
  readonly form: FormGroup;

  /**
   * Offcanvas instance for closing/dismissing.
   */
  private readonly activeOffcanvas = inject(NgbActiveOffcanvas);

  /**
   * Modal service for confirmation dialogs.
   */
  private readonly modalService = inject(NgbModal);

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
    } catch (e) {
      // If invalid JSON, don't include contentConfig
    }

    // Include ID if editing existing item
    if (this.menuItem) {
      result.id = this.menuItem.id;
    }

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

  /**
   * Copy content configuration to clipboard.
   */
  async copyConfig(): Promise<void> {
    const config = this.form.get("contentConfig")?.value;
    if (!config) {
      alert("No configuration to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(config);
      // Could show a toast notification here
      console.log("Configuration copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy configuration to clipboard");
    }
  }

  /**
   * Paste content configuration from clipboard with confirmation.
   */
  async pasteConfig(confirmModal: any): Promise<void> {
    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText || clipboardText.trim() === "") {
        alert("Clipboard is empty");
        return;
      }

      // Validate JSON
      try {
        JSON.parse(clipboardText);
      } catch (e) {
        alert("Clipboard does not contain valid JSON");
        return;
      }

      // Open confirmation modal
      this.modalService.open(confirmModal, { centered: true }).result.then(
        () => {
          // User confirmed - paste the config
          this.form.patchValue({ contentConfig: clipboardText });
        },
        () => {
          // User cancelled - do nothing
        },
      );
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      alert("Failed to read from clipboard. Please check browser permissions.");
    }
  }
}
